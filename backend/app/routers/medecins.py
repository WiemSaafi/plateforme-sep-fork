from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.models.documents import Utilisateur

router = APIRouter()

@router.get("/medecins/disponibles")
async def get_medecins_disponibles(current_user=Depends(get_current_user)):
    """Récupère la liste de tous les médecins disponibles pour la prise de rendez-vous"""
    try:
        # Récupérer tous les utilisateurs avec le rôle médecin
        medecins = await Utilisateur.find(Utilisateur.role == "medecin").to_list()
        
        # Retourner les informations essentielles
        return [
            {
                "id": str(medecin.id),
                "nom": medecin.nom,
                "prenom": medecin.prenom,
                "email": medecin.email,
                "telephone": medecin.telephone if hasattr(medecin, 'telephone') else None,
                "specialite": "Neurologue"
            }
            for medecin in medecins
        ]
    except Exception as e:
        print(f"Erreur lors de la récupération des médecins: {e}")
        import traceback
        traceback.print_exc()
        return []
