import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Send, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const STATUT_LABEL = { en_attente: 'En attente', confirme: 'Confirmé', annule: 'Annulé' }
const STATUT_COLOR = { en_attente: { bg: '#fffbeb', color: '#92400e' }, confirme: { bg: '#f0fdf4', color: '#166534' }, annule: { bg: '#fef2f2', color: '#991b1b' } }

export default function RendezVous() {
  const { user } = useAuth()
  const [medecins, setMedecins] = useState([])
  const [mesRdv, setMesRdv] = useState([])
  const [selectedMedecin, setSelectedMedecin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ date: '', heure: '', motif: '', message: '', medecin_id: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resMedecins, resRdv] = await Promise.all([
        api.get('/medecins/disponibles'),
        api.get('/rendez-vous'),
      ])
      const liste = resMedecins.data || []
      setMedecins(liste)
      if (liste.length > 0) {
        setSelectedMedecin(liste[0])
        setForm(prev => ({ ...prev, medecin_id: liste[0].id }))
      }
      setMesRdv(resRdv.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSubmitting(true)
    try {
      await api.post('/rendez-vous', { ...form, patient_id: user.id })
      setSuccess(true)
      setForm({ date: '', heure: '', motif: '', message: '', medecin_id: selectedMedecin?.id || '' })
      fetchData()
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la prise de rendez-vous')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMedecinSelect = (medecin) => {
    setSelectedMedecin(medecin)
    setForm(prev => ({ ...prev, medecin_id: medecin.id }))
  }

  const motifs = [
    'Consultation de suivi',
    'Renouvellement de traitement',
    'Nouveaux symptômes',
    "Résultats d'examens",
    'Autre',
  ]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Prendre rendez-vous</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
          Contactez votre médecin et planifiez votre prochaine consultation
        </p>
      </div>

      {/* Mes rendez-vous existants */}
      {mesRdv.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eef0f4', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#1a1d26' }}>Mes rendez-vous</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mesRdv.map(rdv => {
              const sc = STATUT_COLOR[rdv.statut] || STATUT_COLOR.en_attente
              return (
                <div key={rdv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Dr. {rdv.medecin_nom}</div>
                    <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                      {rdv.date} à {rdv.heure} — {rdv.motif}
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, ...sc }}>
                    {STATUT_LABEL[rdv.statut] || rdv.statut}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sélection du médecin */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3b0' }}>Chargement...</div>
      ) : medecins.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eef0f4', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#1a1d26' }}>Choisissez votre médecin</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {medecins.map(medecin => (
              <div key={medecin.id} onClick={() => handleMedecinSelect(medecin)} style={{
                padding: '16px', borderRadius: '12px', cursor: 'pointer',
                border: selectedMedecin?.id === medecin.id ? '2px solid #4f46e5' : '1px solid #eef0f4',
                background: selectedMedecin?.id === medecin.id ? '#f5f3ff' : '#fff',
                position: 'relative',
              }}>
                {selectedMedecin?.id === medecin.id && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', width: '20px', height: '20px', borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={14} color="#fff" />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                    {medecin.prenom?.[0]}{medecin.nom?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1d26' }}>Dr. {medecin.prenom} {medecin.nom}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Neurologue</div>
                  </div>
                </div>
                {medecin.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                    <Mail size={12} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{medecin.email}</span>
                  </div>
                )}
                {medecin.telephone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                    <Phone size={12} /> <span>{medecin.telephone}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eef0f4', padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
          <AlertCircle size={32} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Aucun médecin disponible. Veuillez contacter l'administration.</p>
        </div>
      )}

      {/* Formulaire */}
      {medecins.length > 0 && selectedMedecin && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eef0f4', padding: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1d26', marginBottom: '20px' }}>Demande de rendez-vous</h2>

          {success && (
            <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} color="#059669" />
              <span style={{ fontSize: '14px', color: '#059669', fontWeight: 500 }}>
                Votre demande a été enregistrée. Un email de confirmation vous sera envoyé.
              </span>
            </div>
          )}
          {error && (
            <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} color="#dc2626" />
              <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Date souhaitée *</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#9ca3b0" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="date" required min={new Date().toISOString().split('T')[0]} value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '12px 12px 12px 42px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Heure souhaitée *</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={16} color="#9ca3b0" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="time" required value={form.heure}
                    onChange={e => setForm({ ...form, heure: e.target.value })}
                    style={{ width: '100%', padding: '12px 12px 12px 42px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Motif de consultation *</label>
              <select required value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Sélectionnez un motif</option>
                {motifs.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Message (optionnel)</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Décrivez brièvement votre demande..." rows={4}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={submitting} style={{
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
              background: submitting ? '#9ca3b0' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit',
            }}>
              <Send size={16} />
              {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
