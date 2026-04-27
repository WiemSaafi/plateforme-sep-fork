from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
import os
import uuid
import nibabel as nib
import numpy as np
import io
import tempfile
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from app.models.documents import IRMScan, Patient, VisiteClinique
from app.core.auth import get_current_user
from app.core.database import get_database  # à vérifier selon ton projet

router = APIRouter()

FORMATS_VALIDES = [".nii", ".nii.gz", ".dcm"]
TAILLE_MAX_MB = 500

def serialize(irm: IRMScan) -> dict:
    return {
        "id": str(irm.id),
        "patient_id": irm.patient_id,
        "visite_id": irm.visite_id,
        "fichier_path": irm.fichier_path,
        "fichier_url": irm.fichier_path,
        "chemin_fichier": irm.fichier_path,
        "sequence_type": irm.sequence_type,
        "format_fichier": irm.metadata_dicom.get("format"),
        "metadata": irm.metadata_dicom,
        "statut": irm.statut,
        "uploaded_at": irm.uploaded_at,
        "rapport": irm.rapport,
        "radiologue_id": irm.radiologue_id,
        "radiologue_nom": irm.radiologue_nom,
        "envoi_medecin_id": irm.envoi_medecin_id,
        "envoye_at": irm.envoye_at,
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

async def get_gridfs():
    """Retourne un bucket GridFS"""
    from beanie import get_client  # ou selon ta config
    db = get_client().get_default_database()
    return AsyncIOMotorGridFSBucket(db, bucket_name="irm_files")
