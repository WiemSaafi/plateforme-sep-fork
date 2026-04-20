import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ChevronLeft, ChevronRight, Users, Archive, ArrowRight, Filter, UserPlus } from 'lucide-react'
import { patientService } from '../../services/patientService'

export default function PatientsList() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [archivedPatients, setArchivedPatients] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })
  const [archivedPagination, setArchivedPagination] = useState({ page: 1, total: 0, pages: 1 })
  const [search, setSearch] = useState('')
  const [sexe, setSexe] = useState('')
  const [loading, setLoading] = useState(true)
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [form, setForm] = useState({
    nom: '', prenom: '', date_naissance: '', sexe: '', contact: { email: '', telephone: '' }
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchPatients = async (page = 1) => {
    setLoading(true)
    try {
      const res = await patientService.getAll(page, 10, search, sexe)
      setPatients(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchArchivedPatients = async (page = 1) => {
    setArchivedLoading(true)
    try {
      const res = await patientService.getArchived(page, 10, search, sexe)
      setArchivedPatients(res.data.data || [])
      setArchivedPagination(res.data.pagination || { page: 1, total: 0, pages: 0 })
    } catch (err) {
      console.error('Erreur lors de la récupération des patients archivés:', err)
      // Afficher une erreur à l'utilisateur
      setError('Erreur lors du chargement des patients archivés')
      setArchivedPatients([])
      setArchivedPagination({ page: 1, total: 0, pages: 0 })
    } finally {
      setArchivedLoading(false)
    }
  }

  useEffect(() => {
    if (showArchived) {
      fetchArchivedPatients()
    } else {
      fetchPatients()
    }
  }, [search, sexe, showArchived])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation frontend
    if (!form.nom || form.nom.length < 2) {
      setError('Le nom doit contenir au moins 2 caractères')
      return
    }
    if (!form.prenom || form.prenom.length < 2) {
      setError('Le prénom doit contenir au moins 2 caractères')
      return
    }
    if (!form.date_naissance) {
      setError('La date de naissance est requise')
      return
    }
    
    // Vérifier que le nom et prénom ne contiennent que des lettres
    const namePattern = /^[a-zA-ZÀ-ÿ\s\-']+$/
    if (!namePattern.test(form.nom)) {
      setError('Le nom ne doit contenir que des lettres, espaces et tirets')
      return
    }
    if (!namePattern.test(form.prenom)) {
      setError('Le prénom ne doit contenir que des lettres, espaces et tirets')
      return
    }
    
    // Vérifier la date de naissance
    const birthDate = new Date(form.date_naissance)
    if (birthDate >= new Date()) {
      setError('La date de naissance doit être dans le passé')
      return
    }
    if (birthDate.getFullYear() < 1900) {
      setError('Date de naissance invalide')
      return
    }
    
    try {
      const payload = {
        ...form,
        contact: form.contact.email || form.contact.telephone ? form.contact : undefined
      }
      console.log('Données envoyées:', payload)
      await patientService.create(payload)
      setSuccess('Patient créé avec succès !')
      setShowForm(false)
      setForm({ nom: '', prenom: '', date_naissance: '', sexe: '', contact: { email: '', telephone: '' } })
      fetchPatients()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Erreur création patient:', err)
      let errorMessage = 'Erreur lors de la création'
      
      if (err.response?.data) {
        if (Array.isArray(err.response.data)) {
          // Si c'est un tableau d'erreurs de validation
          errorMessage = err.response.data.map(e => e.msg || e.message).join(', ')
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    }
  }

  const handleArchive = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Archiver ce patient ? Il ne sera plus visible dans la liste active mais les données seront conservées.')) return
    try {
      await patientService.archive(id)
      setSuccess('Patient archivé avec succès !')
      fetchPatients()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setError('Erreur lors de l\'archivage du patient')
    }
  }

  return (
    <div className="animate-fadeIn" style={{ color: '#1a1d26' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1d26', margin: 0, letterSpacing: '-0.02em' }}>
            Patients
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
            {showArchived 
              ? `${archivedPagination.total} patient${archivedPagination.total > 1 ? 's' : ''} archivé${archivedPagination.total > 1 ? 's' : ''}`
              : `${pagination.total} patient${pagination.total > 1 ? 's' : ''} enregistré${pagination.total > 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
            <button
              onClick={() => setShowArchived(false)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: showArchived ? 'transparent' : '#fff', color: '#1a1d26',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: showArchived ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              Actifs
            </button>
            <button
              onClick={() => setShowArchived(true)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: showArchived ? '#fff' : 'transparent', color: '#1a1d26',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: showArchived ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Archivés
            </button>
          </div>
          {!showArchived && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
            >
              <UserPlus size={16} />
              Nouveau patient
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      {success && (
        <div className="animate-slideUp" style={{
          marginBottom: '16px', padding: '14px 18px', borderRadius: '12px',
          background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857',
          fontSize: '14px', fontWeight: 500,
        }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="animate-slideUp" style={{
          marginBottom: '16px', padding: '14px 18px', borderRadius: '12px',
          background: '#fef2f2', borderLeft: '3px solid #ef4444', color: '#dc2626',
          fontSize: '14px', fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {/* ── Formulaire création ───────────────────────────────── */}
      {showForm && (
        <div className="glass-card-glow animate-slideUp" style={{ padding: '28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1d26', margin: 0 }}>Nouveau patient</h2>
              <p style={{ fontSize: '13px', color: '#9ca3b0', margin: 0 }}>Remplissez les informations du patient</p>
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="label-light">Nom *</label>
                <input
                  type="text" value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  className="input-light" placeholder="Nom du patient" required
                />
              </div>
              <div>
                <label className="label-light">Prénom *</label>
                <input
                  type="text" value={form.prenom}
                  onChange={e => setForm({ ...form, prenom: e.target.value })}
                  className="input-light" placeholder="Prénom du patient" required
                />
              </div>
              <div>
                <label className="label-light">Date de naissance *</label>
                <input
                  type="date" value={form.date_naissance}
                  onChange={e => setForm({ ...form, date_naissance: e.target.value })}
                  className="input-light" required
                />
              </div>
              <div>
                <label className="label-light">Sexe</label>
                <select
                  value={form.sexe}
                  onChange={e => setForm({ ...form, sexe: e.target.value })}
                  className="select-light"
                >
                  <option value="">— Choisir —</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className="label-light">Email</label>
                <input
                  type="email" value={form.contact.email}
                  onChange={e => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })}
                  className="input-light" placeholder="email@exemple.com"
                />
              </div>
              <div>
                <label className="label-light">Téléphone</label>
                <input
                  type="text" value={form.contact.telephone}
                  onChange={e => setForm({ ...form, contact: { ...form.contact, telephone: e.target.value } })}
                  className="input-light" placeholder="+212 6XX XXX XXX"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary">Enregistrer</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filtres ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center',
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: '#9ca3b0', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Rechercher par nom ou prénom…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-light"
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} style={{ color: '#9ca3b0' }} />
          <select
            value={sexe}
            onChange={e => setSexe(e.target.value)}
            className="select-light"
            style={{ width: '160px' }}
          >
            <option value="">Tous les sexes</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>
      </div>

      {/* ── Tableau ───────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        border: '1px solid #eef0f4',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eef0f4' }}>
              {['Patient', 'Date de naissance', 'Sexe', 'Contact', showArchived ? 'Actions' : 'Actions'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '14px 20px',
                  fontSize: '11px', fontWeight: 600, color: '#9ca3b0',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: '#fafbfd',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(showArchived ? archivedLoading : loading) ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '56px 0', color: '#9ca3b0' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', margin: '0 auto 12px',
                    border: '2px solid #eef0f4', borderTopColor: '#4f46e5',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Chargement...
                </td>
              </tr>
            ) : (showArchived ? archivedPatients : patients).length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '56px 0' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px', margin: '0 auto 12px',
                    background: showArchived ? '#fef3c7' : '#f5f3ff', 
                    border: showArchived ? '1px solid #fbbf24' : '1px solid #c4b5fd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Archive size={22} color={showArchived ? "#f59e0b" : "#7c3aed"} />
                  </div>
                  <div style={{ fontWeight: 600, color: '#1a1d26', marginBottom: '4px' }}>
                    {showArchived ? 'Aucun patient archivé' : 'Aucun patient trouvé'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3b0' }}>
                    {showArchived ? 'Les patients archivés apparaîtront ici' : 'Ajoutez votre premier patient'}
                  </div>
                </td>
              </tr>
            ) : (
              (showArchived ? archivedPatients : patients).map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/patients/${p.id}`)}
                  style={{
                    borderBottom: i < (showArchived ? archivedPatients : patients).length - 1 ? '1px solid #f4f5f7' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: showArchived ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = showArchived ? '#fef3c7' : '#f8f7ff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: showArchived 
                          ? 'linear-gradient(135deg, #fef3c7, #fed7aa)' 
                          : 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                        border: showArchived ? '1px solid #fbbf24' : '1px solid #c7d2fe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, color: showArchived ? '#f59e0b' : '#4f46e5',
                        flexShrink: 0,
                      }}>
                        {p.prenom?.[0]}{p.nom?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1d26' }}>
                          {p.prenom} {p.nom}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3b0', fontFamily: 'monospace' }}>
                          #{p.id.slice(-8)}
                        </div>
                        {showArchived && p.archived_at && (
                          <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
                            Archivé le {new Date(p.archived_at).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#5a6070' }}>
                    {p.date_naissance}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={p.sexe === 'M' ? 'badge badge-blue' : p.sexe === 'F' ? 'badge badge-purple' : 'badge'} style={!p.sexe ? { background: '#f4f5f7', color: '#9ca3b0' } : {}}>
                      {p.sexe === 'M' ? 'Masculin' : p.sexe === 'F' ? 'Féminin' : '---'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6b7280' }}>
                    {p.contact?.email || p.contact?.telephone || (
                      <span style={{ color: '#c9cdd5' }}>---</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/patients/${p.id}`) }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '5px 12px', borderRadius: '8px', border: '1px solid #e2e5eb',
                          background: '#fff', fontSize: '12px', fontWeight: 500, color: '#5a6070',
                          cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5eb'; e.currentTarget.style.color = '#5a6070' }}
                      >
                        Voir <ArrowRight size={11} />
                      </button>
                      {!showArchived && (
                        <button
                          onClick={(e) => handleArchive(p.id, e)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e2e5eb',
                            background: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.background = '#fef3c7' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5eb'; e.currentTarget.style.background = '#fff' }}
                        >
                          <Archive size={13} color="#f59e0b" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderTop: '1px solid #eef0f4',
          }}>
            <span style={{ fontSize: '13px', color: '#9ca3b0' }}>
              Page {pagination.page} sur {pagination.pages}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => fetchPatients(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px', borderRadius: '8px',
                  border: '1px solid #e2e5eb', background: '#fff',
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                  opacity: pagination.page === 1 ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <ChevronLeft size={16} color="#5a6070" />
              </button>
              <button
                onClick={() => fetchPatients(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px', borderRadius: '8px',
                  border: '1px solid #e2e5eb', background: '#fff',
                  cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer',
                  opacity: pagination.page === pagination.pages ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <ChevronRight size={16} color="#5a6070" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}