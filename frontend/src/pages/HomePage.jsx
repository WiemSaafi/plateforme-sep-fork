import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '../components/PublicNavbar'
import {
  Brain, Activity, Users, Globe, Calendar, TrendingUp, BarChart3,
  ArrowRight, ExternalLink, Sparkles, Shield, Heart, BookOpen,
  ChevronRight, Star, Microscope, Pill, Dna, Link2
} from 'lucide-react'
import Logo from '../components/Logo'

const ICON_MAP = {
  globe: Globe, users: Users, calendar: Calendar,
  map: Globe, 'bar-chart': BarChart3, 'trending-up': TrendingUp,
}

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [newsData, setNewsData] = useState({ ticker: [], organisations: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, newsRes] = await Promise.all([
          fetch('/api/public/sep-stats'),
          fetch('/api/public/sep-news'),
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (newsRes.ok) setNewsData(await newsRes.json())
      } catch (err) {
        console.error('Failed to load homepage data:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#fafbfe' }}>
      <PublicNavbar />

      {/* ════════════════════ HERO ════════════════════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: '68px',
        background: 'linear-gradient(160deg, #f8f9fc 0%, #eef2ff 30%, #f0f9ff 60%, #faf5ff 100%)',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)', top: '-10%', right: '-5%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)', bottom: '5%', left: '-5%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)', top: '40%', left: '30%', filter: 'blur(40px)' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px', display: 'flex', alignItems: 'center', gap: '80px', position: 'relative', zIndex: 1 }}>
          {/* Left text */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '20px', marginBottom: '24px',
              background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.12)',
            }}>
              <Sparkles size={14} color="#4f46e5" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
                Neuro Predict MS — IA Médicale Avancée
              </span>
            </div>

            <h1 style={{
              fontSize: '52px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em',
              color: '#0f172a', margin: '0 0 20px',
            }}>
              Comprendre la{' '}
              <span style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #0891b2)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Sclérose en Plaques
              </span>
            </h1>

            <p style={{
              fontSize: '18px', lineHeight: 1.7, color: '#475569', margin: '0 0 36px',
              maxWidth: '540px',
            }}>
              Accédez aux dernières actualités, statistiques mondiales et avancées de la recherche.
              Notre plateforme utilise l'intelligence artificielle pour améliorer le diagnostic et le suivi de la SEP.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <a href="#stats" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', fontSize: '15px', fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.3s',
                boxShadow: '0 4px 16px rgba(79,70,229,0.3)',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Explorer les chiffres <ArrowRight size={16} />
              </a>
              <a href="#news" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', borderRadius: '12px',
                border: '1px solid #e2e5eb', background: '#fff',
                color: '#374151', fontSize: '15px', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5eb'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <BookOpen size={16} /> Lire les actualités
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '48px' }}>
              {[
                { value: '2,8M', label: 'Patients dans le monde' },
                { value: '99.3%', label: 'Précision IA' },
                { value: '200+', label: 'Pays concernés' },
              ].map((b, i) => (
                <div key={i}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1d26' }}>{b.value}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3b0' }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual */}
          <div style={{ flex: '0 0 420px', position: 'relative' }}>
            <div style={{ position: 'relative', width: '380px', height: '380px', margin: '0 auto' }}>
              {/* Center brain */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '110px', height: '110px', borderRadius: '28px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 40px rgba(79,70,229,0.35)',
              }}>
                <Brain size={50} color="#fff" />
              </div>
              {/* Orbit ring */}
              <div style={{ position: 'absolute', inset: '25px', border: '1.5px dashed rgba(79,70,229,0.12)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: '60px', border: '1px dashed rgba(79,70,229,0.08)', borderRadius: '50%' }} />
              {/* Orbiting icons */}
              {[
                { icon: Shield, delay: '0s', color: '#0891b2', bg: '#e0f7fa' },
                { icon: Activity, delay: '-3.5s', color: '#059669', bg: '#ecfdf5' },
                { icon: Microscope, delay: '-7s', color: '#d97706', bg: '#fffbeb' },
                { icon: Dna, delay: '-10.5s', color: '#e11d48', bg: '#fff1f2' },
              ].map(({ icon: Icon, delay, color, bg }, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 0, height: 0,
                  animation: 'orbit 14s linear infinite',
                  animationDelay: delay,
                }}>
                  <div style={{
                    position: 'absolute', transform: 'translate(-50%, -50%)',
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: bg, border: `1.5px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px ${color}15`,
                  }}>
                    <Icon size={22} color={color} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          animation: 'float 3s ease-in-out infinite',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3b0', letterSpacing: '0.05em' }}>DÉFILER</span>
          <div style={{ width: '20px', height: '32px', borderRadius: '10px', border: '2px solid #d1d5db', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)',
              width: '4px', height: '8px', borderRadius: '2px', background: '#9ca3b0',
              animation: 'slideUp 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ════════════════════ KEY STATS ════════════════════ */}
      <section id="stats" style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '20px', marginBottom: '16px',
              background: '#eef2ff', border: '1px solid #c7d2fe',
            }}>
              <BarChart3 size={14} color="#4f46e5" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>Données mondiales</span>
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              La SEP en chiffres
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
              Statistiques issues de l'Atlas de la SEP (MSIF) et de l'Organisation Mondiale de la Santé
            </p>
          </div>

          {/* Stats grid */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '80px' }}>
              {stats.key_figures.map((fig, i) => {
                const Icon = ICON_MAP[fig.icon] || Globe
                return (
                  <div key={i} style={{
                    padding: '28px', borderRadius: '16px', background: '#fff',
                    border: '1px solid #f1f3f5', transition: 'all 0.3s',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = `${fig.color}30` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f1f3f5' }}
                  >
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: `${fig.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '16px',
                    }}>
                      <Icon size={22} color={fig.color} />
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                      {fig.value}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>
                      {fig.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {fig.detail}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Types de SEP */}
          {stats && (
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '28px', letterSpacing: '-0.02em' }}>
                Les formes de la maladie
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {stats.types_sep.map((t, i) => {
                  const colors = ['#4f46e5', '#0891b2', '#d97706']
                  return (
                    <div key={i} style={{
                      padding: '24px', borderRadius: '16px', background: '#fff',
                      border: '1px solid #f1f3f5', position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                        background: `linear-gradient(90deg, ${colors[i]}, ${colors[i]}80)`,
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 700, color: colors[i] }}>{t.percent}%</span>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                          borderRadius: '8px', background: `${colors[i]}10`, color: colors[i],
                        }}>des cas</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1d26', marginBottom: '8px' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                        {t.description}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════ ACTUALITÉS & RESSOURCES ════════════════════ */}
      <section id="news" style={{ padding: '100px 24px 60px', background: '#f8f9fc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 18px', borderRadius: '24px', marginBottom: '20px',
              background: '#1e293b', color: '#fff',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em' }}>TN</span>
              <Heart size={14} color="#a78bfa" />
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.03em' }}>SEP EN TUNISIE & DANS LE MONDE</span>
            </div>
            <h2 style={{ fontSize: '40px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
              Actualités &{' '}
              <span style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Ressources
              </span>
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '620px', margin: '0 auto', lineHeight: 1.7 }}>
              Découvrez les organisations tunisiennes et internationales qui se battent contre la Sclérose En Plaques, et suivez les dernières actualités.
            </p>
          </div>

          {/* Scrolling ticker */}
          {newsData.ticker.length > 0 && (
            <div style={{
              margin: '32px 0 48px', overflow: 'hidden', position: 'relative',
              background: '#fff', borderRadius: '14px', border: '1px solid #f1f3f5',
              padding: '14px 0',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(90deg, #fff, transparent)', zIndex: 2 }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(270deg, #fff, transparent)', zIndex: 2 }} />
              <div style={{ display: 'flex', gap: '48px', animation: 'tickerScroll 30s linear infinite', whiteSpace: 'nowrap' }}>
                {[...newsData.ticker, ...newsData.ticker].map((item, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: 500, flexShrink: 0 }}>
                    <span style={{ fontSize: '14px' }}>{['🏥', '💊', '🎗️', '🤖', '📊', '🧬'][i % 6]}</span>
                    {item}
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Globe size={20} color="#4f46e5" />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
              Organisations & Ressources
            </h3>
          </div>

          {/* Organisation cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {(newsData.organisations || []).map(org => (
              <div key={org.id} style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #f1f3f5',
                overflow: 'hidden', transition: 'all 0.3s', display: 'flex', flexDirection: 'column',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Screenshot area */}
                <div style={{ position: 'relative', height: '170px', overflow: 'hidden', background: '#f1f5f9' }}>
                  <img
                    src={org.screenshot}
                    alt={org.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  {/* Status badge */}
                  <div style={{
                    position: 'absolute', top: '12px', left: '12px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '5px 10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                    fontSize: '11px', fontWeight: 600, color: '#059669',
                  }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
                    {org.status}
                  </div>
                  {/* Location badge */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    padding: '5px 10px', borderRadius: '8px',
                    background: org.badge_color, color: '#fff',
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em',
                  }}>
                    {org.badge}
                  </div>
                </div>

                {/* Card content */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.3 }}>
                    {org.name}
                  </h4>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: org.subtitle_color, margin: '0 0 10px' }}>
                    {org.subtitle}
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: '0 0 16px', flex: 1 }}>
                    {org.description}
                  </p>

                  {/* Footer: domain + visit button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                      <Link2 size={12} />
                      {org.domain}
                    </span>
                    <a
                      href={org.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '7px 16px', borderRadius: '8px',
                        border: '1px solid #ef4444', background: 'transparent',
                        color: '#ef4444', fontSize: '12px', fontWeight: 600,
                        textDecoration: 'none', transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444' }}
                    >
                      Visiter <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ TIMELINE ════════════════════ */}
      {stats && (
        <section style={{ padding: '100px 24px', background: '#fff' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                Histoire de la SEP
              </h2>
              <p style={{ fontSize: '16px', color: '#64748b' }}>
                Les grandes étapes dans la compréhension et le traitement
              </p>
            </div>
            <div style={{ position: 'relative', paddingLeft: '40px' }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: '15px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg, #4f46e5, #0891b2, #059669)' }} />
              {stats.timeline.map((item, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '32px', paddingLeft: '24px' }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: '-29px', top: '4px',
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: '#4f46e5', border: '3px solid #eef2ff',
                    boxShadow: '0 0 0 2px #4f46e5',
                  }} />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
                    <span style={{
                      fontSize: '14px', fontWeight: 700, color: '#4f46e5',
                      minWidth: '42px',
                    }}>
                      {item.year}
                    </span>
                    <span style={{ fontSize: '15px', color: '#334155', lineHeight: 1.6 }}>
                      {item.event}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════ ABOUT / AWARENESS ════════════════════ */}
      <section id="about" style={{ padding: '100px 24px', background: 'linear-gradient(160deg, #eef2ff 0%, #f0f9ff 50%, #faf5ff 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Comprendre & Agir
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
              La sclérose en plaques est une maladie neurologique chronique. Voici ce qu'il faut savoir.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '48px' }}>
            {[
              {
                icon: Brain, color: '#4f46e5',
                title: "Qu'est-ce que la SEP ?",
                text: "La sclérose en plaques est une maladie auto-immune qui attaque la gaine de myéline protégeant les fibres nerveuses du cerveau et de la moelle épinière, provoquant des troubles neurologiques variés.",
              },
              {
                icon: Activity, color: '#0891b2',
                title: "Symptômes principaux",
                text: "Fatigue extrême, troubles de la vision, engourdissements, difficultés motrices, problèmes cognitifs et troubles de l'équilibre. Les symptômes varient d'une personne à l'autre.",
              },
              {
                icon: Pill, color: '#059669',
                title: "Traitements disponibles",
                text: "Plus de 20 traitements de fond sont disponibles : immunomodulateurs, anticorps monoclonaux, thérapies orales. L'objectif est de réduire les poussées et ralentir la progression.",
              },
              {
                icon: Heart, color: '#e11d48',
                title: "Vivre avec la SEP",
                text: "Un diagnostic précoce et un suivi régulier permettent de maintenir une bonne qualité de vie. L'activité physique, le soutien psychologique et une alimentation équilibrée sont essentiels.",
              },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <div key={i} style={{
                  padding: '32px', borderRadius: '16px', background: '#fff',
                  border: '1px solid #f1f3f5', transition: 'all 0.3s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: `${card.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <Icon size={22} color={card.color} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 10px' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                    {card.text}
                  </p>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div style={{
            padding: '48px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: '-100px', right: '-50px' }} />
            <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', bottom: '-80px', left: '-30px' }} />
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: '0 0 12px', position: 'relative' }}>
              Rejoignez Neuro Predict MS
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: '0 0 28px', position: 'relative' }}>
              Professionnels de santé, accédez à des outils IA avancés pour le diagnostic et le suivi de vos patients.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', position: 'relative' }}>
              <Link to="/inscription" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', borderRadius: '12px', border: 'none',
                background: '#fff', color: '#4f46e5', fontSize: '15px', fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.3s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Créer un compte <ArrowRight size={16} />
              </Link>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
                color: '#fff', fontSize: '15px', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer style={{ padding: '48px 24px 28px', background: '#0f172a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '32px' }}>
            <div>
              <div style={{ marginBottom: '12px' }}>
                <Logo size="sm" variant="compact" linkTo="/" white />
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '300px', lineHeight: 1.7 }}>
                Plateforme d'intelligence artificielle médicale pour le diagnostic, le suivi et la recherche sur la sclérose en plaques.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '48px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '14px', letterSpacing: '0.04em' }}>PLATEFORME</h4>
                {['Accueil', 'Statistiques', 'Actualités'].map(l => (
                  <a key={l} href="#" style={{ display: 'block', fontSize: '13px', color: '#94a3b8', textDecoration: 'none', marginBottom: '8px' }}>{l}</a>
                ))}
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '14px', letterSpacing: '0.04em' }}>RESSOURCES</h4>
                {[
                  { label: 'Atlas of MS', url: 'https://www.atlasofms.org' },
                  { label: 'MSIF', url: 'https://www.msif.org' },
                  { label: 'OMS', url: 'https://www.who.int' },
                ].map(r => (
                  <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '13px', color: '#94a3b8', textDecoration: 'none', marginBottom: '8px' }}>{r.label}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ height: '1px', background: '#1e293b', marginBottom: '24px' }} />
          
          {/* Neuronova team section */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '20px', marginBottom: '32px',
            padding: '32px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.05) 0%, rgba(124,58,237,0.03) 100%)',
            border: '1px solid rgba(79,70,229,0.08)',
            position: 'relative', overflow: 'hidden',
          }}>
            <img
              src="/nvlogoequipe.png"
              alt="Neuronova"
              style={{ width: '200px', height: '200px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Développé par
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Neuronova
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', letterSpacing: '0.01em' }}>
                Groupe d'innovation en neurologie et intelligence artificielle
              </div>
            </div>
            {/* Subtle accent */}
            <div style={{
              position: 'absolute', right: '-20px', bottom: '-20px',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              © {new Date().getFullYear()} Neuro Predict MS. Données issues de l'Atlas of MS & WHO.
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Fait avec <Heart size={10} style={{ display: 'inline', verticalAlign: 'middle', color: '#ef4444' }} /> par Neuronova
            </p>
          </div>
        </div>
      </footer>

      {/* Keyframes */}
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(150px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
