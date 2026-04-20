from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.auth import get_current_user, hasher_mot_de_passe, verifier_mot_de_passe
from app.models.documents import Utilisateur

router = APIRouter()


# ─── Schemas ───────────────────────────────────────────────────────────
class ProfilUpdate(BaseModel):
    nom: str
    prenom: str
    email: EmailStr


class PasswordUpdate(BaseModel):
    current: str
    nouveau: str


class NotifPreferences(BaseModel):
    notif_new_user: bool = True
    notif_irm_done: bool = True
    notif_analyse_done: bool = False
    notif_visite: bool = True
    notif_validation: bool = True


class SystemeSettings(BaseModel):
    maintenance_mode: bool = False
    auto_validate_users: bool = False
    session_timeout: str = "60"
    max_upload_size: str = "100"
    default_language: str = "fr"


# In-memory store for settings (per-user, persists during server runtime)
_notif_prefs = {}
_system_settings = {}


# ─── GET /api/settings/profil ──────────────────────────────────────────
@router.get("/profil")
async def get_profil(user: Utilisateur = Depends(get_current_user)):
    return {
        "nom": user.nom,
        "prenom": user.prenom,
        "email": user.email,
        "role": user.role,
    }


# ─── PUT /api/settings/profil ─────────────────────────────────────────
@router.put("/profil")
async def update_profil(
    data: ProfilUpdate,
    user: Utilisateur = Depends(get_current_user),
):
    # Check email uniqueness if changed
    if data.email != user.email:
        existing = await Utilisateur.find_one(Utilisateur.email == data.email)
        if existing:
            raise HTTPException(status_code=409, detail="Cet email est déjà utilisé")

    user.nom = data.nom
    user.prenom = data.prenom
    user.email = data.email
    await user.save()

    # Return updated user info for localStorage sync
    return {
        "message": "Profil mis à jour avec succès",
        "user": {
            "id": str(user.id),
            "nom": user.nom,
            "prenom": user.prenom,
            "email": user.email,
            "role": user.role,
            "patient_id": user.patient_id,
        }
    }


# ─── PUT /api/settings/password ───────────────────────────────────────
@router.put("/password")
async def update_password(
    data: PasswordUpdate,
    user: Utilisateur = Depends(get_current_user),
):
    if not verifier_mot_de_passe(data.current, user.mot_de_passe):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")

    if len(data.nouveau) < 8:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 8 caractères")

    user.mot_de_passe = hasher_mot_de_passe(data.nouveau)
    await user.save()
    return {"message": "Mot de passe modifié avec succès"}


# ─── GET /api/settings/notifications ──────────────────────────────────
@router.get("/notifications")
async def get_notif_prefs(user: Utilisateur = Depends(get_current_user)):
    uid = str(user.id)
    return _notif_prefs.get(uid, {
        "notif_new_user": True,
        "notif_irm_done": True,
        "notif_analyse_done": False,
        "notif_visite": True,
        "notif_validation": True,
    })


# ─── PUT /api/settings/notifications ─────────────────────────────────
@router.put("/notifications")
async def update_notif_prefs(
    data: NotifPreferences,
    user: Utilisateur = Depends(get_current_user),
):
    uid = str(user.id)
    _notif_prefs[uid] = data.model_dump()
    return {"message": "Préférences de notification mises à jour", **_notif_prefs[uid]}


# ─── GET /api/settings/systeme ────────────────────────────────────────
@router.get("/systeme")
async def get_systeme(user: Utilisateur = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return _system_settings.get("global", {
        "maintenance_mode": False,
        "auto_validate_users": False,
        "session_timeout": "60",
        "max_upload_size": "100",
        "default_language": "fr",
    })


# ─── PUT /api/settings/systeme ───────────────────────────────────────
@router.put("/systeme")
async def update_systeme(
    data: SystemeSettings,
    user: Utilisateur = Depends(get_current_user),
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    _system_settings["global"] = data.model_dump()
    return {"message": "Paramètres système mis à jour", **_system_settings["global"]}
