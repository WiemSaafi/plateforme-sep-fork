import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

export default function RendezVous() {
  const { user } = useAuth()
  const [medecins, setMedecins] = useState([])
  const [selectedMedecin, setSelectedMedecin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    date: '',
    heure: '',
    motif: '',
    message: '',
    medecin_id: ''
  })

  useEffect(() => {
    fetchMedecins()
  }, [])

  const fetchMedecins = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/medecins/disponibles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      // Les médecins sont déjà filtrés par le backend
      const medecinsList = res.data
      setMedecins(medecinsList)
      
      // Sélectionner le premier médecin par défaut
      if (medecinsList.length > 0) {
        setSelectedMedecin(medecinsList[0])
        setForm(prev => ({ ...prev, medecin_id: medecinsList[0].id }))
      }
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
      await axios.post('http://127.0.0.1:8000/api/rendez-vous', {
        ...form,
        patient_id: user.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      
      setSuccess(true)
      setForm({ date: '', heure: '', motif: '', message: '', medecin_id: selectedMedecin?.id || '' })
      
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
    'Résultats d\'examens',
    'Autre'
  ]

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1d26', margin: 0, letterSpacing: '-0.02em' }}>
          Prendre rendez-vous
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
          Contactez votre médecin et planifiez votre prochaine consultation
        </p>
      </div>

      {/* Sélection du médecin */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3b0' }}>Chargement...</div>
      ) : medecins.length > 0 ? (
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '1px solid #eef0f4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          padding: '24px', marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1d26', marginBottom: '16px' }}>
            Choisissez votre médecin
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
            Sélectionnez le médecin avec qui vous souhaitez prendre rendez-vous
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {medecins.map(medecin => (
              <div
                key={medecin.id}
                onClick={() => handleMedecinSelect(medecin)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: selectedMedecin?.id === medecin.id ? '2px solid #4f46e5' : '1px solid #eef0f4',
                  background: selectedMedecin?.id === medecin.id ? '#f5f3ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (selectedMedecin?.id !== medecin.id) {
                    e.currentTarget.style.borderColor = '#c7d2fe'
                    e.currentTarget.style.background = '#fafbfd'
                  }
                }}
                onMouseLeave={e => {
                  if (selectedMedecin?.id !== medecin.id) {
                    e.currentTarget.style.borderColor = '#eef0f4'
                    e.currentTarget.style.background = '#fff'
                  }
                }}
              >
                {selectedMedecin?.id === medecin.id && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <CheckCircle size={14} color="#fff" />
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700, color: '#fff',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)'
                  }}>
                    {medecin.prenom?.[0]}{medecin.nom?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1d26', margin: 0 }}>
                      Dr. {medecin.prenom} {medecin.nom}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                      Neurologue
                    </p>
                  </div>
                </div>

                {medecin.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                    <Mail size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {medecin.email}
                    </span>
                  </div>
                )}
                {medecin.telephone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                    <Phone size={12} />
                    <span>{medecin.telephone}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '1px solid #eef0f4',
          padding: '40px', textAlign: 'center', marginBottom: '24px'
        }}>
          <AlertCircle size={32} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Aucun médecin disponible. Veuillez contacter l'administration.
          </p>
        </div>
      )}

      {/* Formulaire de rendez-vous */}
      {medecins.length > 0 && selectedMedecin && (
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '1px solid #eef0f4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          padding: '28px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1d26', marginBottom: '20px' }}>
            Demande de rendez-vous
          </h2>

          {success && (
            <div style={{
              padding: '14px 18px', borderRadius: '12px',
              background: '#ecfdf5', border: '1px solid #a7f3d0',
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <CheckCircle size={20} color="#059669" />
              <span style={{ fontSize: '14px', color: '#059669', fontWeight: 500 }}>
                Votre demande de rendez-vous a été envoyée avec succès ! Un email de confirmation vous sera envoyé.
              </span>
            </div>
          )}

          {error && (
            <div style={{
              padding: '14px 18px', borderRadius: '12px',
              background: '#fef2f2', border: '1px solid #fecaca',
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <AlertCircle size={20} color="#dc2626" />
              <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: 500 }}>
                {error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {/* Date */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Date souhaitée *
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#9ca3b0" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{
                      width: '100%', padding: '12px 12px 12px 42px',
                      border: '1px solid #e2e8f0', borderRadius: '10px',
                      fontSize: '14px', fontFamily: 'inherit',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Heure */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Heure souhaitée *
                </label>
                <div style={{ position: 'relative' }}>
                  <Clock size={16} color="#9ca3b0" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="time"
                    required
                    value={form.heure}
                    onChange={e => setForm({ ...form, heure: e.target.value })}
                    style={{
                      width: '100%', padding: '12px 12px 12px 42px',
                      border: '1px solid #e2e8f0', borderRadius: '10px',
                      fontSize: '14px', fontFamily: 'inherit',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>
            </div>

            {/* Motif */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Motif de consultation *
              </label>
              <select
                required
                value={form.motif}
                onChange={e => setForm({ ...form, motif: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1px solid #e2e8f0', borderRadius: '10px',
                  fontSize: '14px', fontFamily: 'inherit',
                  transition: 'all 0.2s', background: '#fff'
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Sélectionnez un motif</option>
                {motifs.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Message (optionnel)
              </label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Décrivez brièvement votre demande..."
                rows={4}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1px solid #e2e8f0', borderRadius: '10px',
                  fontSize: '14px', fontFamily: 'inherit',
                  transition: 'all 0.2s', resize: 'vertical'
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '14px',
                background: submitting ? '#9ca3b0' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '14px', fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s', fontFamily: 'inherit'
              }}
              onMouseEnter={e => !submitting && (e.target.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              <Send size={16} />
              {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
