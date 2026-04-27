from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.core.auth import get_current_user
from app.models.documents import IRMScan
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHECKPOINT_CLS  = os.path.join(BASE_DIR, "ai", "checkpoints", "resnet_classifier.pth")
CHECKPOINT_PRED = os.path.join(BASE_DIR, "ai", "checkpoints", "predictor_lesions_v2.pth")
CHECKPOINT_LSTM = os.path.join(BASE_DIR, "ai", "checkpoints", "convlstm_predictor_aug.pth")

_cls_cache  = None
_pred_cache = None
_lstm_cache = None


# ══════════════════════════════════════════════════════
# CHARGEMENT DES MODÈLES
# ══════════════════════════════════════════════════════

def get_cls_model():
    global _cls_cache
    if _cls_cache is None:
        if not os.path.exists(CHECKPOINT_CLS):
            return None
        try:
            from ai.models.resnet_classifier import ResNetSEPClassifier
            import torch
            model = ResNetSEPClassifier(n_coupes=5)
            ckpt = torch.load(CHECKPOINT_CLS, map_location='cpu', weights_only=False)
            model.load_state_dict(ckpt['model_state_dict'])
            model.eval()
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            _cls_cache = (model.to(device), device)
        except Exception as e:
            print(f"Erreur chargement ResNet : {e}")
            return None
    return _cls_cache


def get_pred_model():
    global _pred_cache
    if _pred_cache is None:
        if not os.path.exists(CHECKPOINT_PRED):
            return None
        try:
            from ai.models.unet_predictor import UNetPredictor
            import torch
            model = UNetPredictor(in_channels=2)
            ckpt = torch.load(CHECKPOINT_PRED, map_location='cpu', weights_only=False)
            model.load_state_dict(ckpt['model_state_dict'])
            model.eval()
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            _pred_cache = (model.to(device), device)
        except Exception as e:
            print(f"Erreur chargement U-Net : {e}")
            return None
    return _pred_cache


def get_lstm_model():
    global _lstm_cache
    if _lstm_cache is None:
        if not os.path.exists(CHECKPOINT_LSTM):
            return None
        try:
            from ai.models.convlstm_predictor import ConvLSTMPredictor
            import torch
            model = ConvLSTMPredictor(in_channels=1, hidden_channels=32, n_timesteps=3)
            ckpt = torch.load(CHECKPOINT_LSTM, map_location='cpu', weights_only=False)
            model.load_state_dict(ckpt['model_state_dict'])
            model.eval()
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            _lstm_cache = (model.to(device), device)
        except Exception as e:
            print(f"Erreur chargement ConvLSTM : {e}")
            return None
    return _lstm_cache


# ══════════════════════════════════════════════════════
# UTILITAIRES
# ══════════════════════════════════════════════════════

# APRÈS
def _resoudre_chemin(irm):
    chemin = irm.fichier_path
    # Si c'est un chemin fichier normal
    if os.path.exists(chemin):
        return chemin
    chemin2 = os.path.join(BASE_DIR, irm.fichier_path)
    if os.path.exists(chemin2):
        return chemin2
    # Si c'est un ID GridFS → télécharger dans un fichier temp
    import re
    if re.match(r'^[a-f0-9]{24}$', str(irm.fichier_path)):
        return _telecharger_gridfs(irm.fichier_path)
    return None

import tempfile, threading
_gridfs_cache = {}
_gridfs_lock = threading.Lock()

def _telecharger_gridfs(fichier_id: str):
    """Télécharge un fichier GridFS dans un fichier temporaire et retourne son chemin."""
    with _gridfs_lock:
        if fichier_id in _gridfs_cache:
            chemin = _gridfs_cache[fichier_id]
            if os.path.exists(chemin):
                return chemin
        try:
            import asyncio
            from app.core.database import get_gridfs
            loop = asyncio.new_event_loop()
            chemin = loop.run_until_complete(_dl_gridfs_async(fichier_id))
            loop.close()
            if chemin:
                _gridfs_cache[fichier_id] = chemin
            return chemin
        except Exception as e:
            print(f"Erreur GridFS download: {e}")
            return None

async def _dl_gridfs_async(fichier_id: str):
    try:
        from app.core.database import get_gridfs
        from bson import ObjectId
        fs = await get_gridfs()
        grid_out = await fs.open_download_stream(ObjectId(fichier_id))
        data = await grid_out.read()
        tmp = tempfile.NamedTemporaryFile(suffix='.nii', delete=False)
        tmp.write(data)
        tmp.close()
        return tmp.name
    except Exception as e:
        print(f"Erreur _dl_gridfs_async: {e}")
        return None


def _charger_volume(chemin):
    import nibabel as nib
    import numpy as np
    return np.squeeze(nib.load(chemin).get_fdata().astype(np.float32))


def _prep_coupe(volume, idx, size=256):
    import numpy as np
    from PIL import Image
    n = volume.shape[2] if len(volume.shape) == 3 else 1
    idx = min(idx, n - 1)
    coupe = volume[:, :, idx] if len(volume.shape) == 3 else volume
    std = coupe.std()
    if std > 0:
        coupe = (coupe - coupe.mean()) / std
    return np.array(Image.fromarray(coupe).resize((size, size), Image.BILINEAR), dtype=np.float32)


# ══════════════════════════════════════════════════════
# MODÈLE 1 — Classification SEP vs Sain
# ResNet-50 Transfer Learning — Accuracy 99.35%
# ══════════════════════════════════════════════════════

@router.post("/sep-sain/{irm_id}")
async def classifier_sep_sain(irm_id: str, current_user=Depends(get_current_user)):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(404, "IRM non trouvée")

    chemin = _resoudre_chemin(irm)
    if not chemin:
        raise HTTPException(404, "Fichier IRM introuvable")

    cls = get_cls_model()
    if cls is None:
        raise HTTPException(503, "Modèle classificateur non disponible")

    try:
        import torch
        import numpy as np
        from PIL import Image

        model, device = cls
        data = _charger_volume(chemin)
        n = data.shape[2] if len(data.shape) == 3 else 1

        # Sélection des 5 coupes avec le plus de signal hyperintense (proxy lésions FLAIR)
        # Simule la sélection par masque utilisée à l'entraînement
        seuil = data.mean() + 1.5 * data.std()
        scores_coupes = []
        for i in range(n):
            coupe = data[:, :, i]
            scores_coupes.append((float((coupe > seuil).sum()), i))
        scores_coupes.sort(reverse=True)
        indices_actifs = [s[1] for s in scores_coupes[:5]]

        # Évaluer aussi plusieurs fenêtres uniformes et prendre le max
        indices_uniform = np.linspace(0, n - 1, 20, dtype=int).tolist()
        tous_indices = list(set(indices_actifs + indices_uniform))

        # Découper en batches de 5 et prendre le score max
        scores_batches = []
        for start in range(0, len(tous_indices), 5):
            batch_idx = tous_indices[start:start + 5]
            while len(batch_idx) < 5:
                batch_idx.append(batch_idx[-1])
            coupes = [_prep_coupe(data, int(idx), size=224) for idx in batch_idx]
            tensor_b = torch.tensor(np.stack(coupes)).unsqueeze(1).unsqueeze(0).to(device)
            with torch.no_grad():
                scores_batches.append(model(tensor_b).item())

        score = max(scores_batches)

        diagnostic = "SEP Détectée" if score > 0.5 else "Sain"
        confiance = score if score > 0.5 else 1 - score

        if score > 0.8:
            interpretation = {"niveau": "sep_certain", "message": "Forte probabilité de SEP. Confirmation clinique recommandée.", "couleur": "#ef4444"}
        elif score > 0.5:
            interpretation = {"niveau": "sep_probable", "message": "Probabilité modérée de SEP. Examens complémentaires conseillés.", "couleur": "#f59e0b"}
        elif score > 0.2:
            interpretation = {"niveau": "incertain", "message": "Résultat incertain. Surveillance recommandée.", "couleur": "#84cc16"}
        else:
            interpretation = {"niveau": "sain", "message": "Aucun signe de SEP détecté.", "couleur": "#22c55e"}

        resultats = {
            "score": round(score, 4),
            "diagnostic": diagnostic,
            "confiance": round(confiance * 100, 1),
            "interpretation": interpretation,
            "modele": "ResNet-50 Transfer Learning",
            "performance": "Accuracy 99.35%"
        }

        irm.rapport = irm.rapport or {}
        irm.rapport["sep_sain"] = resultats
        await irm.save()
        return resultats

    except Exception as e:
        raise HTTPException(500, f"Erreur classification : {str(e)}")


@router.get("/sep-sain/{irm_id}")
async def get_sep_sain(irm_id: str, current_user=Depends(get_current_user)):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(404, "IRM non trouvée")
    if not irm.rapport or "sep_sain" not in irm.rapport:
        raise HTTPException(404, "Aucune classification disponible")
    return irm.rapport["sep_sain"]


# ══════════════════════════════════════════════════════
# MODÈLE 2 — Détection changements longitudinaux
# U-Net 2 canaux (T0+T1) — Dice 0.8215
# ══════════════════════════════════════════════════════

@router.post("/prediction/{irm_id}")
async def predire_lesions_futures(
    irm_id: str,
    irm_t0_id: Optional[str] = Query(None),
    current_user=Depends(get_current_user)
):
    irm_t1 = await IRMScan.get(irm_id)
    if not irm_t1:
        raise HTTPException(404, "IRM T1 non trouvée")

    chemin_t1 = _resoudre_chemin(irm_t1)
    if not chemin_t1:
        raise HTTPException(404, "Fichier IRM T1 introuvable")

    # Chercher IRM T0
    chemin_t0 = None
    if irm_t0_id:
        irm_t0 = await IRMScan.get(irm_t0_id)
        if irm_t0:
            chemin_t0 = _resoudre_chemin(irm_t0)
    else:
        autres = await IRMScan.find(
            IRMScan.patient_id == irm_t1.patient_id,
            IRMScan.sequence_type == irm_t1.sequence_type,
        ).sort(+IRMScan.uploaded_at).to_list()
        for candidat in autres:
            if str(candidat.id) == irm_id:
                continue
            c = _resoudre_chemin(candidat)
            if c:
                chemin_t0 = c
                break

    if chemin_t0 is None:
        raise HTTPException(400, "Aucune IRM T0 disponible. Uploadez une IRM antérieure.")

    pred = get_pred_model()
    if pred is None:
        raise HTTPException(503, "Modèle U-Net non disponible")

    try:
        import torch
        import numpy as np
        from PIL import Image
        import base64
        import io

        model, device = pred
        data_t0 = _charger_volume(chemin_t0)
        data_t1 = _charger_volume(chemin_t1)
        n = data_t1.shape[2] if len(data_t1.shape) == 3 else 1
        indices = np.linspace(n//4, 3*n//4, 10, dtype=int)

        seg_preds, cls_preds, images_base64 = [], [], []

        for idx in indices:
            coupe_t0 = _prep_coupe(data_t0, int(idx), size=256)
            coupe_t1 = _prep_coupe(data_t1, int(idx), size=256)

            tensor = torch.tensor(np.stack([coupe_t0, coupe_t1])).unsqueeze(0).to(device)
            with torch.no_grad():
                seg_out, cls_out = model(tensor)

            seg_np = seg_out.squeeze().cpu().numpy()
            seg_preds.append(seg_np)
            cls_preds.append(cls_out.item())

            # Visualisation
            t1_uint8 = ((coupe_t1 - coupe_t1.min()) /
                        (coupe_t1.max() - coupe_t1.min() + 1e-6) * 255).astype(np.uint8)
            masque_bin = (seg_np > 0.5).astype(np.uint8)
            img_rgb = np.stack([t1_uint8, t1_uint8, t1_uint8], axis=-1)
            if masque_bin.sum() > 0:
                img_rgb[:, :, 0] = np.where(masque_bin == 1, 255, t1_uint8)
                img_rgb[:, :, 1] = np.where(masque_bin == 1, 0, t1_uint8)
                img_rgb[:, :, 2] = np.where(masque_bin == 1, 0, t1_uint8)

            buffer = io.BytesIO()
            Image.fromarray(img_rgb.astype(np.uint8)).save(buffer, format='PNG')
            img_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

            orig_buffer = io.BytesIO()
            Image.fromarray(t1_uint8).save(orig_buffer, format='PNG')
            orig_b64 = base64.b64encode(orig_buffer.getvalue()).decode('utf-8')

            images_base64.append({
                "coupe": int(idx),
                "image": f"data:image/png;base64,{img_b64}",
                "image_originale": f"data:image/png;base64,{orig_b64}",
                "n_lesions": int(masque_bin.sum())
            })

        proba_rechute = float(np.mean(cls_preds))
        volume_predit = int((np.mean(seg_preds, axis=0) > 0.5).sum())
        rechute_probable = proba_rechute > 0.5

        if proba_rechute > 0.7:
            interpretation = {"niveau": "risque_eleve", "message": f"Risque élevé ({proba_rechute*100:.1f}%). Consultation urgente.", "couleur": "#ef4444"}
        elif proba_rechute > 0.5:
            interpretation = {"niveau": "risque_modere", "message": f"Risque modéré ({proba_rechute*100:.1f}%). Suivi rapproché.", "couleur": "#f59e0b"}
        else:
            interpretation = {"niveau": "risque_faible", "message": f"Faible risque ({proba_rechute*100:.1f}%). Surveillance normale.", "couleur": "#22c55e"}

        images_base64.sort(key=lambda x: x['n_lesions'], reverse=True)

        resultats = {
            "proba_rechute": round(proba_rechute * 100, 1),
            "rechute_probable": rechute_probable,
            "volume_lesions_futures": volume_predit,
            "interpretation": interpretation,
            "images_lesions": images_base64[:5],
            "modele": "U-Net 2 canaux (T0+T1)",
            "performance": "Dice 0.8215"
        }

        irm_t1.rapport = irm_t1.rapport or {}
        irm_t1.rapport["prediction_futures"] = resultats
        await irm_t1.save()
        return resultats

    except Exception as e:
        raise HTTPException(500, f"Erreur U-Net : {str(e)}")


@router.get("/prediction/{irm_id}")
async def get_prediction(irm_id: str, current_user=Depends(get_current_user)):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(404, "IRM non trouvée")
    if not irm.rapport or "prediction_futures" not in irm.rapport:
        raise HTTPException(404, "Aucune prédiction disponible")
    return irm.rapport["prediction_futures"]


# ══════════════════════════════════════════════════════
# MODÈLE 3 — Prédiction temporelle ConvLSTM
# 3 IRM consécutives → prédire T4 — Dice 0.7394
# ══════════════════════════════════════════════════════

@router.post("/temporal/{irm_id}")
async def predire_temporal(
    irm_id: str,
    irm_t1_id: Optional[str] = Query(None, description="IRM T1 (la plus ancienne)"),
    irm_t2_id: Optional[str] = Query(None, description="IRM T2 (intermédiaire)"),
    current_user=Depends(get_current_user)
):
    """
    Prédiction temporelle ConvLSTM
    Input  : 3 IRM consécutives (T1, T2, T3)
    Output : masque lésions futures T4
    """
    # IRM T3 (la plus récente = irm_id)
    irm_t3 = await IRMScan.get(irm_id)
    if not irm_t3:
        raise HTTPException(404, "IRM T3 non trouvée")

    chemin_t3 = _resoudre_chemin(irm_t3)
    if not chemin_t3:
        raise HTTPException(404, "Fichier IRM T3 introuvable")

    # Chercher T1 et T2 automatiquement si non fournis
    chemins = []
    if irm_t1_id and irm_t2_id:
        for mid in [irm_t1_id, irm_t2_id]:
            irm = await IRMScan.get(mid)
            if not irm:
                raise HTTPException(404, f"IRM {mid} non trouvée")
            c = _resoudre_chemin(irm)
            if not c:
                raise HTTPException(404, f"Fichier IRM {mid} introuvable")
            chemins.append(c)
        chemins.append(chemin_t3)
    else:
        # Chercher les 3 IRM les plus anciennes du patient
        toutes = await IRMScan.find(
            IRMScan.patient_id == irm_t3.patient_id,
            IRMScan.sequence_type == irm_t3.sequence_type,
        ).sort(+IRMScan.uploaded_at).to_list()

        for irm in toutes:
            c = _resoudre_chemin(irm)
            if c:
                chemins.append(c)
            if len(chemins) == 3:
                break

    if len(chemins) < 3:
        raise HTTPException(
            400,
            f"ConvLSTM nécessite 3 IRM FLAIR du même patient. "
            f"Seulement {len(chemins)} disponibles. "
            f"Uploadez des IRM supplémentaires."
        )

    lstm = get_lstm_model()
    if lstm is None:
        raise HTTPException(503, "Modèle ConvLSTM non disponible")

    try:
        import torch
        import numpy as np
        from PIL import Image
        import base64
        import io

        model, device = lstm

        # Charger les 3 volumes
        vols = [_charger_volume(c) for c in chemins[:3]]
        n = min(v.shape[2] if len(v.shape) == 3 else 1 for v in vols)
        indices = np.linspace(n//4, 3*n//4, 10, dtype=int)

        seg_preds = []
        images_base64 = []

        for idx in indices:
            # Extraire coupe de chaque timepoint → (3, 1, 128, 128)
            coupes = [_prep_coupe(v, int(idx), size=128) for v in vols]
            tensor = torch.tensor(
                np.stack(coupes, axis=0)
            ).unsqueeze(1).unsqueeze(0).to(device)  # (1, 3, 1, 128, 128)

            with torch.no_grad():
                seg_out = model(tensor)

            seg_np = seg_out.squeeze().cpu().numpy()
            seg_preds.append(seg_np)

            # Visualisation — IRM T3 + lésions prédites en rouge
            coupe_t3 = _prep_coupe(vols[2], int(idx), size=128)
            t3_uint8 = ((coupe_t3 - coupe_t3.min()) /
                        (coupe_t3.max() - coupe_t3.min() + 1e-6) * 255).astype(np.uint8)
            masque_bin = (seg_np > 0.5).astype(np.uint8)

            img_rgb = np.stack([t3_uint8, t3_uint8, t3_uint8], axis=-1)
            if masque_bin.sum() > 0:
                img_rgb[:, :, 0] = np.where(masque_bin == 1, 255, t3_uint8)
                img_rgb[:, :, 1] = np.where(masque_bin == 1, 0, t3_uint8)
                img_rgb[:, :, 2] = np.where(masque_bin == 1, 0, t3_uint8)

            buffer = io.BytesIO()
            Image.fromarray(img_rgb.astype(np.uint8)).save(buffer, format='PNG')
            img_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

            orig_buffer = io.BytesIO()
            Image.fromarray(t3_uint8).save(orig_buffer, format='PNG')
            orig_b64 = base64.b64encode(orig_buffer.getvalue()).decode('utf-8')

            images_base64.append({
                "coupe": int(idx),
                "image": f"data:image/png;base64,{img_b64}",
                "image_originale": f"data:image/png;base64,{orig_b64}",
                "n_lesions": int(masque_bin.sum())
            })

        seg_moyen = np.mean(seg_preds, axis=0)
        volume_predit = int((seg_moyen > 0.5).sum())

        if volume_predit > 500:
            interpretation = {"niveau": "risque_eleve", "message": f"Volume important de lésions futures prédit ({volume_predit} voxels). Consultation urgente.", "couleur": "#ef4444"}
        elif volume_predit > 100:
            interpretation = {"niveau": "risque_modere", "message": f"Lésions futures modérées prédites ({volume_predit} voxels). Suivi rapproché.", "couleur": "#f59e0b"}
        else:
            interpretation = {"niveau": "risque_faible", "message": f"Peu de lésions futures prédites ({volume_predit} voxels). Surveillance normale.", "couleur": "#22c55e"}

        images_base64.sort(key=lambda x: x['n_lesions'], reverse=True)

        resultats = {
            "volume_lesions_futures": volume_predit,
            "interpretation": interpretation,
            "images_lesions": images_base64[:5],
            "n_irm_utilisees": 3,
            "modele": "ConvLSTM — Prédiction Temporelle",
            "performance": "Dice 0.7394"
        }

        irm_t3.rapport = irm_t3.rapport or {}
        irm_t3.rapport["prediction_temporelle"] = resultats
        await irm_t3.save()
        return resultats

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Erreur ConvLSTM : {str(e)}")


@router.get("/temporal/{irm_id}")
async def get_temporal(irm_id: str, current_user=Depends(get_current_user)):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(404, "IRM non trouvée")
    if not irm.rapport or "prediction_temporelle" not in irm.rapport:
        raise HTTPException(404, "Aucune prédiction temporelle disponible")
    return irm.rapport["prediction_temporelle"]


# ══════════════════════════════════════════════════════
# Visualisation 3D lésions
# ══════════════════════════════════════════════════════

@router.get("/lesions3d/{irm_id}")
async def get_lesions_3d(irm_id: str, current_user=Depends(get_current_user)):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(404, "IRM non trouvée")

    chemin = _resoudre_chemin(irm)
    if not chemin:
        raise HTTPException(404, "Fichier IRM introuvable")

    pred = get_pred_model()
    if pred is None:
        raise HTTPException(503, "Modèle non disponible")

    try:
        import torch
        import numpy as np
        from PIL import Image

        model, device = pred
        data = _charger_volume(chemin)
        n = data.shape[2] if len(data.shape) == 3 else 1
        RENDER_SIZE = 128

        points_lesions = []
        points_cerveau = []

        for idx in range(0, n, 3):
            coupe_256 = _prep_coupe(data, idx, size=256)
            tensor = torch.tensor(np.stack([coupe_256, coupe_256])).unsqueeze(0).to(device)

            with torch.no_grad():
                seg_out, _ = model(tensor)

            seg_np = seg_out.squeeze().cpu().numpy()
            seg_resized = np.array(
                Image.fromarray(seg_np).resize((RENDER_SIZE, RENDER_SIZE), Image.BILINEAR),
                dtype=np.float32
            )

            lesion_pixels = np.argwhere(seg_resized > 0.1)
            for px in lesion_pixels[::2]:
                points_lesions.append([
                    float(px[1] / RENDER_SIZE * 2 - 1),
                    float(idx / n * 2 - 1),
                    float(px[0] / RENDER_SIZE * 2 - 1)
                ])

            coupe_small = _prep_coupe(data, idx, size=RENDER_SIZE)
            cerveau_pixels = np.argwhere(coupe_small > 0.1)
            for px in cerveau_pixels[::20]:
                points_cerveau.append([
                    float(px[1] / RENDER_SIZE * 2 - 1),
                    float(idx / n * 2 - 1),
                    float(px[0] / RENDER_SIZE * 2 - 1)
                ])

        return {
            "lesions": points_lesions[:2000],
            "cerveau": points_cerveau[:5000],
            "n_lesions": len(points_lesions),
            "irm_id": irm_id
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Erreur 3D : {str(e)}")


# ══════════════════════════════════════════════════════
# VIEWER IRM COMPLET — Coupes individuelles
# ══════════════════════════════════════════════════════

@router.get("/viewer/{irm_id}/info")
async def viewer_info(irm_id: str, current_user=Depends(get_current_user)):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(404, "IRM non trouvée")
    chemin = _resoudre_chemin(irm)
    if not chemin:
        raise HTTPException(404, "Fichier IRM introuvable")
    import nibabel as nib
    shape = nib.load(chemin).shape
    n_coupes = int(shape[2]) if len(shape) >= 3 else 1
    return {"n_coupes": n_coupes}


@router.get("/viewer/{irm_id}/coupe/{idx}")
async def viewer_coupe_originale(irm_id: str, idx: int, current_user=Depends(get_current_user)):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(404, "IRM non trouvée")
    chemin = _resoudre_chemin(irm)
    if not chemin:
        raise HTTPException(404, "Fichier IRM introuvable")
    import numpy as np, io, base64
    from PIL import Image
    data = _charger_volume(chemin)
    n = data.shape[2] if len(data.shape) == 3 else 1
    idx = max(0, min(idx, n - 1))
    coupe = _prep_coupe(data, idx, size=256)
    uint8 = ((coupe - coupe.min()) / (coupe.max() - coupe.min() + 1e-6) * 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(uint8).save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return {"image": f"data:image/png;base64,{b64}", "coupe": idx}


@router.get("/viewer/{irm_id}/overlay/{idx}")
async def viewer_coupe_overlay(irm_id: str, idx: int, current_user=Depends(get_current_user)):
    irm = await IRMScan.get(irm_id)
    if not irm:
        raise HTTPException(404, "IRM non trouvée")
    chemin_t1 = _resoudre_chemin(irm)
    if not chemin_t1:
        raise HTTPException(404, "Fichier IRM introuvable")

    pred = get_pred_model()
    if pred is None:
        raise HTTPException(503, "Modèle IA non disponible")

    # Auto-sélection T0
    chemin_t0 = chemin_t1
    autres = await IRMScan.find(
        IRMScan.patient_id == irm.patient_id,
        IRMScan.sequence_type == irm.sequence_type,
    ).sort(+IRMScan.uploaded_at).to_list()
    for candidat in autres:
        if str(candidat.id) == irm_id:
            continue
        c = _resoudre_chemin(candidat)
        if c:
            chemin_t0 = c
            break

    import torch, numpy as np, io, base64
    from PIL import Image

    model, device = pred
    data_t0 = _charger_volume(chemin_t0)
    data_t1 = _charger_volume(chemin_t1)
    n = data_t1.shape[2] if len(data_t1.shape) == 3 else 1
    idx = max(0, min(idx, n - 1))

    coupe_t0 = _prep_coupe(data_t0, idx, size=256)
    coupe_t1 = _prep_coupe(data_t1, idx, size=256)
    tensor = torch.tensor(np.stack([coupe_t0, coupe_t1])).unsqueeze(0).to(device)

    with torch.no_grad():
        seg_out, _ = model(tensor)

    seg_np = seg_out.squeeze().cpu().numpy()
    t1_uint8 = ((coupe_t1 - coupe_t1.min()) / (coupe_t1.max() - coupe_t1.min() + 1e-6) * 255).astype(np.uint8)
    masque_bin = (seg_np > 0.5).astype(np.uint8)
    n_lesions = int(masque_bin.sum())

    img_rgb = np.stack([t1_uint8, t1_uint8, t1_uint8], axis=-1)
    if n_lesions > 0:
        img_rgb[:, :, 0] = np.where(masque_bin == 1, 255, t1_uint8)
        img_rgb[:, :, 1] = np.where(masque_bin == 1, 0, t1_uint8)
        img_rgb[:, :, 2] = np.where(masque_bin == 1, 0, t1_uint8)

    buf = io.BytesIO()
    Image.fromarray(img_rgb.astype(np.uint8)).save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return {
        "image": f"data:image/png;base64,{b64}",
        "coupe": idx,
        "n_lesions": n_lesions
    }
