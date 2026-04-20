import { useState, useRef, useEffect } from 'react'
import { Bell, Search, Check, User, Brain, FlaskConical, Activity, Clock, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/visites': 'Visites cliniques',
  '/irm': 'IRM & Imagerie',
  '/agenda': 'Agenda',
  '/chat': 'Assistant IA',
  '/analyses': 'Analyses biologiques',
  '/resultats': 'Résultats',
  '/rapports': 'Mes rapports',
  '/admin/utilisateurs': 'Gestion utilisateurs',
  '/admin/validations': 'Validations',
  '/admin/settings': 'Paramètres',
}

const TYPE_CONFIG = {
  user:        { icon: User, color: '#4f46e5' },
  irm:         { icon: Brain, color: '#0891b2' },
  irm_pending: { icon: Brain, color: '#d97706' },
  analyse:     { icon: FlaskConical, color: '#059669' },
  visite:      { icon: Activity, color: '#d97706' },
}

export default function Topbar() {
  const { user } = useAuth()
  const location = useLocation()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_read') || '[]') } catch { return [] }
  })
  const panelRef = useRef(null)

  // Fetch real notifications from API
  const fetchNotifs = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.map(n => ({
          ...n,
          read: n.read || readIds.includes(n.id),
        })))
      }
    } catch (err) {
      console.error('Notifications fetch error:', err)
    }
  }

  // Fetch on mount + every 30s
  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  // Sync read state when readIds change
  useEffect(() => {
    localStorage.setItem('notif_read', JSON.stringify(readIds))
    setNotifications(prev => prev.map(n => ({
      ...n,
      read: n.read || readIds.includes(n.id),
    })))
  }, [readIds])

  const unreadCount = notifications.filter(n => !n.read).length

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    if (showNotifs) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showNotifs])

  const markAsRead = (id) => {
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const markAllRead = () => {
    setReadIds(prev => [...new Set([...prev, ...notifications.map(n => n.id)])])
  }

  const removeNotif = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const getTitle = () => {
    if (location.pathname.startsWith('/patients/')) return 'Détail patient'
    if (location.pathname.startsWith('/rapports/')) return 'Rapport IRM'
    return PAGE_TITLES[location.pathname] || 'Neuro Predict MS'
  }

  return (
    <header style={{
      height: '64px',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #eef0f4',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      {/* Left — Title */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1d26', margin: 0, letterSpacing: '-0.01em' }}>
          {getTitle()}
        </h2>
      </div>

      {/* Right — Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 14px', borderRadius: '10px',
          background: '#f4f5f7',
          border: '1px solid #eef0f4',
          color: '#9ca3b0', fontSize: '13px', cursor: 'pointer',
          transition: 'all 0.2s',
          minWidth: '200px',
        }}>
          <Search size={14} />
          <span>Rechercher...</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '11px', color: '#b8bdc7',
            padding: '2px 6px', borderRadius: '4px',
            background: '#eef0f4',
          }}>⌘K</span>
        </div>

        {/* Notifications */}
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            style={{
              position: 'relative',
              width: '36px', height: '36px', borderRadius: '10px',
              background: showNotifs ? '#eef2ff' : '#f4f5f7',
              border: `1px solid ${showNotifs ? '#c7d2fe' : '#eef0f4'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              color: showNotifs ? '#4f46e5' : '#9ca3b0',
            }}
            onMouseEnter={e => { if (!showNotifs) { e.currentTarget.style.borderColor = '#c9cdd5'; e.currentTarget.style.color = '#5a6070' } }}
            onMouseLeave={e => { if (!showNotifs) { e.currentTarget.style.borderColor = '#eef0f4'; e.currentTarget.style.color = '#9ca3b0' } }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '5px', right: '5px',
                minWidth: '16px', height: '16px', borderRadius: '8px',
                background: '#ef4444', border: '2px solid #fff',
                fontSize: '9px', fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {showNotifs && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '380px', maxHeight: '480px',
              background: '#fff', borderRadius: '14px',
              border: '1px solid #eef0f4',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)',
              overflow: 'hidden', zIndex: 100,
              animation: 'slideUp 0.2s ease-out',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid #f1f3f5',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1d26' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                      borderRadius: '10px', background: '#eef2ff', color: '#4f46e5',
                    }}>
                      {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 500, color: '#4f46e5',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontFamily: 'inherit', padding: '4px 8px', borderRadius: '6px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Check size={13} /> Tout marquer lu
                  </button>
                )}
              </div>

              {/* Notifications list */}
              <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
                {notifications.length === 0 ? (
                  <div style={{
                    padding: '40px 20px', textAlign: 'center',
                  }}>
                    <Bell size={32} color="#d1d5db" style={{ margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ color: '#9ca3b0', fontSize: '14px', margin: 0 }}>Aucune notification</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const cfg = TYPE_CONFIG[n.type] || { icon: Bell, color: '#9ca3b0' }
                    const Icon = cfg.icon
                    const color = cfg.color
                    return (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '12px',
                          padding: '14px 20px',
                          background: n.read ? 'transparent' : '#fafbff',
                          borderBottom: '1px solid #f4f5f7',
                          cursor: 'pointer', transition: 'background 0.15s',
                          position: 'relative',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8f9fc'}
                        onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : '#fafbff'}
                      >
                        {/* Unread dot */}
                        {!n.read && (
                          <div style={{
                            position: 'absolute', left: '8px', top: '22px',
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: '#4f46e5',
                          }} />
                        )}

                        {/* Icon */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: `${color}12`, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={16} color={color} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px', fontWeight: n.read ? 500 : 600,
                            color: '#1a1d26', marginBottom: '2px',
                          }}>
                            {n.title}
                          </div>
                          <div style={{
                            fontSize: '12px', color: '#9ca3b0',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: '11px', color: '#b8bdc7', marginTop: '4px' }}>
                            {n.time}
                          </div>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNotif(n.id) }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#d1d5db', padding: '2px', borderRadius: '4px',
                            transition: 'all 0.15s', flexShrink: 0, marginTop: '2px',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#fff',
          }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1d26', margin: 0 }}>
              {user?.prenom} {user?.nom}
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3b0', margin: 0, textTransform: 'capitalize' }}>
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}