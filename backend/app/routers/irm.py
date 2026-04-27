from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
import os
import uuid
import gzip
import nibabel as nib
import numpy as np
import io
import tempfile
import cloudinary
import cloudinary.uploader

from app.models.documents import IRMScan, Patient, VisiteClinique
from app.core.auth import get_current_user

router = APIRouter()
viewer_router = APIRouter()

FORMATS_VALIDES = [".nii", ".nii.gz", ".dcm"]
TAILLE_MAX_MB = 500

# ─── Configuration Cloudinary ────────────────────────────────────────────────
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


# ─── Helpers ────────────────────────────────────────────────────────────────

def serialize(irm: IRMScan) -> dict:
    return {
        "id": str(irm.id),
        "patient_id": irm.patient_id,
        "visite_id": irm.visite_id,
        "fichier_path": irm.fichier_path,
        "fichier_url": irm.fichier_path,
        "chemin_fichier": irm.fichier_path,
        "sequence_type": irm.sequence_type,
        "format_fichier": irm.metadata_dicom.get("format") if irm.metadata_dicom else None,
        "metadata": irm.metadata_dicom,
        "statut": irm.statut,
        "uploaded_at": str(irm.uploaded_at) if irm.uploaded_at else None,
        "rapport": irm.rapport,
        "radiologue_id": irm.radiologue_id,
        "radiologue_nom": irm.radiologue_nom,
        "envoi_medecin_id": irm.envoi_medecin_id,
        "envoye_at": str(irm.envoye_at) if irm.envoye_at else None,
    }


def compresser_si_necessaire(contenu: bytes, nom: str) -> tuple:
    """Compresse en .nii.gz si le fichier dépasse 8 MB et n'est pas déjà compressé"""
    taille_mb = len(contenu) / (1024 * 1024)
    if taille_mb > 8 and nom.endswith(".nii"):
        print(f"Compression de {nom} ({taille_mb:.1f} MB)...")
        contenu_gz = gzip.compress(contenu, compresslevel=6)
        taille_apres = len(contenu_gz) / (1024 * 1024)
        print(f"Après compression : {taille_apres:.1f} MB")
        return contenu_gz, nom + ".gz"
    return contenu, nom


def extraire_metadata_nii(contenu: bytes, nom_fichier: str) -> dict:
    suffix = ".nii.gz" if nom_fichier.endswith(".nii.gz") else ".nii"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contenu)
        tmp_path = tmp.name
    try:
        img = nib.load(tmp_path)
        shape = img.shape
        header = img.header
        metadata = {
            "format": "NIfTI",
            "dimensions": list(shape),
            "nb_slices": int(shape[2]) if len(shape) >= 3 else None,
            "hauteur": int(shape[0]) if len(shape) >= 1 else None,
            "largeur": int(shape[1]) if len(shape) >= 2 else None,
            "resolution_mm": [round(float(v), 2) for v in header.get_zooms()[:3]],
            "taille_mb": round(len(contenu) / (1024 * 1024), 2),
            "nom_original": nom_fichier,
        }
    finally:
        os.unlink(tmp_path)
    return metadata


async def _charger_nii_depuis_cloudinary(irm: IRMScan) -> nib.Nifti1Image:
    """Télécharge le fichier NIfTI depuis Cloudinary et le charge en mémoire"""
    import httpx
    url = irm.fichier_path
    if not url or not url.startswith("http"):
        raise HTTPException(status_code=404, detail="URL Cloudinary invalide")

    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=120.0)
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Fichier IRM introuvable sur Cloudinary")
        contenu = response.content

    nom = irm.metadata_dicom.get("nom_original", "irm.nii.gz") if irm.metadata_dicom else "irm.nii.gz"
    # Le fichier stocké est toujours .nii.gz (compressé)
    suffix = ".nii.gz" if nom.endswith(".nii.gz") or nom.endswith(".nii") else ".nii.gz"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contenu)
        tmp_path = tmp.name
    try:
        img = nib.load(tmp_path)
        img = nib.as_closest_canonical(img)
        return img
    finally:
        os.unlink(tmp_path)


# ════════════════════════════════════════════════════════════════════════════
# ROUTER PATIENT  →  monté sur /api/patients
# ════════════════════════════════════════════════════════════════════════════

@router.post("/{patient_id}/irm", status_code=201)
async def upload_irm(
    patient_id: str,
    fichier: UploadFile = File(...),
    visite_id: Optional[str] = Query(None),
    sequence_type: Optional[str] = Query("T1"),
    current_user=Depends(get_current_user)
):
    # 1. Vérifier patient
    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouvé")

    # 2. Vérifier format
    nom = fichier.filename
    ext = ".nii.gz" if nom.endswith(".nii.gz") else os.path.splitext(nom)[1].lower()
    if ext not in FORMATS_VALIDES:
        raise HTTPException(status_code=400, detail=f"Format non supporté : {ext}")

    # 3. Lire contenu
    contenu = await fichier.read()
    taille_mb = len(contenu) / (1024 * 1024)
    if taille_mb > TAILLE_MAX_MB:
        raise HTTPException(status_code=400, detail=f"Fichier trop grand : {taille_mb:.1f} MB (max {TAILLE_MAX_MB} MB)")

    # 4. Extraire métadonnées (depuis le fichier original avant compression)
    try:
        metadata = extraire_metadata_nii(contenu, nom)
    except Exception as e:
        metadata = {"format": ext, "nom_original": nom, "erreur": str(e)}

    # 5. Vérifier doublon
    existant = await IRMScan.find_one({
        "patient_id": patient_id,
        "metadata_dicom.nom_original": nom
    })
    if existant:
        raise HTTPException(
            status_code=409,
            detail=f"Ce fichier existe déjà pour ce patient avec l'ID : {str(existant.id)}"
        )

    # 6. Compresser si nécessaire (limite Cloudinary = 10 MB)
    contenu_upload, nom_upload = compresser_si_necessaire(contenu, nom)
    taille_upload_mb = len(contenu_upload) / (1024 * 1024)

    if taille_upload_mb > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux même après compression : {taille_upload_mb:.1f} MB. Maximum : 10 MB."
        )

    # 7. Upload vers Cloudinary
    try:
        fichier_uid = str(uuid.uuid4())
        upload_result = cloudinary.uploader.upload(
            io.BytesIO(contenu_upload),
            public_id=f"neuro_predict_ms/irm/{patient_id}/{fichier_uid}",
            resource_type="raw",
        )
        cloudinary_url = upload_result["secure_url"]
        cloudinary_public_id = upload_result["public_id"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur upload Cloudinary : {str(e)}")

    # 8. Créer document IRMScan
    irm_doc = IRMScan(
        patient_id=patient_id,
        visite_id=visite_id,
        dicom_uid=cloudinary_public_id,
        fichier_path=cloudinary_url,
        sequence_type=sequence_type,
        metadata_dicom=metadata,
        statut="en_attente",
        radiologue_id=str(current_user.id) if current_user else None,
    )
    await irm_doc.insert()

    # 9. Lier à la visite si fournie
    if visite_id:
        visite = await VisiteClinique.get(visite_id)
        if visite:
            if not visite.irm_ids:
                visite.irm_ids = []
            visite.irm_ids.append(str(irm_doc.id))
            await visite.save()

    return {"message": "IRM uploadée avec succès", "irm": serialize(irm_doc)}


@router.get("/{patient_id}/irm")
async def liste_irm_patient(
    patient_id: str,
    current_user=Depends(get_current_user)
):
    irms = await IRMScan.find(IRMScan.patient_id == patient_id).to_list()
    return [serialize(irm) for irm in irms]


@router.get("/{patient_id}/irm/{irm_id}")
async def get_irm(
    patient_id: str,
    irm_id: str,
    current_user=Depends(get_current_user)
):
    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="IRM non trouvée")
    return serialize(irm)


@router.delete("/{patient_id}/irm/{irm_id}")
async def delete_irm(
    patient_id: str,
    irm_id: str,
    current_user=Depends(get_current_user)
):
    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="IRM non trouvée")
    try:
        if irm.dicom_uid:
            cloudinary.uploader.destroy(irm.dicom_uid, resource_type="raw")
    except Exception:
        pass
    await irm.delete()
    return {"message": "IRM supprimée avec succès"}


@router.get("/{patient_id}/irm/{irm_id}/fichier")
async def servir_fichier_irm(
    patient_id: str,
    irm_id: str,
    token: Optional[str] = Query(None),
):
    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="IRM non trouvée")

    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get(irm.fichier_path, timeout=120.0)
        contenu = response.content

    nom = (irm.metadata_dicom or {}).get("nom_original", f"irm_{irm_id}.nii.gz")
    media_type = "application/gzip" if nom.endswith(".nii.gz") else "application/octet-stream"

    return StreamingResponse(
        io.BytesIO(contenu),
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{nom}"',
            "Content-Length": str(len(contenu)),
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Content-Length, Content-Disposition",
        }
    )


@router.get("/{patient_id}/irm/{irm_id}/download")
async def download_irm(
    patient_id: str,
    irm_id: str,
    current_user=Depends(get_current_user)
):
    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="IRM non trouvée")

    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get(irm.fichier_path, timeout=120.0)
        contenu = response.content

    nom = (irm.metadata_dicom or {}).get("nom_original", f"irm_{irm_id}.nii.gz")
    return StreamingResponse(
        io.BytesIO(contenu),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{nom}"'}
    )


@router.post("/{patient_id}/irm/{irm_id}/rapport")
async def ajouter_rapport(
    patient_id: str,
    irm_id: str,
    rapport: dict,
    current_user=Depends(get_current_user)
):
    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="IRM non trouvée")
    irm.rapport = rapport
    irm.statut = "analysee"
    irm.radiologue_id = str(current_user.id)
    irm.radiologue_nom = f"{current_user.prenom} {current_user.nom}"
    await irm.save()
    return {"message": "Rapport sauvegardé avec succès", "irm_id": irm_id}


@router.get("/{patient_id}/irm/{irm_id}/rapport")
async def get_rapport(patient_id: str, irm_id: str):
    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="IRM non trouvée")
    if not irm.rapport:
        raise HTTPException(status_code=404, detail="Aucun rapport pour cette IRM")
    return irm.rapport


@router.post("/{patient_id}/irm/{irm_id}/envoyer")
async def envoyer_rapport(
    patient_id: str,
    irm_id: str,
    body: dict,
    current_user=Depends(get_current_user)
):
    from datetime import datetime
    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="IRM non trouvée")
    if not irm.rapport:
        raise HTTPException(status_code=400, detail="Aucun rapport à envoyer.")
    medecin_id = body.get("medecin_id")
    if not medecin_id:
        raise HTTPException(status_code=400, detail="medecin_id obligatoire")
    irm.envoi_medecin_id = medecin_id
    irm.envoye_at = datetime.utcnow()
    await irm.save()
    return {"message": "Rapport envoyé au médecin", "irm_id": irm_id}


@router.get("/rapports/recus")
async def get_rapports_recus(current_user=Depends(get_current_user)):
    if current_user.role not in ["medecin", "admin"]:
        raise HTTPException(403, "Accès réservé au médecin")
    irms = await IRMScan.find(IRMScan.envoi_medecin_id == str(current_user.id)).to_list()
    result = []
    for irm in irms:
        patient = await Patient.get(irm.patient_id)
        d = serialize(irm)
        d["patient_nom"] = f"{patient.prenom} {patient.nom}" if patient else "Inconnu"
        result.append(d)
    result.sort(key=lambda x: x["envoye_at"] or x["uploaded_at"], reverse=True)
    return result


@router.get("/irm/toutes")
async def get_toutes_irms(current_user=Depends(get_current_user)):
    if current_user.role not in ["radiologue", "admin"]:
        raise HTTPException(403, "Accès réservé au radiologue")
    irms = await IRMScan.find_all().to_list()
    result = []
    for irm in irms:
        patient = await Patient.get(irm.patient_id)
        d = serialize(irm)
        d["patient_nom"] = f"{patient.prenom} {patient.nom}" if patient else "Inconnu"
        result.append(d)
    return result


@router.get("/{patient_id}/irm/{irm_id}/coupe")
async def get_coupe_irm(
    patient_id: str,
    irm_id: str,
    coupe: int = Query(None),
):
    import base64
    from PIL import Image

    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(404, "IRM non trouvée")

    img = await _charger_nii_depuis_cloudinary(irm)
    data = np.squeeze(img.get_fdata().astype(np.float32))
    n = data.shape[2] if len(data.shape) == 3 else 1
    idx = coupe if coupe is not None else n // 2
    idx = min(max(idx, 0), n - 1)

    coupe_data = data[:, :, idx] if len(data.shape) == 3 else data
    std = coupe_data.std()
    coupe_norm = (coupe_data - coupe_data.mean()) / std if std > 0 else coupe_data
    coupe_uint8 = ((coupe_norm - coupe_norm.min()) /
                   (coupe_norm.max() - coupe_norm.min() + 1e-6) * 255).astype(np.uint8)

    pil_img = Image.fromarray(coupe_uint8).resize((256, 256), Image.BILINEAR)
    buffer = io.BytesIO()
    pil_img.save(buffer, format='PNG')
    b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return {
        "image": f"data:image/png;base64,{b64}",
        "coupe_actuelle": idx,
        "nb_coupes": n,
        "sequence_type": irm.sequence_type,
    }


@router.get("/{patient_id}/irm/comparer/")
async def comparer_irms(
    patient_id: str,
    irm1_id: str = Query(...),
    irm2_id: str = Query(...),
    coupe: int = Query(None),
    current_user=Depends(get_current_user)
):
    import base64
    from PIL import Image

    async def extraire_coupe_b64(irm_id: str, coupe_idx: int = None):
        irm = await IRMScan.get(irm_id)
        if not irm or irm.patient_id != patient_id:
            raise HTTPException(404, f"IRM {irm_id} non trouvée")
        img = await _charger_nii_depuis_cloudinary(irm)
        data = np.squeeze(img.get_fdata().astype(np.float32))
        n = data.shape[2] if len(data.shape) == 3 else 1
        idx = coupe_idx if coupe_idx is not None else n // 2
        idx = min(idx, n - 1)
        coupe_data = data[:, :, idx] if len(data.shape) == 3 else data
        std = coupe_data.std()
        coupe_norm = (coupe_data - coupe_data.mean()) / std if std > 0 else coupe_data
        coupe_uint8 = ((coupe_norm - coupe_norm.min()) /
                       (coupe_norm.max() - coupe_norm.min() + 1e-6) * 255).astype(np.uint8)
        pil_img = Image.fromarray(coupe_uint8).resize((256, 256), Image.BILINEAR)
        buffer = io.BytesIO()
        pil_img.save(buffer, format='PNG')
        b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return {
            "irm_id": irm_id,
            "image": f"data:image/png;base64,{b64}",
            "sequence_type": irm.sequence_type,
            "uploaded_at": str(irm.uploaded_at),
            "n_coupes": n,
            "coupe_actuelle": idx
        }

    irm1_data = await extraire_coupe_b64(irm1_id, coupe)
    irm2_data = await extraire_coupe_b64(irm2_id, coupe)
    return {
        "irm1": irm1_data,
        "irm2": irm2_data,
        "coupe": coupe if coupe is not None else irm1_data["n_coupes"] // 2
    }


# ════════════════════════════════════════════════════════════════════════════
# VIEWER ROUTER  →  monté sur /api/predictions
# ════════════════════════════════════════════════════════════════════════════

@viewer_router.get("/viewer/{irm_id}/info")
async def viewer_info(irm_id: str, current_user=Depends(get_current_user)):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(status_code=404, detail="IRM non trouvée")
    img = await _charger_nii_depuis_cloudinary(irm)
    shape = img.shape
    return {
        "irm_id": irm_id,
        "shape": list(shape),
        "nb_slices_axial":    int(shape[2]) if len(shape) >= 3 else 0,
        "nb_slices_coronal":  int(shape[1]) if len(shape) >= 2 else 0,
        "nb_slices_sagittal": int(shape[0]) if len(shape) >= 1 else 0,
        "metadata": irm.metadata_dicom,
        "statut": irm.statut,
    }


@viewer_router.get("/viewer/{irm_id}/coupe/{plan}/{idx}")
async def viewer_coupe(
    irm_id: str,
    plan: str,
    idx: int,
    current_user=Depends(get_current_user)
):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(status_code=404, detail="IRM non trouvée")

    img = await _charger_nii_depuis_cloudinary(irm)
    data = img.get_fdata()

    if plan == "axial":
        idx = max(0, min(idx, data.shape[2] - 1))
        coupe = data[:, :, idx]
    elif plan == "coronal":
        idx = max(0, min(idx, data.shape[1] - 1))
        coupe = data[:, idx, :]
    elif plan == "sagittal":
        idx = max(0, min(idx, data.shape[0] - 1))
        coupe = data[idx, :, :]
    else:
        raise HTTPException(status_code=400, detail="Plan invalide. Utilise: axial, coronal, sagittal")

    coupe = np.rot90(coupe)
    vmin, vmax = np.percentile(coupe[coupe > 0], [2, 98]) if np.any(coupe > 0) else (0, 1)
    fig, ax = plt.subplots(figsize=(4, 4), dpi=100)
    ax.imshow(coupe, cmap="gray", vmin=vmin, vmax=vmax, aspect="auto")
    ax.axis("off")
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")
