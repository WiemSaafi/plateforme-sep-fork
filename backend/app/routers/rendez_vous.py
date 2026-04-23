from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.routers.auth import get_current_user
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from urllib.parse import unquote

router = APIRouter()

class RendezVousCreate(BaseModel):
    date: str
    heure: str
    motif: str
    message: Optional[str] = None
    patient_id: str
    medecin_id: str

# Configuration email Gmail
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = "mohamed24025287@gmail.com"
SMTP_PASSWORD = "rmhjzqijeoniqniw"

def send_appointment_email(patient_email: str, patient_name: str, medecin_name: str, date: str, heure: str, motif: str):
    """Envoie un email de confirmation de rendez-vous"""
    try:
        # Créer le message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Confirmation de rendez-vous - {date}"
        msg['From'] = SMTP_EMAIL
        msg['To'] = patient_email

        # Corps de l'email en HTML - Version compatible avec tous les clients email
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f0f0f0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f0; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #667eea; padding: 40px 30px; text-align: center;">
                            <div style="font-size: 40px; margin-bottom: 10px;">🏥</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Neuro Predict MS</h1>
                            <p style="color: #ffffff; margin: 10px 0 0; font-size: 14px;">Plateforme de suivi médical SEP</p>
                        </td>
                    </tr>
                    
                    <!-- Badge -->
                    <tr>
                        <td style="padding: 20px 30px; text-align: center;">
                            <div style="background-color: #10b981; color: white; display: inline-block; padding: 10px 25px; border-radius: 25px; font-weight: bold; font-size: 13px;">
                                ✓ Demande enregistrée
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <h2 style="color: #1e293b; margin: 0 0 15px; font-size: 24px;">Bonjour {patient_name},</h2>
                            <p style="color: #64748b; line-height: 1.6; margin: 0 0 25px; font-size: 15px;">
                                Votre demande de rendez-vous a été enregistrée avec succès. Vous trouverez ci-dessous tous les détails de votre consultation.
                            </p>
                            
                            <!-- Details Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="color: #667eea; margin: 0 0 15px; font-size: 18px;">📅 Détails du rendez-vous</h3>
                                        
                                        <table width="100%" cellpadding="8" cellspacing="0" border="0">
                                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                                <td style="color: #64748b; font-weight: bold; font-size: 14px;">📆 Date</td>
                                                <td align="right" style="color: #1e293b; font-weight: bold; font-size: 14px;">{date}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                                <td style="color: #64748b; font-weight: bold; font-size: 14px;">🕐 Heure</td>
                                                <td align="right" style="color: #1e293b; font-weight: bold; font-size: 14px;">{heure}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                                <td style="color: #64748b; font-weight: bold; font-size: 14px;">👨‍⚕️ Médecin</td>
                                                <td align="right" style="color: #1e293b; font-weight: bold; font-size: 14px;">Dr. {medecin_name}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #64748b; font-weight: bold; font-size: 14px;">📋 Motif</td>
                                                <td align="right" style="color: #1e293b; font-weight: bold; font-size: 14px;">{motif}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alert Important -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; margin-bottom: 15px;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <p style="margin: 0 0 5px; color: #92400e; font-size: 14px; font-weight: bold;">⚠️ Important</p>
                                        <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
                                            Ce rendez-vous est en attente de confirmation par votre médecin. Vous recevrez un email de confirmation définitive dans les plus brefs délais.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alert Reminder -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <p style="margin: 0 0 5px; color: #1e40af; font-size: 14px; font-weight: bold;">🔔 Rappel automatique</p>
                                        <p style="margin: 0; color: #1e3a8a; font-size: 13px; line-height: 1.5;">
                                            Nous vous enverrons un rappel 24 heures avant votre rendez-vous par email et SMS.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="http://127.0.0.1:5173/rendez-vous" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: bold; font-size: 15px;">
                                            📅 Voir mes rendez-vous
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="http://127.0.0.1:8000/api/rendez-vous/pdf?date={date}&heure={heure}&medecin={medecin_name}&motif={motif}&patient={patient_name}" style="display: inline-block; background-color: #ffffff; color: #667eea; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: bold; font-size: 15px; border: 2px solid #667eea;">
                                            📄 Télécharger le PDF
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1e293b; padding: 25px 30px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #cbd5e1; font-size: 13px; font-weight: bold;">
                                © 2026 Neuro Predict MS
                            </p>
                            <p style="margin: 0 0 15px; color: #94a3b8; font-size: 12px;">
                                Plateforme de suivi médical pour la Sclérose En Plaques
                            </p>
                            <p style="margin: 0; color: #64748b; font-size: 11px; border-top: 1px solid #334155; padding-top: 15px;">
                                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """

        # Attacher le HTML
        part = MIMEText(html, 'html')
        msg.attach(part)

        # Envoyer l'email via Gmail
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Email envoyé avec succès à {patient_email}")
        print(f"📧 Rendez-vous le {date} à {heure} avec Dr. {medecin_name}")
        
        return True
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email: {e}")
        return False

def serialize_rdv(rdv) -> dict:
    return {
        "id": str(rdv.id),
        "patient_id": rdv.patient_id,
        "medecin_id": rdv.medecin_id,
        "date": rdv.date,
        "heure": rdv.heure,
        "motif": rdv.motif,
        "message": rdv.message,
        "statut": rdv.statut,
        "patient_nom": rdv.patient_nom,
        "medecin_nom": rdv.medecin_nom,
        "created_at": rdv.created_at,
    }

@router.post("/rendez-vous")
async def create_rendez_vous(data: RendezVousCreate, current_user=Depends(get_current_user)):
    from app.models.documents import Patient, Utilisateur, RendezVous
    from beanie import PydanticObjectId

    medecin = await Utilisateur.get(PydanticObjectId(data.medecin_id))
    if not medecin:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")

    patient_email = current_user.email
    patient_name = f"{current_user.prenom} {current_user.nom}"
    try:
        patient = await Patient.get(PydanticObjectId(data.patient_id))
        if patient:
            patient_email = (patient.contact or {}).get('email') or current_user.email
            patient_name = f"{patient.prenom} {patient.nom}"
    except Exception:
        pass

    medecin_name = f"{medecin.prenom} {medecin.nom}"

    rdv = RendezVous(
        patient_id=data.patient_id,
        medecin_id=data.medecin_id,
        date=data.date,
        heure=data.heure,
        motif=data.motif,
        message=data.message,
        patient_nom=patient_name,
        medecin_nom=medecin_name,
    )
    await rdv.insert()

    email_sent = False
    try:
        email_sent = send_appointment_email(
            patient_email=patient_email,
            patient_name=patient_name,
            medecin_name=medecin_name,
            date=data.date,
            heure=data.heure,
            motif=data.motif,
        )
    except Exception as e:
        print(f"Email non envoyé: {e}")

    return {
        "message": "Demande de rendez-vous enregistrée avec succès",
        "email_sent": email_sent,
        "rendez_vous": serialize_rdv(rdv),
    }

@router.get("/rendez-vous")
async def get_mes_rendez_vous(current_user=Depends(get_current_user)):
    from app.models.documents import RendezVous
    rdvs = await RendezVous.find(RendezVous.patient_id == str(current_user.id)).sort("-created_at").to_list()
    return [serialize_rdv(r) for r in rdvs]

@router.get("/rendez-vous/medecin")
async def get_rdv_medecin(current_user=Depends(get_current_user)):
    from app.models.documents import RendezVous
    rdvs = await RendezVous.find(RendezVous.medecin_id == str(current_user.id)).sort("-created_at").to_list()
    return [serialize_rdv(r) for r in rdvs]

@router.patch("/rendez-vous/{rdv_id}/statut")
async def update_statut_rdv(rdv_id: str, body: dict, current_user=Depends(get_current_user)):
    from app.models.documents import RendezVous
    from beanie import PydanticObjectId
    rdv = await RendezVous.get(PydanticObjectId(rdv_id))
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    rdv.statut = body.get("statut", rdv.statut)
    await rdv.save()
    return serialize_rdv(rdv)
