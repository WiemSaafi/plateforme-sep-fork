import { Link } from 'react-router-dom'

/**
 * Neuro Predict MS — Logo component
 * Variants: 'full' (default), 'compact' (no subtitle), 'white' (for dark backgrounds)
 */
export default function Logo({ size = 'md', variant = 'full', linkTo = '/', white = false }) {
  const sizes = {
    sm: { img: 30, title: 14, sub: 8, gap: 8 },
    md: { img: 38, title: 17, sub: 9, gap: 10 },
    lg: { img: 50, title: 24, sub: 11, gap: 12 },
  }
  const s = sizes[size] || sizes.md

  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${s.gap}px`, textDecoration: 'none' }}>
      <img
        src="/logo-sep.png"
        alt="Neuro Predict MS"
        style={{ width: `${s.img}px`, height: `${s.img}px`, objectFit: 'contain', flexShrink: 0 }}
      />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: `${s.title}px`, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: white ? '#e2e8f0' : '#1e293b' }}>Neuro </span>
          <span style={{ color: '#4f46e5' }}>Predict MS</span>
        </div>
        {variant === 'full' && (
          <div style={{
            fontSize: `${s.sub}px`, fontWeight: 600, letterSpacing: '0.06em',
            color: white ? '#94a3b8' : '#9ca3b0', textTransform: 'uppercase', marginTop: '2px',
          }}>
            IA MÉDICALE AVANCÉE
          </div>
        )}
      </div>
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        {content}
      </Link>
    )
  }
  return content
}
