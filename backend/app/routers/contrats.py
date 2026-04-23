from fastapi import APIRouter, HTTPException, Depends
from app.routers.auth import get_current_user

router = APIRouter()

def serialize_contrat(c) -> dict:
    return {
        "id": str(c.id),
        "radiologue_id": c.radiologue_id,
        "medecin_id": c.medecin_id,
        "radiologue_nom": c.radiologue_nom,
        "medecin_nom": c.medecin_nom,
        "created_at": c.created_at,
    }

@router.get("/contrats")
async def list_contrats(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Réservé à l'administrateur")
    from app.models.documents import Contrat
    contrats = await Contrat.find_all().to_list()
    return [serialize_contrat(c) for c in contrats]

@router.post("/contrats", status_code=201)
async def create_contrat(body: dict, current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Réservé à l'administrateur")
    from app.models.documents import Contrat, Utilisateur
    from beanie import PydanticObjectId

    radiologue_id = body.get("radiologue_id")
    medecin_id = body.get("medecin_id")
    if not radiologue_id or not medecin_id:
        raise HTTPException(400, "radiologue_id et medecin_id sont obligatoires")

    existant = await Contrat.find_one(
        Contrat.radiologue_id == radiologue_id,
        Contrat.medecin_id == medecin_id,
    )
    if existant:
        raise HTTPException(409, "Cette liaison existe déjà")

    try:
        rad = await Utilisateur.get(PydanticObjectId(radiologue_id))
        med = await Utilisateur.get(PydanticObjectId(medecin_id))
    except Exception:
        raise HTTPException(400, "ID invalide")

    if not rad or rad.role != "radiologue":
        raise HTTPException(400, "L'utilisateur n'est pas un radiologue")
    if not med or med.role != "medecin":
        raise HTTPException(400, "L'utilisateur n'est pas un médecin")

    contrat = Contrat(
        radiologue_id=radiologue_id,
        medecin_id=medecin_id,
        radiologue_nom=f"{rad.prenom} {rad.nom}",
        medecin_nom=f"{med.prenom} {med.nom}",
    )
    await contrat.insert()
    return serialize_contrat(contrat)

@router.delete("/contrats/{contrat_id}")
async def delete_contrat(contrat_id: str, current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Réservé à l'administrateur")
    from app.models.documents import Contrat
    from beanie import PydanticObjectId
    contrat = await Contrat.get(PydanticObjectId(contrat_id))
    if not contrat:
        raise HTTPException(404, "Liaison non trouvée")
    await contrat.delete()
    return {"message": "Liaison supprimée"}

@router.get("/contrats/mes-medecins")
async def get_mes_medecins(current_user=Depends(get_current_user)):
    if current_user.role != "radiologue":
        raise HTTPException(403, "Réservé au radiologue")
    from app.models.documents import Contrat
    contrats = await Contrat.find(Contrat.radiologue_id == str(current_user.id)).to_list()
    return [{"medecin_id": c.medecin_id, "medecin_nom": c.medecin_nom} for c in contrats]

@router.get("/contrats/mes-radiologues")
async def get_mes_radiologues(current_user=Depends(get_current_user)):
    if current_user.role != "medecin":
        raise HTTPException(403, "Réservé au médecin")
    from app.models.documents import Contrat
    contrats = await Contrat.find(Contrat.medecin_id == str(current_user.id)).to_list()
    return [{"radiologue_id": c.radiologue_id, "radiologue_nom": c.radiologue_nom} for c in contrats]
