from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://mllehadillajili_db_user:Sq7ov3CoE4lVRRSaN@sepcluster.woh3fey.mongodb.net/sep_db?appName=SepCluster")

# Client global réutilisable
motor_client: AsyncIOMotorClient = None

async def connect_db():
    global motor_client
    motor_client = AsyncIOMotorClient(MONGODB_URL)
    from app.models.documents import (
        Patient, VisiteClinique, IRMScan, Utilisateur,
        AnalyseBiologique, Rappel, RendezVous, Contrat
    )
    await init_beanie(
        database=motor_client.sep_db,
        document_models=[
            Patient, VisiteClinique, IRMScan, Utilisateur,
            AnalyseBiologique, Rappel, RendezVous, Contrat
        ]
    )
    print("Connecté à MongoDB")

def get_db():
    return motor_client.sep_db
