from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from app.models.documents import Patient
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from fastapi import APIRouter, HTTPException, Query, Depends
from app.routers.auth import get_current_user
router = APIRouter()

def serialize(patient: Patient) -> dict:
    return {
        "id": str(patient.id),
        "nom": patient.nom,
        "prenom": patient.prenom,
        "date_naissance": patient.date_naissance,
        "sexe": patient.sexe,
        "contact": patient.contact,
        "created_at": patient.created_at,
        "updated_at": patient.updated_at,
        "archived": patient.archived,
        "archived_at": patient.archived_at,
        "archived_by": patient.archived_by,
    }

# ─── GET tous les patients ────────────────────────────────────────────
@router.get("/")
async def get_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sexe: Optional[str] = Query(None),
    current_user=Depends(get_current_user)
):
    print(f"DEBUG get_patients: role={current_user.role}, id={current_user.id}")  # ← ajoute ça
    skip = (page - 1) * limit

    # Admin et radiologue voient tous les patients non archivés
    if current_user.role in ["admin", "radiologue"]:
        all_patients = await Patient.find(Patient.archived != True).to_list()
    else:
        # Médecin voit seulement ses patients non archivés
        all_patients = await Patient.find(
            Patient.medecin_id == str(current_user.id),
            Patient.archived != True
        ).to_list()

    if search:
        search_lower = search.lower()
        all_patients = [
            p for p in all_patients
            if search_lower in p.nom.lower() or search_lower in p.prenom.lower()
        ]
    if sexe:
        all_patients = [p for p in all_patients if p.sexe == sexe]

    total = len(all_patients)
    paginated = all_patients[skip: skip + limit]

    return {
        "data": [serialize(p) for p in paginated],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": -(-total // limit)
        }
    }

# ─── GET patients archivés ────────────────────────────────────────────
@router.get("/archived")
async def get_archived_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sexe: Optional[str] = Query(None),
    current_user=Depends(get_current_user)
):
    print(f"DEBUG get_archived_patients: role={current_user.role}, id={current_user.id}")
    
    try:
        # Convertir les paramètres en entiers si nécessaire
        page = int(page) if page else 1
        limit = int(limit) if limit else 10
        skip = (page - 1) * limit
        
        # Traiter les filtres vides
        search = search.strip() if search and search.strip() else None
        sexe = sexe.strip() if sexe and sexe.strip() else None

        # Admin et radiologue voient tous les patients archivés
        if current_user.role in ["admin", "radiologue"]:
            print("DEBUG: Admin/radiologue - fetching all archived patients")
            all_patients = await Patient.find(Patient.archived == True).to_list()
        else:
            # Médecin voit seulement ses patients archivés
            print(f"DEBUG: Médecin - fetching archived patients for medecin_id={current_user.id}")
            all_patients = await Patient.find(
                Patient.medecin_id == str(current_user.id), 
                Patient.archived == True
            ).to_list()
        
        print(f"DEBUG: Found {len(all_patients)} archived patients")
        
        # Filtrage par recherche
        if search:
            search_lower = search.lower()
            all_patients = [
                p for p in all_patients
                if p.nom and search_lower in p.nom.lower() 
                or p.prenom and search_lower in p.prenom.lower()
            ]
        
        # Filtrage par sexe
        if sexe:
            all_patients = [p for p in all_patients if p.sexe == sexe]

        total = len(all_patients)
        paginated = all_patients[skip: skip + limit]

        return {
            "data": [serialize(p) for p in paginated],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": -(-total // limit)
            }
        }
        
    except Exception as e:
        print(f"ERROR in get_archived_patients: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des patients archivés: {str(e)}")

# ─── GET un patient par ID ────────────────────────────────────────────
@router.get("/{patient_id}")
async def get_patient(patient_id: str, current_user=Depends(get_current_user)):
    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouve")
    # Admin et radiologue ont accès à tous les patients
    if current_user.role not in ["admin", "radiologue"] and patient.medecin_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")
    return serialize(patient)

# ─── POST créer un patient ────────────────────────────────────────────
@router.post("/", status_code=201)
async def create_patient(data: PatientCreate, current_user=Depends(get_current_user)):
    existing = await Patient.find_one(
        Patient.nom == data.nom,
        Patient.prenom == data.prenom,
        Patient.date_naissance == data.date_naissance
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Un patient {data.nom} {data.prenom} né le {data.date_naissance} existe déjà avec l'ID : {str(existing.id)}"
        )

    if data.contact and data.contact.email:
        email_exist = await Patient.find_one({"contact.email": data.contact.email})
        if email_exist:
            raise HTTPException(
                status_code=409,
                detail=f"Un patient avec l'email {data.contact.email} existe déjà"
            )

    patient = Patient(
        nom=data.nom,
        prenom=data.prenom,
        date_naissance=data.date_naissance,
        sexe=data.sexe,
        contact=data.contact.model_dump() if data.contact else {},
        medecin_id=str(current_user.id)  # ← lier au médecin connecté
    )
    await patient.insert()
    return serialize(patient)


# ─── PUT modifier un patient ──────────────────────────────────────────
@router.put("/{patient_id}")
async def update_patient(patient_id: str, data: PatientUpdate):
    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouve")

    if data.nom is not None:
        patient.nom = data.nom
    if data.prenom is not None:
        patient.prenom = data.prenom
    if data.date_naissance is not None:
        patient.date_naissance = data.date_naissance
    if data.sexe is not None:
        patient.sexe = data.sexe
    if data.contact is not None:
        patient.contact = data.contact

    patient.updated_at = datetime.utcnow()
    await patient.save()
    return serialize(patient)

# ─── PUT archiver un patient ──────────────────────────────────────────
@router.put("/{patient_id}/archive")
async def archive_patient(patient_id: str, current_user=Depends(get_current_user)):
    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouve")
    
    # Admin et radiologue peuvent archiver tous les patients
    if current_user.role not in ["admin", "radiologue"] and patient.medecin_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    # Marquer comme archivé (ajouter un champ archived)
    patient.archived = True
    patient.archived_at = datetime.utcnow()
    patient.archived_by = str(current_user.id)
    await patient.save()
    return {"message": "Patient archive avec succes"}

# ─── DELETE supprimer un patient ──────────────────────────────────────
@router.delete("/{patient_id}")
async def delete_patient(patient_id: str):
    patient = await Patient.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient non trouve")
    await patient.delete()
    return {"message": "Patient supprime avec succes"}