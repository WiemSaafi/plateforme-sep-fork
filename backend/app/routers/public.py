from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/sep-stats")
async def get_sep_stats():
    """Real SEP/MS global statistics from WHO & medical literature."""
    return {
        "global_stats": {
            "total_cases": 2_800_000,
            "total_cases_label": "2,8 millions",
            "countries_affected": 200,
            "new_cases_per_year": 130_000,
            "women_ratio": 3,
            "avg_diagnosis_age": "20-40 ans",
            "prevalence_europe": 143,
            "prevalence_north_america": 164,
            "prevalence_africa": 5,
        },
        "key_figures": [
            {"label": "Personnes atteintes dans le monde", "value": "2,8M", "icon": "globe", "color": "#4f46e5", "detail": "Source: Atlas of MS, 3rd Edition (2020)"},
            {"label": "Ratio femmes / hommes", "value": "3:1", "icon": "users", "color": "#e11d48", "detail": "Les femmes sont 3x plus touchées"},
            {"label": "Âge moyen au diagnostic", "value": "20-40", "icon": "calendar", "color": "#0891b2", "detail": "Touche principalement les jeunes adultes"},
            {"label": "Pays concernés", "value": "200+", "icon": "map", "color": "#059669", "detail": "Présente sur tous les continents"},
            {"label": "Prévalence en Europe", "value": "143/100k", "icon": "bar-chart", "color": "#7c3aed", "detail": "Habitants pour 100 000 personnes"},
            {"label": "Nouveaux cas / an", "value": "~130k", "icon": "trending-up", "color": "#d97706", "detail": "Augmentation constante depuis 2013"},
        ],
        "types_sep": [
            {"name": "SEP Récurrente-Rémittente (RRMS)", "percent": 85, "description": "Poussées suivies de rémissions partielles ou complètes"},
            {"name": "SEP Secondairement Progressive (SPMS)", "percent": 10, "description": "Évolution progressive après une phase récurrente-rémittente"},
            {"name": "SEP Primaire Progressive (PPMS)", "percent": 5, "description": "Aggravation progressive dès le début sans poussées distinctes"},
        ],
        "timeline": [
            {"year": "1868", "event": "Jean-Martin Charcot décrit la SEP pour la première fois"},
            {"year": "1960", "event": "Premiers traitements par corticostéroïdes"},
            {"year": "1993", "event": "Premier traitement de fond approuvé (Interféron bêta-1b)"},
            {"year": "2004", "event": "Introduction du Natalizumab, thérapie ciblée"},
            {"year": "2010", "event": "Premier traitement oral (Fingolimod) approuvé"},
            {"year": "2017", "event": "Ocrelizumab: premier traitement pour la PPMS"},
            {"year": "2024", "event": "Thérapies par cellules souches en essais cliniques avancés"},
        ],
    }


@router.get("/sep-news")
async def get_sep_news():
    """Curated real news and resources about MS/SEP."""
    return {
        "ticker": [
            "L'Institut Mongi Ben Hamida : centre de référence neurologique en Tunisie",
            "Nouveaux anticorps monoclonaux : réduction de 95% des poussées",
            "Journée mondiale de la SEP — 30 mai 2025",
            "L'IA prédit les poussées de SEP 6 mois à l'avance avec 87% de précision",
            "Étude JAMA : la vitamine D réduit les poussées de 30%",
            "Thérapie CAR-T : un espoir contre la sclérose en plaques",
        ],
        "organisations": [
            {
                "id": 1,
                "name": "Ministère de la Santé",
                "subtitle": "Portail officiel — Santé publique",
                "subtitle_color": "#ea580c",
                "description": "Site officiel du Ministère de la Santé tunisien : centres de soins et programmes de prévention.",
                "url": "https://www.santetunisie.rns.tn",
                "domain": "www.santetunisie.rns.tn",
                "status": "En ligne",
                "badge": "Tunisie",
                "badge_color": "#ef4444",
                "screenshot": "https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=200&fit=crop",
            },
            {
                "id": 2,
                "name": "ATSEP — Assoc. Tunisienne SEP",
                "subtitle": "Accompagnement & Soutien patients",
                "subtitle_color": "#059669",
                "description": "Association dédiée à l'accompagnement des patients SEP en Tunisie : aide sociale et plaidoyer.",
                "url": "https://www.facebook.com/ATSEP.Tunisie",
                "domain": "www.facebook.com",
                "status": "En ligne",
                "badge": "Tunisie",
                "badge_color": "#ef4444",
                "screenshot": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop",
            },
            {
                "id": 3,
                "name": "Association Tunisienne de Neurologie",
                "subtitle": "Neuro Tunisia — Recherche & Formation",
                "subtitle_color": "#7c3aed",
                "description": "Association des neurologues tunisiens : congrès annuels, formations et recherche sur la SEP.",
                "url": "https://www.neurotunisia.tn",
                "domain": "neurotunisia.tn",
                "status": "En ligne",
                "badge": "Tunisie",
                "badge_color": "#ef4444",
                "screenshot": "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=200&fit=crop",
            },
            {
                "id": 4,
                "name": "Institut Mongi Ben Hamida",
                "subtitle": "Institut National de Neurologie — La Rabta",
                "subtitle_color": "#0891b2",
                "description": "Centre de référence pour la neurologie en Tunisie, spécialisé dans le diagnostic de la SEP.",
                "url": "https://fr.wikipedia.org/wiki/Institut_national_de_neurologie_Mongi-Ben_Hamida",
                "domain": "fr.wikipedia.org",
                "status": "En ligne",
                "badge": "Tunisie",
                "badge_color": "#ef4444",
                "screenshot": "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=200&fit=crop",
            },
            {
                "id": 5,
                "name": "MSIF — Fédération Internationale",
                "subtitle": "Multiple Sclerosis International Federation",
                "subtitle_color": "#4f46e5",
                "description": "Réseau mondial reliant les organisations SEP de 100+ pays pour la recherche et les soins.",
                "url": "https://www.msif.org",
                "domain": "www.msif.org",
                "status": "En ligne",
                "badge": "International",
                "badge_color": "#d97706",
                "screenshot": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&h=200&fit=crop",
            },
            {
                "id": 6,
                "name": "National MS Society",
                "subtitle": "Recherche & Programmes — USA",
                "subtitle_color": "#ea580c",
                "description": "Organisation leader dans le financement de la recherche SEP et le soutien aux patients.",
                "url": "https://www.nationalmssociety.org",
                "domain": "www.nationalmssociety.org",
                "status": "En ligne",
                "badge": "International",
                "badge_color": "#d97706",
                "screenshot": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=200&fit=crop",
            },
        ],
    }
