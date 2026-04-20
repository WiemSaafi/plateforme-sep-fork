import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Settings, User, Shield, Bell, Database, Globe, Palette, Activity,
  Save, Eye, EyeOff, CheckCircle, AlertTriangle, Server, Mail, Lock, RefreshCw
} from 'lucide-react'

const sectionStyle = {
  background: '#fff',
  borderRadius: '14px',
  border: '1px solid #eef0f4',
  padding: '28px',
  marginBottom: '20px',
  transition: 'all 0.2s',
}

const sectionTitleStyle = {
  display: 'flex', alignItems: 'center', gap: '10px',
  fontSize: '16px', fontWeight: 600, color: '#1a1d26',
  marginBottom: '20px', paddingBottom: '14px',
  borderBottom: '1px solid #f1f3f5',
}

const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: 500,
  color: '#5a6070', marginBottom: '6px',
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid #dfe2e8', background: '#fff', color: '#1a1d26',
  fontSize: '14px', fontFamily: 'inherit', outline: 'none',
  transition: 'all 0.2s',
}

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '10px 22px', borderRadius: '10px', border: 'none',
  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
  color: '#fff', fontSize: '14px', fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.2s',
  boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
  fontFamily: 'inherit',
}

const btnGhost = {
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '10px 22px', borderRadius: '10px',
  border: '1px solid #e2e5eb', background: '#fff',
  color: '#5a6070', fontSize: '14px', fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.2s',
  fontFamily: 'inherit',
}

const toggleContainer = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 0', borderBottom: '1px solid #f4f5f7',
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none',
        background: checked ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#d1d5db',
        cursor: 'pointer', position: 'relative', transition: 'background 0.25s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px',
        left: checked ? '22px' : '2px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.25s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}

export default function AdminParametres() {
  const { user, login } = useAuth()
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profil')

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // Profile state
  const [profil, setProfil] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
  })

  // Password state
  const [passwords, setPasswords] = useState({
    current: '', nouveau: '', confirm: '',
  })

  // Notification settings (in-app bell icon)
  const [notifs, setNotifs] = useState({
    notif_new_user: true,
    notif_irm_done: true,
    notif_analyse_done: false,
    notif_visite: true,
    notif_validation: true,
  })

  // System settings
  const [systeme, setSysteme] = useState({
    maintenance_mode: false,
    auto_validate_users: false,
    session_timeout: '60',
    max_upload_size: '100',
    default_language: 'fr',
  })

  const tabs = [
    { key: 'profil', label: 'Profil', icon: User },
    { key: 'securite', label: 'Sécurité', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'systeme', label: 'Système', icon: Server },
  ]

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 4000)
  }

  // ─── Load data from API on mount / tab change ───────────────────
  useEffect(() => {
    const load = async () => {
      try {
        if (activeTab === 'profil') {
          const res = await fetch('/api/settings/profil', { headers })
          if (res.ok) {
            const data = await res.json()
            setProfil({ nom: data.nom, prenom: data.prenom, email: data.email })
          }
        }
        if (activeTab === 'notifications') {
          const res = await fetch('/api/settings/notifications', { headers })
          if (res.ok) setNotifs(await res.json())
        }
        if (activeTab === 'systeme') {
          const res = await fetch('/api/settings/systeme', { headers })
          if (res.ok) setSysteme(await res.json())
        }
      } catch { /* silent */ }
    }
    load()
  }, [activeTab])

  // ─── Save profile ───────────────────────────────────────────────
  const saveProfil = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/profil', {
        method: 'PUT', headers, body: JSON.stringify(profil),
      })
      const data = await res.json()
      if (res.ok) {
        // Update localStorage so the sidebar/topbar reflect the new name
        localStorage.setItem('user', JSON.stringify(data.user))
        showMsg('Profil mis à jour avec succès')
        // Reload page to reflect changes everywhere
        setTimeout(() => window.location.reload(), 800)
      } else {
        showMsg(data.detail || 'Erreur lors de la mise à jour', 'error')
      }
    } catch { showMsg('Erreur réseau', 'error') }
    setLoading(false)
  }

  // ─── Save password ──────────────────────────────────────────────
  const savePassword = async () => {
    if (passwords.nouveau !== passwords.confirm) {
      showMsg('Les mots de passe ne correspondent pas', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT', headers,
        body: JSON.stringify({ current: passwords.current, nouveau: passwords.nouveau }),
      })
      const data = await res.json()
      if (res.ok) {
        showMsg('Mot de passe modifié avec succès')
        setPasswords({ current: '', nouveau: '', confirm: '' })
      } else {
        showMsg(data.detail || 'Erreur', 'error')
      }
    } catch { showMsg('Erreur réseau', 'error') }
    setLoading(false)
  }

  // ─── Save notifications ─────────────────────────────────────────
  const saveNotifs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT', headers, body: JSON.stringify(notifs),
      })
      if (res.ok) showMsg('Préférences de notification sauvegardées')
      else showMsg('Erreur', 'error')
    } catch { showMsg('Erreur réseau', 'error') }
    setLoading(false)
  }

  // ─── Save system settings ──────────────────────────────────────
  const saveSysteme = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/systeme', {
        method: 'PUT', headers, body: JSON.stringify(systeme),
      })
      if (res.ok) showMsg('Paramètres système sauvegardés')
      else showMsg('Erreur', 'error')
    } catch { showMsg('Erreur réseau', 'error') }
    setLoading(false)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1d26', margin: 0 }}>
              Paramètres
            </h1>
            <p style={{ color: '#9ca3b0', fontSize: '14px', margin: 0 }}>
              Configuration générale de la plateforme
            </p>
          </div>
        </div>
      </div>

      {/* Feedback message */}
      {message.text && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 18px', borderRadius: '10px', marginBottom: '20px',
          background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: message.type === 'error' ? '#991b1b' : '#166534',
          animation: 'slideUp 0.3s ease-out',
        }}>
          {message.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span style={{ fontWeight: 500, fontSize: '14px' }}>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0', marginBottom: '24px',
        background: '#f1f5f9', borderRadius: '12px', padding: '4px',
      }}>
        {tabs.map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '10px 16px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontWeight: isActive ? 600 : 500, fontSize: '13px',
              background: isActive ? '#fff' : 'transparent',
              color: isActive ? '#4f46e5' : '#64748b',
              boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}>
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ═══ TAB: Profil ═══ */}
      {activeTab === 'profil' && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <User size={20} color="#4f46e5" />
            Informations personnelles
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
            <div>
              <label style={labelStyle}>Prénom</label>
              <input
                style={inputStyle}
                value={profil.prenom}
                onChange={e => setProfil({ ...profil, prenom: e.target.value })}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#dfe2e8'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input
                style={inputStyle}
                value={profil.nom}
                onChange={e => setProfil({ ...profil, nom: e.target.value })}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#dfe2e8'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Adresse e-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3b0' }} />
              <input
                style={{ ...inputStyle, paddingLeft: '40px' }}
                value={profil.email}
                onChange={e => setProfil({ ...profil, email: e.target.value })}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#dfe2e8'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Rôle</label>
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: '#f8f9fc', border: '1px solid #eef0f4',
              fontSize: '14px', color: '#5a6070', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Shield size={14} color="#4f46e5" />
              <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{user?.role || 'admin'}</span>
              <span style={{
                marginLeft: 'auto', fontSize: '11px', fontWeight: 600,
                padding: '2px 8px', borderRadius: '6px',
                background: '#eef2ff', color: '#4f46e5',
              }}>Non modifiable</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px' }}>
            <button style={btnGhost} onClick={() => setProfil({ nom: user?.nom || '', prenom: user?.prenom || '', email: user?.email || '' })}>
              <RefreshCw size={15} /> Réinitialiser
            </button>
            <button style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={saveProfil} disabled={loading}>
              <Save size={15} /> {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ TAB: Sécurité ═══ */}
      {activeTab === 'securite' && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <Lock size={20} color="#4f46e5" />
            Changer le mot de passe
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Mot de passe actuel</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={inputStyle}
                placeholder="••••••••"
                value={passwords.current}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#dfe2e8'; e.target.style.boxShadow = 'none' }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3b0', padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
            <div>
              <label style={labelStyle}>Nouveau mot de passe</label>
              <input
                type="password"
                style={inputStyle}
                placeholder="Min. 8 caractères"
                value={passwords.nouveau}
                onChange={e => setPasswords({ ...passwords, nouveau: e.target.value })}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#dfe2e8'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <input
                type="password"
                style={inputStyle}
                placeholder="Retapez le mot de passe"
                value={passwords.confirm}
                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#dfe2e8'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {passwords.nouveau && passwords.confirm && passwords.nouveau !== passwords.confirm && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '8px',
              background: '#fef2f2', color: '#991b1b', fontSize: '13px', marginBottom: '18px',
            }}>
              <AlertTriangle size={15} />
              Les mots de passe ne correspondent pas
            </div>
          )}

          <div style={{
            padding: '16px', borderRadius: '10px', background: '#f8f9fc',
            border: '1px solid #eef0f4', marginBottom: '18px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#5a6070', marginBottom: '8px' }}>
              Exigences du mot de passe :
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Minimum 8 caractères', ok: passwords.nouveau.length >= 8 },
                { label: 'Au moins une majuscule', ok: /[A-Z]/.test(passwords.nouveau) },
                { label: 'Au moins un chiffre', ok: /[0-9]/.test(passwords.nouveau) },
                { label: 'Au moins un caractère spécial', ok: /[^a-zA-Z0-9]/.test(passwords.nouveau) },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: r.ok ? '#059669' : '#9ca3b0' }}>
                  <CheckCircle size={13} />
                  {r.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
            <button style={btnGhost} onClick={() => setPasswords({ current: '', nouveau: '', confirm: '' })}>
              Annuler
            </button>
            <button
              style={{
                ...btnPrimary,
                opacity: (passwords.current && passwords.nouveau && passwords.nouveau === passwords.confirm) ? 1 : 0.5,
                pointerEvents: (passwords.current && passwords.nouveau && passwords.nouveau === passwords.confirm) ? 'auto' : 'none',
              }}
              onClick={savePassword}
            >
              <Lock size={15} /> {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ TAB: Notifications ═══ */}
      {activeTab === 'notifications' && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <Bell size={20} color="#4f46e5" />
            Préférences de notification
          </div>

          <div style={{ fontSize: '13px', color: '#9ca3b0', marginBottom: '18px' }}>
            Choisissez les notifications à afficher dans l'icône <Bell size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> de la barre supérieure.
          </div>

          {[
            { key: 'notif_new_user', label: 'Nouvel utilisateur inscrit', desc: 'Alerte quand un nouveau compte est créé', icon: User },
            { key: 'notif_irm_done', label: 'Rapport IRM terminé', desc: 'Alerte quand un rapport IRM est finalisé', icon: Database },
            { key: 'notif_analyse_done', label: 'Analyse biologique terminée', desc: 'Alerte quand une analyse est complétée', icon: Globe },
            { key: 'notif_visite', label: 'Nouvelle visite clinique', desc: 'Alerte quand une visite est enregistrée', icon: Activity },
            { key: 'notif_validation', label: 'Compte en attente de validation', desc: 'Alerte quand un compte nécessite une approbation', icon: Shield },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.key} style={toggleContainer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color="#5a6070" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1d26' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3b0' }}>{item.desc}</div>
                  </div>
                </div>
                <Toggle
                  checked={notifs[item.key]}
                  onChange={v => setNotifs({ ...notifs, [item.key]: v })}
                />
              </div>
            )
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px' }}>
            <button style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={saveNotifs} disabled={loading}>
              <Save size={15} /> {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ TAB: Système ═══ */}
      {activeTab === 'systeme' && (
        <>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <Server size={20} color="#4f46e5" />
              Configuration système
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Timeout de session (minutes)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={systeme.session_timeout}
                  onChange={e => setSysteme({ ...systeme, session_timeout: e.target.value })}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#dfe2e8'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Taille max upload (Mo)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={systeme.max_upload_size}
                  onChange={e => setSysteme({ ...systeme, max_upload_size: e.target.value })}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#dfe2e8'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Langue par défaut</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239ca3b0' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px',
                }}
                value={systeme.default_language}
                onChange={e => setSysteme({ ...systeme, default_language: e.target.value })}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <Shield size={20} color="#d97706" />
              Options avancées
            </div>

            <div style={toggleContainer}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1d26' }}>Mode maintenance</div>
                <div style={{ fontSize: '12px', color: '#9ca3b0' }}>Désactive l'accès public à la plateforme</div>
              </div>
              <Toggle
                checked={systeme.maintenance_mode}
                onChange={v => setSysteme({ ...systeme, maintenance_mode: v })}
              />
            </div>

            {systeme.maintenance_mode && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: '8px', marginTop: '12px',
                background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', fontSize: '13px',
              }}>
                <AlertTriangle size={15} />
                Le mode maintenance empêchera tous les utilisateurs (sauf admin) d'accéder à la plateforme.
              </div>
            )}

            <div style={{ ...toggleContainer, borderBottom: 'none' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1d26' }}>Validation automatique</div>
                <div style={{ fontSize: '12px', color: '#9ca3b0' }}>Activer les comptes sans validation manuelle</div>
              </div>
              <Toggle
                checked={systeme.auto_validate_users}
                onChange={v => setSysteme({ ...systeme, auto_validate_users: v })}
              />
            </div>
          </div>

          {/* Info card */}
          <div style={{
            ...sectionStyle,
            background: '#f8f9fc', border: '1px solid #eef0f4',
          }}>
            <div style={sectionTitleStyle}>
              <Database size={20} color="#0891b2" />
              Informations système
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Version', value: 'v1.0.0' },
                { label: 'Backend', value: 'FastAPI 0.111' },
                { label: 'Base de données', value: 'MongoDB Atlas' },
                { label: 'Frontend', value: 'React 19 + Vite' },
                { label: 'Environnement', value: 'Développement' },
                { label: 'Dernière MAJ', value: new Date().toLocaleDateString('fr-FR') },
              ].map((info, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: '10px', background: '#fff',
                  border: '1px solid #eef0f4',
                }}>
                  <div style={{ fontSize: '11px', color: '#9ca3b0', fontWeight: 500, marginBottom: '4px' }}>
                    {info.label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1d26' }}>
                    {info.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={saveSysteme} disabled={loading}>
              <Save size={15} /> {loading ? 'Enregistrement...' : 'Enregistrer tout'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
