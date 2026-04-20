import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def migrate_archived_fields():
    try:
        client = AsyncIOMotorClient('mongodb+srv://mllehadillajili_db_user:Sq7ov3CoE4lVRSaN@sepcluster.woh3fey.mongodb.net/sep_db?appName=SepCluster')
        db = client.sep_db
        
        print("Connexion à MongoDB...")
        await db.command('ping')
        print("✓ Connecté à MongoDB")
        
        # Compter les patients avant migration
        total_before = await db.patients.count_documents({})
        print(f"\nTotal patients: {total_before}")
        
        # Compter les patients sans le champ archived
        without_archived = await db.patients.count_documents({'archived': {'$exists': False}})
        print(f"Patients sans champ 'archived': {without_archived}")
        
        if without_archived > 0:
            # Ajouter les champs manquants
            result = await db.patients.update_many(
                {'archived': {'$exists': False}},
                {'$set': {
                    'archived': False,
                    'archived_at': None,
                    'archived_by': None
                }}
            )
            print(f"\n✓ Migration effectuée: {result.modified_count} documents mis à jour")
        else:
            print("\n✓ Tous les patients ont déjà le champ 'archived'")
        
        # Vérifier après migration
        patient = await db.patients.find_one({})
        if patient:
            print("\nChamps d'un patient après migration:")
            print(f"  - archived: {patient.get('archived')}")
            print(f"  - archived_at: {patient.get('archived_at')}")
            print(f"  - archived_by: {patient.get('archived_by')}")
        
        # Compter les patients archivés
        archived_count = await db.patients.count_documents({'archived': True})
        print(f"\nPatients archivés: {archived_count}")
        
        client.close()
        print("\n✓ Migration terminée avec succès!")
        
    except Exception as e:
        print(f"\n✗ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(migrate_archived_fields())
