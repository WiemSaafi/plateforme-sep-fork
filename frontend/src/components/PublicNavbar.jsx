import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogIn, UserPlus, Menu, X } from 'lucide-react'
import Logo from './Logo'

export default function PublicNavbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/#stats', label: 'Statistiques', hash: true },
    { to: '/#news', label: 'Actualités', hash: true },
    { to: '/#about', label: 'À propos', hash: true },
  ]

  const handleHashClick = (e, hash) => {
    if (location.pathname === '/') {
      e.preventDefault()
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      setMobileOpen(false)
    }
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      height: '68px',
      background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderBottom: scrolled ? '1px solid #eef0f4' : '1px solid transparent',
      transition: 'all 0.3s',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        {/* Logo */}
        <Logo size="md" variant="full" linkTo="/" />

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {navLinks.map(link => (
            <Link
              key={link.label}
              to={link.to}
              onClick={link.hash ? (e) => handleHashClick(e, link.to.replace('/', '')) : undefined}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                fontSize: '14px', fontWeight: 500, color: '#5a6070',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1a1d26' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5a6070' }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px',
            border: '1px solid #e2e5eb', background: '#fff',
            color: '#5a6070', fontSize: '13px', fontWeight: 500,
            textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.color = '#4f46e5' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5eb'; e.currentTarget.style.color = '#5a6070' }}
          >
            <LogIn size={15} /> Se connecter
          </Link>
          <Link to="/inscription" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff', fontSize: '13px', fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(79,70,229,0.35)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(79,70,229,0.25)'}
          >
            <UserPlus size={15} /> S'inscrire
          </Link>
        </div>
      </div>
    </nav>
  )
}
