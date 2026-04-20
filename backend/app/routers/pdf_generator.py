from fastapi import APIRouter, Query
from fastapi.responses import Response
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from urllib.parse import unquote
from datetime import datetime

router = APIRouter()

@router.get("/rendez-vous/pdf")
async def generate_appointment_pdf(
    date: str = Query(...),
    heure: str = Query(...),
    medecin: str = Query(...),
    motif: str = Query(...),
    patient: str = Query(...)
):
    """Génère un PDF de confirmation de rendez-vous"""
    
    # Décoder les paramètres URL
    medecin = unquote(medecin)
    motif = unquote(motif)
    patient = unquote(patient)
    
    # Créer un buffer pour le PDF
    buffer = BytesIO()
    
    # Créer le document PDF
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Style personnalisé pour le titre
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#667eea'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Style pour le sous-titre
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=40,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    # Style pour les sections
    section_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )
    
    # Header avec logo et titre
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("🏥 Neuro Predict MS", title_style))
    elements.append(Paragraph("Plateforme de suivi médical SEP", subtitle_style))
    
    # Badge de confirmation
    confirmation_data = [['✓ CONFIRMATION DE RENDEZ-VOUS']]
    confirmation_table = Table(confirmation_data, colWidths=[6*inch])
    confirmation_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
    ]))
    elements.append(confirmation_table)
    elements.append(Spacer(1, 0.4*inch))
    
    # Message de bienvenue
    welcome_text = f"<b>Bonjour {patient},</b><br/><br/>Votre demande de rendez-vous a été enregistrée avec succès. Vous trouverez ci-dessous tous les détails de votre consultation."
    welcome_para = Paragraph(welcome_text, styles['Normal'])
    elements.append(welcome_para)
    elements.append(Spacer(1, 0.3*inch))
    
    # Section détails du rendez-vous
    elements.append(Paragraph("📅 Détails du rendez-vous", section_style))
    
    # Tableau des détails
    details_data = [
        ['📆 Date', date],
        ['🕐 Heure', heure],
        ['👨‍⚕️ Médecin', f'Dr. {medecin}'],
        ['📋 Motif', motif],
    ]
    
    details_table = Table(details_data, colWidths=[2*inch, 4*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Alerte importante
    alert_data = [['⚠️ IMPORTANT', 'Ce rendez-vous est en attente de confirmation par votre médecin. Vous recevrez un email de confirmation définitive dans les plus brefs délais.']]
    alert_table = Table(alert_data, colWidths=[1.5*inch, 4.5*inch])
    alert_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#92400e')),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#78350f')),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('ALIGN', (1, 0), (1, 0), 'LEFT'),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, 0), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    elements.append(alert_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Info rappel
    reminder_data = [['🔔 RAPPEL AUTOMATIQUE', 'Nous vous enverrons un rappel 24 heures avant votre rendez-vous par email et SMS.']]
    reminder_table = Table(reminder_data, colWidths=[1.5*inch, 4.5*inch])
    reminder_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#dbeafe')),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#1e3a8a')),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('ALIGN', (1, 0), (1, 0), 'LEFT'),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, 0), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    elements.append(reminder_table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    footer_text = f"""
    <b>© 2026 Neuro Predict MS</b><br/>
    Plateforme de suivi médical pour la Sclérose En Plaques<br/>
    <br/>
    <font size=8 color='#94a3b8'>Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}</font>
    """
    elements.append(Paragraph(footer_text, footer_style))
    
    # Construire le PDF
    doc.build(elements)
    
    # Récupérer le contenu du buffer
    pdf_content = buffer.getvalue()
    buffer.close()
    
    # Retourner le PDF
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Rendez-vous_{date.replace('/', '-')}.pdf"
        }
    )
