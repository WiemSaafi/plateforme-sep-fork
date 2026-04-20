from fastapi import APIRouter

router = APIRouter()

@router.get("/news")
async def get_news():
    """Retourne les actualités et organisations SEP"""
    return {
        "organisations": [
            {
                "id": 1,
                "name": "Multiple Sclerosis International Federation",
                "subtitle": "Fédération mondiale de la SEP",
                "description": "La MSIF unit les organisations de SEP du monde entier pour améliorer la qualité de vie des personnes atteintes et accélérer la recherche.",
                "url": "https://www.msif.org",
                "domain": "msif.org",
                "badge": "INTERNATIONAL",
                "badge_color": "#4f46e5",
                "subtitle_color": "#4f46e5",
                "status": "Actif",
                "screenshot": "/org-msif.png"
            },
            {
                "id": 2,
                "name": "Association Tunisienne de la SEP",
                "subtitle": "Association nationale tunisienne",
                "description": "L'ATSEP accompagne les patients tunisiens atteints de SEP avec un soutien médical, psychologique et social adapté au contexte local.",
                "url": "https://www.atsep.org.tn",
                "domain": "atsep.org.tn",
                "badge": "TN",
                "badge_color": "#dc2626",
                "subtitle_color": "#dc2626",
                "status": "Actif",
                "screenshot": "/org-atsep.png"
            },
            {
                "id": 3,
                "name": "World Health Organization",
                "subtitle": "Organisation Mondiale de la Santé",
                "description": "L'OMS fournit des données épidémiologiques mondiales sur la SEP et coordonne les efforts de santé publique pour les maladies neurologiques.",
                "url": "https://www.who.int",
                "domain": "who.int",
                "badge": "INTERNATIONAL",
                "badge_color": "#0891b2",
                "subtitle_color": "#0891b2",
                "status": "Actif",
                "screenshot": "/org-who.png"
            },
            {
                "id": 4,
                "name": "National MS Society",
                "subtitle": "Société américaine de la SEP",
                "description": "Leader mondial du financement de la recherche sur la SEP, offrant des ressources éducatives et un soutien aux patients et familles.",
                "url": "https://www.nationalmssociety.org",
                "domain": "nationalmssociety.org",
                "badge": "USA",
                "badge_color": "#059669",
                "subtitle_color": "#059669",
                "status": "Actif",
                "screenshot": "/org-nmss.png"
            },
            {
                "id": 5,
                "name": "MS Society UK",
                "subtitle": "Société britannique de la SEP",
                "description": "Organisation caritative britannique offrant information, soutien et financement de recherche pour améliorer la vie avec la SEP.",
                "url": "https://www.mssociety.org.uk",
                "domain": "mssociety.org.uk",
                "badge": "UK",
                "badge_color": "#7c3aed",
                "subtitle_color": "#7c3aed",
                "status": "Actif",
                "screenshot": "/org-msuk.png"
            },
            {
                "id": 6,
                "name": "Société Française de la SEP",
                "subtitle": "Association française",
                "description": "La SFSEP regroupe professionnels et chercheurs français pour faire avancer la prise en charge et la recherche sur la SEP.",
                "url": "https://www.sfsep.org",
                "domain": "sfsep.org",
                "badge": "FR",
                "badge_color": "#d97706",
                "subtitle_color": "#d97706",
                "status": "Actif",
                "screenshot": "/org-sfsep.png"
            }
        ],
        "ticker": [
            "Nouveau traitement approuvé par la FDA pour la SEP progressive",
            "Étude tunisienne sur l'impact du climat méditerranéen sur la SEP",
            "Conférence ECTRIMS 2026 : avancées majeures en neuro-immunologie",
            "Intelligence artificielle : diagnostic précoce de la SEP par IRM",
            "Essai clinique prometteur sur la remyélinisation",
            "Atlas mondial de la SEP 2026 : données actualisées"
        ]
    }
