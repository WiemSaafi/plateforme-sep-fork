import { useEffect, useState } from 'react'
import { Brain, Clock, CheckCircle, Send, FileText, ArrowRight, RefreshCw, UserCheck, Layers } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const SEQ_COLOR = {
  FLAIR: '#3b82f6', T1: '#8b5cf6', T2: '#10b981',
  DWI: '#f59e0b', T1_GADOLINIUM: '#ef4444',
}

export default function DashboardRadiologue() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [irms, setIrms] = useState([])
  const [nbContrats, setNbContrats] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const charger = async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const [resP, resC] = await Promise.all([
        api.get('/patients/?limit=100'),
        api.get('/contrats/mes-medecins'),
      ])
      const patients = resP.data.data || []
      setNbContrats((resC.data || []).length)

      const all = []
      await Promise.all(patients.map(async (p) => {
        try {
          const r = await api.get(`/patients/${p.id}/irm/`)
          ;(r.data.data || []).forEach(irm =>
            all.push({ ...irm, patient_nom: `${p.prenom} ${p.nom}` })
          )
        } catch {}
      }))
      all.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
      setIrms(all)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { charger() }, [])

  const enAttente  = irms.filter(i => !i.rapport)
  const rediges    = irms.filter(i =>  i.rapport)
  const envoyes    = irms.filter(i =>  i.envoi_medecin_id)

  const cards = [
    {
      label: 'IRM en attente',
      value: enAttente.length,
      icon: Clock,
      color: '#f59e0b',
      gradient: 'stat-gradient-amber',
      onClick: () => navigate('/irm'),
    },
    {
      label: 'Rapports rédigés',
      value: rediges.length,
      icon: FileText,
      color: '#7c3aed',
      gradient: 'stat-gradient-violet',
      onClick: () => navigate('/rapports'),
    },
    {
      label: 'Envoyés aux médecins',
      value: envoyes.length,
      icon: Send,
      color: '#059669',
      gradient: 'stat-gradient-emerald',
      onClick: null,
    },
    {
      label: 'Médecins contractés',
      value: nbContrats,
      icon: UserCheck,
      color: '#2563eb',
      gradient: 'stat-gradient-blue',
      onClick: null,
    },
  ]

  return (
    <div className="animate-fadeIn" style={{ color: '#1a1d26' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1d26', margin: 0, letterSpacing: '-0.02em' }}>
            Bonjour, {user?.prenom} {user?.nom} 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
            File d'imagerie — vue radiologue
          </p>
        </div>
        <button
          className="btn-ghost"
          onClick={() => charger(true)}
          disabled={refreshing}
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {cards.map(({ label, value, icon: Icon, color, gradient, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={gradient}
            style={{
              borderRadius: '16px', padding: '24px',
              cursor: onClick ? 'pointer' : 'default',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{label}</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#1a1d26', letterSpacing: '-0.02em' }}>
              {loading ? <span style={{ fontSize: '20px', color: '#9ca3b0' }}>…</span> : value}
            </div>
            {onClick && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '12px', color: '#9ca3b0', fontWeight: 500 }}>
                Voir détails <ArrowRight size={12} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Deux colonnes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* IRM en attente */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eef0f4', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #eef0f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} color="#d97706" />
              </div>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>IRM en attente</span>
              {!loading && enAttente.length > 0 && (
                <span className="badge badge-amber">{enAttente.length}</span>
              )}
            </div>
            <button onClick={() => navigate('/irm')} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Voir tout <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3b0' }}>Chargement…</div>
          ) : enAttente.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <CheckCircle size={36} color="#22c55e" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ color: '#6b7280', fontSize: '14px' }}>File vide — tout est analysé</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {enAttente.slice(0, 5).map(irm => {
                const sq = irm.sequence_type
                const sqColor = SEQ_COLOR[sq] || '#94a3b8'
                return (
                  <div
                    key={irm.id}
                    onClick={() => navigate(`/rapports/${irm.id}`, { state: { irm } })}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: sqColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: sqColor, flexShrink: 0 }}>
                      {sq || 'IRM'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{irm.patient_nom}</div>
                      <div style={{ color: '#9ca3b0', fontSize: '12px', marginTop: '1px' }}>
                        {irm.metadata?.nb_slices ? `${irm.metadata.nb_slices} coupes` : '—'}
                        {irm.metadata?.taille_mb ? ` · ${irm.metadata.taille_mb} MB` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {irm.uploaded_at ? new Date(irm.uploaded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                    </span>
                    <ArrowRight size={14} color="#c7d2fe" />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Rapports récents */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eef0f4', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #eef0f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="#7c3aed" />
              </div>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Rapports récents</span>
              {!loading && rediges.length > 0 && (
                <span className="badge badge-purple">{rediges.length}</span>
              )}
            </div>
            <button onClick={() => navigate('/rapports')} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Tous <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3b0' }}>Chargement…</div>
          ) : rediges.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Brain size={36} color="#c4b5fd" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Aucun rapport rédigé</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {rediges.slice(0, 5).map(irm => {
                const estEnvoye = !!irm.envoi_medecin_id
                return (
                  <div
                    key={irm.id}
                    onClick={() => navigate(`/rapports/${irm.id}`, { state: { irm } })}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={18} color="#22c55e" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{irm.patient_nom}</div>
                      <div style={{ color: '#9ca3b0', fontSize: '12px', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {irm.rapport?.conclusion
                          ? irm.rapport.conclusion.slice(0, 50) + (irm.rapport.conclusion.length > 50 ? '…' : '')
                          : irm.sequence_type || '—'}
                      </div>
                    </div>
                    {estEnvoye ? (
                      <span className="badge badge-emerald">
                        <Send size={10} /> Envoyé
                      </span>
                    ) : (
                      <span className="badge badge-amber">En attente d'envoi</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Actions rapides ── */}
      <div style={{ marginTop: '20px', background: '#fff', borderRadius: '16px', border: '1px solid #eef0f4', padding: '20px 24px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Actions rapides</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Nouvelle analyse IRM', icon: Brain, to: '/irm', color: '#4f46e5' },
            { label: 'Mes rapports', icon: FileText, to: '/rapports', color: '#7c3aed' },
            { label: 'Médecins contractés', icon: UserCheck, to: null, color: '#059669', info: `${nbContrats} liaison${nbContrats > 1 ? 's' : ''}` },
          ].map(({ label, icon: Icon, to, color, info }) => (
            <button
              key={label}
              onClick={() => to && navigate(to)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 18px', borderRadius: '12px',
                border: `1px solid ${color}20`, background: `${color}08`,
                cursor: to ? 'pointer' : 'default',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => to && (e.currentTarget.style.background = `${color}14`)}
              onMouseLeave={e => to && (e.currentTarget.style.background = `${color}08`)}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1d26' }}>{label}</div>
                {info && <div style={{ fontSize: '11px', color: '#9ca3b0', marginTop: '1px' }}>{info}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
