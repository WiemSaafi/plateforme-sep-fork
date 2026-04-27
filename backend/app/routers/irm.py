from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
import os
import nibabel as nib
import numpy as np
import io
import tempfile
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson import ObjectId

from app.models.documents import IRMScan, Patient, VisiteClinique
from app.core.auth import get_current_user, get_current_user_optional
from app.core.database import get_db

router = APIRouter()

FORMATS_VALIDES = [".nii", ".nii.gz", ".dcm"]
TAILLE_MAX_MB = 500


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


def get_gridfs() -> AsyncIOMotorGridFSBucket:
    db = get_db()
    return AsyncIOMotorGridFSBucket(db, bucket_name="irm_files")


# ─── Upload IRM ─────────────────────────────────────────────────────────────

@router.post("/{patient_id}/irm")
async def upload_irm(
    patient_id: str,
    fichier: UploadFile = File(...),
    visite_id: Optional[str] = Query(None),
    sequence_type: Optional[str] = Query("T1"),
    current_user=Depends(get_current_user)
):
    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouvé")

    nom = fichier.filename
    ext = ".nii.gz" if nom.endswith(".nii.gz") else os.path.splitext(nom)[1].lower()
    if ext not in FORMATS_VALIDES:
        raise HTTPException(status_code=400, detail=f"Format non supporté : {ext}")

    contenu = await fichier.read()
    taille_mb = len(contenu) / (1024 * 1024)
    if taille_mb > TAILLE_MAX_MB:
        raise HTTPException(status_code=400, detail=f"Fichier trop grand : {taille_mb:.1f} MB (max {TAILLE_MAX_MB} MB)")

    try:
        metadata = extraire_metadata_nii(contenu, nom)
    except Exception as e:
        metadata = {"format": ext, "nom_original": nom, "erreur": str(e)}

    gridfs = get_gridfs()
    gridfs_id = await gridfs.upload_from_stream(
        filename=nom,
        source=io.BytesIO(contenu),
        metadata={
            "patient_id": patient_id,
            "sequence_type": sequence_type,
            "content_type": fichier.content_type or "application/octet-stream"
        }
    )

    irm = IRMScan(
        patient_id=patient_id,
        visite_id=visite_id,
        fichier_path=str(gridfs_id),
        sequence_type=sequence_type,
        metadata_dicom=metadata,
        statut="en_attente",
        radiologue_id=str(current_user.id) if current_user else None,
    )
    await irm.insert()

    if visite_id:
        visite = await VisiteClinique.get(visite_id)
        if visite:
            if not visite.irm_ids:
                visite.irm_ids = []
            visite.irm_ids.append(str(irm.id))
            await visite.save()

    return {"message": "IRM uploadée avec succès", "irm": serialize(irm)}


# ─── Télécharger le fichier IRM ──────────────────────────────────────────────

@router.get("/{patient_id}/irm/{irm_id}/download")
async def download_irm(
    patient_id: str,
    irm_id: str,
    current_user=Depends(get_current_user)
):
    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="IRM non trouvée")

    gridfs = get_gridfs()
    try:
        gridfs_stream = await gridfs.open_download_stream(ObjectId(irm.fichier_path))
    except Exception:
        raise HTTPException(status_code=404, detail="Fichier IRM introuvable dans le stockage")

    async def file_generator():
        while True:
            chunk = await gridfs_stream.read(1024 * 1024)
            if not chunk:
                break
            yield chunk

    nom_fichier = irm.metadata_dicom.get("nom_original", f"irm_{irm_id}.nii.gz") if irm.metadata_dicom else f"irm_{irm_id}.nii.gz"
    return StreamingResponse(
        file_generator(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{nom_fichier}"'}
    )


# ─── Servir le fichier pour Niivue ───────────────────────────────────────────

@router.get("/{patient_id}/irm/{irm_id}/fichier")
async def servir_fichier_irm(
    patient_id: str,
    irm_id: str,
    current_user=Depends(get_current_user_optional)
):
    irm = await IRMScan.get(irm_id)
    if not irm or irm.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="IRM non trouvée")

    if not irm.fichier_path:
        raise HTTPException(status_code=404, detail="Aucun fichier associé à cette IRM")

    gridfs = get_gridfs()
    try:
        gridfs_stream = await gridfs.open_download_stream(ObjectId(irm.fichier_path))
        contenu = await gridfs_stream.read()
    except Exception:
        raise HTTPException(status_code=404, detail="Fichier introuvable dans le stockage")

    nom_original = (irm.metadata_dicom or {}).get("nom_original", f"irm_{irm_id}.nii.gz")
    media_type = "application/gzip" if nom_original.endswith(".nii.gz") else "application/octet-stream"

    return StreamingResponse(
        io.BytesIO(contenu),
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{nom_original}"',
            "Content-Length": str(len(contenu)),
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Content-Length, Content-Disposition",
        }
    )


# ─── Viewer : charger NIfTI depuis GridFS ────────────────────────────────────

async def _charger_nii_depuis_gridfs(irm: IRMScan) -> nib.Nifti1Image:
    gridfs = get_gridfs()
    try:
        stream = await gridfs.open_download_stream(ObjectId(irm.fichier_path))
        contenu = await stream.read()
    except Exception:
        raise HTTPException(status_code=404, detail="Fichier IRM introuvable dans GridFS")

    suffix = ".nii.gz"
    if irm.metadata_dicom and irm.metadata_dicom.get("nom_original", "").endswith(".nii"):
        suffix = ".nii"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contenu)
        tmp_path = tmp.name
    try:
        img = nib.load(tmp_path)
        img = nib.as_closest_canonical(img)
        return img
    finally:
        os.unlink(tmp_path)


# ─── Viewer info ─────────────────────────────────────────────────────────────

@router.get("/predictions/viewer/{irm_id}/info")
async def viewer_info(irm_id: str):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(status_code=404, detail="IRM non trouvée")

    img = await _charger_nii_depuis_gridfs(irm)
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


# ─── Viewer coupe PNG ─────────────────────────────────────────────────────────

@router.get("/predictions/viewer/{irm_id}/coupe/{plan}/{idx}")
async def viewer_coupe(irm_id: str, plan: str, idx: int):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(status_code=404, detail="IRM non trouvée")

    img = await _charger_nii_depuis_gridfs(irm)
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


# ─── Liste IRM d'un patient ──────────────────────────────────────────────────

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
