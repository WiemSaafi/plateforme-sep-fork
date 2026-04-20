from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from app.core.auth import get_current_user
from app.models.documents import (
    Utilisateur, IRMScan, AnalyseBiologique, VisiteClinique, Patient
)

router = APIRouter()


def time_ago(dt: datetime) -> str:
    now = datetime.utcnow()
    diff = now - dt
    minutes = int(diff.total_seconds() / 60)
    if minutes < 1:
        return "À l'instant"
    if minutes < 60:
        return f"Il y a {minutes} min"
    hours = minutes // 60
    if hours < 24:
        return f"Il y a {hours}h"
    days = hours // 24
    if days < 7:
        return f"Il y a {days}j"
    return dt.strftime("%d/%m/%Y")


async def get_patient_name(patient_id: str) -> str:
    try:
        patient = await Patient.get(patient_id)
        if patient:
            return f"{patient.prenom} {patient.nom}"
    except Exception:
        pass
    return "Patient inconnu"


@router.get("")
async def get_notifications(current_user=Depends(get_current_user)):
    notifications = []
    since = datetime.utcnow() - timedelta(days=7)

    # 1. Comptes en attente de validation
    pending_users = await Utilisateur.find(
        Utilisateur.statut == "en_attente"
    ).sort(-Utilisateur.created_at).limit(5).to_list()

    for u in pending_users:
        notifications.append({
            "id": f"user_{u.id}",
            "type": "user",
            "title": "Nouveau compte",
            "message": f"{u.prenom} {u.nom} a demandé un accès {u.role}",
            "time": time_ago(u.created_at),
            "timestamp": u.created_at.isoformat(),
            "read": False,
        })

    # 2. IRM avec rapport terminé (récents)
    irm_done = await IRMScan.find(
        IRMScan.statut == "reported",
        IRMScan.uploaded_at >= since,
    ).sort(-IRMScan.uploaded_at).limit(5).to_list()

    for irm in irm_done:
        patient_name = await get_patient_name(irm.patient_id)
        seq = irm.sequence_type or "IRM"
        notifications.append({
            "id": f"irm_{irm.id}",
            "type": "irm",
            "title": "Rapport IRM terminé",
            "message": f"{seq} de {patient_name} — rapport prêt",
            "time": time_ago(irm.uploaded_at),
            "timestamp": irm.uploaded_at.isoformat(),
            "read": True,
        })

    # 3. IRM en attente de lecture
    irm_pending = await IRMScan.find(
        IRMScan.statut == "pending",
        IRMScan.uploaded_at >= since,
    ).sort(-IRMScan.uploaded_at).limit(5).to_list()

    for irm in irm_pending:
        patient_name = await get_patient_name(irm.patient_id)
        notifications.append({
            "id": f"irm_pending_{irm.id}",
            "type": "irm_pending",
            "title": "IRM en attente",
            "message": f"Nouvelle IRM de {patient_name} à analyser",
            "time": time_ago(irm.uploaded_at),
            "timestamp": irm.uploaded_at.isoformat(),
            "read": True,
        })

    # 4. Analyses biologiques terminées
    analyses_done = await AnalyseBiologique.find(
        AnalyseBiologique.statut == "termine",
        AnalyseBiologique.created_at >= since,
    ).sort(-AnalyseBiologique.created_at).limit(5).to_list()

    for a in analyses_done:
        patient_name = await get_patient_name(a.patient_id)
        notifications.append({
            "id": f"analyse_{a.id}",
            "type": "analyse",
            "title": "Analyse complétée",
            "message": f"{a.type_analyse.replace('_', ' ').title()} de {patient_name} finalisé",
            "time": time_ago(a.created_at),
            "timestamp": a.created_at.isoformat(),
            "read": True,
        })

    # 5. Visites cliniques récentes
    visites = await VisiteClinique.find(
        VisiteClinique.created_at >= since,
    ).sort(-VisiteClinique.created_at).limit(5).to_list()

    for v in visites:
        patient_name = await get_patient_name(v.patient_id)
        edss = f" (EDSS: {v.edss_score})" if v.edss_score is not None else ""
        notifications.append({
            "id": f"visite_{v.id}",
            "type": "visite",
            "title": "Visite enregistrée",
            "message": f"Visite clinique{edss} pour {patient_name}",
            "time": time_ago(v.created_at),
            "timestamp": v.created_at.isoformat(),
            "read": True,
        })

    # Sort all by timestamp descending, unread first
    notifications.sort(key=lambda n: (n["read"], n.get("timestamp", "")), reverse=False)
    notifications.sort(key=lambda n: n.get("timestamp", ""), reverse=True)

    return notifications[:20]
