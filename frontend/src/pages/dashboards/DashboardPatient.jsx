import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Activity, Brain, FileText, Newspaper, TrendingUp, TrendingDown, Minus, Clock, ArrowRight, Heart, Shield, Globe, Link2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { patientPortalService } from '../../services/patientPortalService'
import axios from 'axios'

export default function DashboardPatient() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dossier, setDossier] = useState(null)
  const [evolution, setEvolution] = useState(null)
  const [actualites, setActualites] = useState([])
  const [newsData, setNewsData] = useState({ organisations: [], ticker: [] })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [dRes, eRes, aRes, newsRes] = await Promise.all([
        patientPortalService.getMonDossier(),
        patientPortalService.getMonEvolution(),
        patientPortalService.getActualites(),
        axios.get('http://127.0.0.1:8000/api/news').catch(() => ({ data: { organisations: [], ticker: [] } }))
      ])
      setDossier(dRes.data)
      setEvolution(eRes.data)
      setActualites(aRes.data.data?.slice(0, 3) || [])
      setNewsData(newsRes.data || { organisations: [], ticker: [] })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const tendanceConfig = {
    progression: { icon: TrendingUp, color: '#dc2626', bg: '#fef2f2', label: 'En progression', border: '#fecaca' },
    amelioration: { icon: TrendingDown, color: '#059669', bg: '#ecfdf5', label: 'En amélioration', border: '#a7f3d0' },
    stable: { icon: Minus, color: '#2563eb', bg: '#eff6ff', label: 'Stable', border: '#93c5fd' },
  }

  const categorieColors = {
    'Traitements': { bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' },
    'Recherche': { bg: '#f0fdf4', color: '#059669', border: '#a7f3d0' },
    'Vie quotidienne': { bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
    'Témoignages': { bg: '#fdf2f8', color: '#db2777', border: '#f9a8d4' },
  }

  const cards = [
    {
      label: 'Mon dossier', value: dossier ? `${dossier.patient?.prenom} ${dossier.patient?.nom}` : '—',
      subtitle: 'Informations personnelles',
      icon: User, color: '#4f46e5', gradient: 'stat-gradient-blue',
      onClick: () => navigate('/mon-dossier'),
    },
    {
      label: 'Visites cliniques', value: dossier?.resume?.total_visites ?? '—',
      subtitle: 'Consultations enregistrées',
      icon: Activity, color: '#059669', gradient: 'stat-gradient-emerald',
      onClick: () => navigate('/mon-evolution'),
    },
    {
      label: 'IRM', value: dossier?.resume?.total_irm ?? '—',
      subtitle: 'Imageries réalisées',
      icon: Brain, color: '#7c3aed', gradient: 'stat-gradient-violet',
      onClick: () => navigate('/mes-rapports'),
    },
    {
      label: 'Dernier EDSS', value: dossier?.resume?.dernier_edss ?? '—',
      subtitle: 'Score de handicap',
      icon: Shield, color: '#d97706', gradient: 'stat-gradient-amber',
      onClick: () => navigate('/mon-evolution'),
    },
  ]

  return (
    <div className="animate-fadeIn" style={{ color: '#1a1d26' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1d26', margin: 0, letterSpacing: '-0.02em' }}>
            Bonjour, {user?.prenom} 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
            Bienvenue sur votre espace patient — suivez l'évolution de votre santé
          </p>
        </div>
        {evolution && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '10px',
            background: tendanceConfig[evolution.tendance]?.bg,
            border: `1px solid ${tendanceConfig[evolution.tendance]?.border}`,
          }}>
            {(() => {
              const Icon = tendanceConfig[evolution.tendance]?.icon || Minus
              return <Icon size={14} color={tendanceConfig[evolution.tendance]?.color} />
            })()}
            <span style={{
              fontSize: '12px', fontWeight: 600,
              color: tendanceConfig[evolution.tendance]?.color
            }}>
              {tendanceConfig[evolution.tendance]?.label}
            </span>
          </div>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {cards.map(({ label, value, subtitle, icon: Icon, color, gradient, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={gradient}
            style={{
              borderRadius: '16px', padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 8px 24px ${color}18`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{label}</span>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${color}12`, border: `1px solid ${color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color={color} />
              </div>
            </div>
            <div style={{ fontSize: typeof value === 'number' || (typeof value === 'string' && value.length <= 3) ? '36px' : '16px', fontWeight: 700, color: '#1a1d26', letterSpacing: '-0.02em' }}>
              {loading ? <span style={{ fontSize: '20px', color: '#9ca3b0' }}>…</span> : value}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              marginTop: '8px', fontSize: '12px', color: '#9ca3b0', fontWeight: 500,
            }}>
              {subtitle}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              marginTop: '8px', fontSize: '12px', color: '#9ca3b0', fontWeight: 500,
              transition: 'color 0.2s',
            }}>
              Voir détails <ArrowRight size={12} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Section: Evolution + Actualités ────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Mini Evolution */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '1px solid #eef0f4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #eef0f4',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#eef2ff', border: '1px solid #c7d2fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={18} color="#4f46e5" />
              </div>
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#1a1d26' }}>Évolution EDSS</span>
            </div>
            <button
              onClick={() => navigate('/mon-evolution')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '12px', color: '#4f46e5', fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3b0', fontSize: '13px' }}>Chargement…</div>
            ) : evolution?.evolution_edss?.length > 0 ? (
              <div>
                {/* Mini bar chart */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', marginBottom: '12px' }}>
                  {evolution.evolution_edss.slice(-8).map((point, i) => {
                    const maxScore = 10
                    const height = Math.max(8, (point.score / maxScore) * 110)
                    const barColor = point.score <= 3 ? '#059669' : point.score <= 6 ? '#d97706' : '#dc2626'
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: barColor }}>{point.score}</span>
                        <div style={{
                          width: '100%', height: `${height}px`, borderRadius: '6px 6px 2px 2px',
                          background: `linear-gradient(180deg, ${barColor}, ${barColor}90)`,
                          transition: 'height 0.5s ease-out',
                        }} />
                        <span style={{ fontSize: '9px', color: '#9ca3b0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                          {new Date(point.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Heart size={24} color="#c4b5fd" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#9ca3b0', fontSize: '13px' }}>Pas encore de données EDSS</p>
              </div>
            )}
          </div>
        </div>

        {/* Organisations & Ressources */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '1px solid #eef0f4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #eef0f4',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#eef2ff', border: '1px solid #c7d2fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Globe size={18} color="#4f46e5" />
              </div>
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#1a1d26' }}>Organisations SEP</span>
            </div>
            <a
              href="/"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '12px', color: '#4f46e5', fontWeight: 600, fontFamily: 'inherit',
                textDecoration: 'none',
              }}
            >
              Voir plus <ArrowRight size={12} />
            </a>
          </div>

          <div style={{ padding: '16px 24px', maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3b0', fontSize: '13px' }}>Chargement…</div>
            ) : newsData.organisations?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {newsData.organisations.slice(0, 3).map(org => (
                  <div
                    key={org.id}
                    style={{
                      background: '#f8f9fc', borderRadius: '12px',
                      border: '1px solid #eef0f4',
                      overflow: 'hidden', transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)' 
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none' 
                    }}
                  >
                    <div style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3, flex: 1 }}>
                          {org.name}
                        </h4>
                        <div style={{
                          padding: '3px 8px', borderRadius: '6px',
                          background: org.badge_color, color: '#fff',
                          fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em',
                          flexShrink: 0, marginLeft: '8px',
                        }}>
                          {org.badge}
                        </div>
                      </div>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: org.subtitle_color, margin: '0 0 8px' }}>
                        {org.subtitle}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: '0 0 12px', 
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                      }}>
                        {org.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                          <Link2 size={11} />
                          {org.domain}
                        </span>
                        <a
                          href={org.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '5px 12px', borderRadius: '6px',
                            border: '1px solid #4f46e5', background: 'transparent',
                            color: '#4f46e5', fontSize: '11px', fontWeight: 600,
                            textDecoration: 'none', transition: 'all 0.2s',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { 
                            e.currentTarget.style.background = '#4f46e5'
                            e.currentTarget.style.color = '#fff' 
                          }}
                          onMouseLeave={e => { 
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#4f46e5' 
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          Visiter <ArrowRight size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Globe size={24} color="#c4b5fd" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#9ca3b0', fontSize: '13px' }}>Aucune organisation disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
