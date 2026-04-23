import { useEffect, useState } from 'react'
import { Plus, Trash2, Link, UserCheck } from 'lucide-react'
import api from '../../services/api'

export default function AdminLiaisons() {
  const [contrats, setContrats] = useState([])
  const [radiologues, setRadiologues] = useState([])
  const [medecins, setMedecins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ radiologue_id: '', medecin_id: '' })
  const [message, setMessage] = useState('')

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const [resC, resU] = await Promise.all([
        api.get('/contrats'),
        api.get('/admin/utilisateurs?limit=200'),
      ])
      setContrats(resC.data || [])
      const users = resU.data?.data || resU.data || []
      setRadiologues(users.filter(u => u.role === 'radiologue' && u.statut === 'actif'))
      setMedecins(users.filter(u => u.role === 'medecin' && u.statut === 'actif'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const creerLiaison = async () => {
    if (!form.radiologue_id || !form.medecin_id) {
      setMessage('⚠️ Sélectionnez un radiologue et un médecin')
      return
    }
    try {
      await api.post('/contrats', form)
      setMessage('✅ Liaison créée avec succès')
      setShowForm(false)
      setForm({ radiologue_id: '', medecin_id: '' })
      charger()
    } catch (e) {
      const detail = e.response?.data?.detail || 'Erreur'
      setMessage('❌ ' + detail)
    }
    setTimeout(() => setMessage(''), 4000)
  }

  const supprimerLiaison = async (id) => {
    try {
      await api.delete(`/contrats/${id}`)
      setMessage('Liaison supprimée')
      charger()
    } catch {
      setMessage('❌ Erreur lors de la suppression')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Liaisons Radiologue — Médecin</h1>
          <p style={{ color: '#64748b' }}>Gérez les contrats entre radiologues et médecins</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '10px', border: 'none',
          background: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 600,
        }}>
          <Plus size={18} /> Nouvelle liaison
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          background: message.includes('✅') ? '#f0fdf4' : message.includes('⚠️') ? '#fffbeb' : '#fef2f2',
          color: message.includes('✅') ? '#166534' : message.includes('⚠️') ? '#92400e' : '#991b1b',
          border: `1px solid ${message.includes('✅') ? '#bbf7d0' : message.includes('⚠️') ? '#fde68a' : '#fecaca'}`,
        }}>
          {message}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '18px' }}>Créer une liaison</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Radiologue</label>
              <select value={form.radiologue_id} onChange={e => setForm(f => ({ ...f, radiologue_id: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                <option value="">Sélectionner un radiologue</option>
                {radiologues.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Médecin</label>
              <select value={form.medecin_id} onChange={e => setForm(f => ({ ...f, medecin_id: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                <option value="">Sélectionner un médecin</option>
                {medecins.map(u => <option key={u.id} value={u.id}>Dr. {u.prenom} {u.nom}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#475569' }}>
              Annuler
            </button>
            <button onClick={creerLiaison} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
              Créer la liaison
            </button>
          </div>
        </div>
      )}

      {/* Liste des liaisons */}
      {loading ? (
        <p style={{ color: '#64748b' }}>Chargement...</p>
      ) : contrats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Link size={48} color="#94a3b8" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: '#64748b' }}>Aucune liaison configurée</p>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Créez des liaisons entre radiologues et médecins pour permettre l'envoi de rapports</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Radiologue', 'Médecin', 'Date création', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contrats.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < contrats.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#0891b2' }}>
                        {c.radiologue_nom?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{c.radiologue_nom}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>
                        {c.medecin_nom?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600 }}>Dr. {c.medecin_nom}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => supprimerLiaison(c.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca',
                      background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: '12px',
                    }}>
                      <Trash2 size={13} /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
