import { useEffect, useState } from 'react'
import { FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Brain } from 'lucide-react'
import api from '../../services/api'

function BadgeLesion({ v }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
      background: v ? '#fef2f2' : '#f0fdf4', color: v ? '#991b1b' : '#166534'
    }}>
      {v ? 'Lésions nouvelles' : 'Stable'}
    </span>
  )
}

function CarteRapport({ irm }) {
  const [open, setOpen] = useState(false)
  const r = irm.rapport || {}

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* En-tête */}
      <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={22} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{irm.patient_nom}</div>
            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
              {irm.sequence_type} — Radiologue : <strong>{irm.radiologue_nom || '—'}</strong>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              Envoyé le {irm.envoye_at ? new Date(irm.envoye_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {r.lesions_nouvelles !== undefined && <BadgeLesion v={r.lesions_nouvelles} />}
          <button onClick={() => setOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
            background: open ? '#f1f5f9' : 'white', color: '#475569',
            cursor: 'pointer', fontSize: '13px', fontWeight: 500,
          }}>
            {open ? <><ChevronUp size={15} /> Masquer</> : <><ChevronDown size={15} /> Voir le rapport</>}
          </button>
        </div>
      </div>

      {/* Contenu rapport déroulant */}
      {open && (
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px 24px', background: '#fafbfc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Qualité image</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{r.qualite_image || '—'}</div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Lésions</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                {r.lesions_nouvelles ? `${r.nombre_lesions || 0} nouvelle(s)` : 'Aucune nouvelle'}
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Activité inflammatoire</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: r.prise_contraste ? '#ef4444' : '#22c55e' }}>
                {r.prise_contraste ? 'Oui — lésions actives' : 'Non'}
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Localisation</div>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                {(r.localisation || []).join(', ') || '—'}
              </div>
            </div>
          </div>

          {r.conclusion && (
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Conclusion</div>
              <p style={{ margin: 0, fontSize: '14px', color: '#1e293b', lineHeight: 1.6 }}>{r.conclusion}</p>
            </div>
          )}
          {r.recommandations && (
            <div style={{ background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', textTransform: 'uppercase', marginBottom: '8px' }}>Recommandations</div>
              <p style={{ margin: 0, fontSize: '14px', color: '#78350f', lineHeight: 1.6 }}>{r.recommandations}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RapportsRecus() {
  const [irms, setIrms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/patients/rapports/recus')
      .then(r => setIrms(r.data || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Rapports reçus</h1>
        <p style={{ color: '#64748b' }}>Rapports radiologiques transmis par vos radiologues contractés</p>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Chargement...</p>
      ) : irms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: '#64748b', fontSize: '15px' }}>Aucun rapport reçu pour le moment</p>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Les rapports envoyés par vos radiologues apparaîtront ici</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {irms.map(irm => <CarteRapport key={irm.id} irm={irm} />)}
        </div>
      )}
    </div>
  )
}
