import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, Layers, Box, ChevronLeft, ChevronRight } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')

export default function ViewerIRM({ patientId, irmId, fichierPath, sequenceType }) {
  const canvasRef = useRef(null)
  const niivueRef = useRef(null)
  const [mode, setMode] = useState('2D')
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [slice, setSlice] = useState(0)
  const [totalSlices, setTotalSlices] = useState(0)
  const [plein, setPlein] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (irmId && patientId) chargerViewer()
    return () => { niivueRef.current = null }
  }, [irmId, mode])

  const chargerViewer = async () => {
    setLoading(true)
    setErreur(null)
    setTotalSlices(0)

    try {
      // 1️⃣ Vérifier que l'IRM existe
      const checkRes = await fetch(
        `${API_BASE}/api/patients/${patientId}/irm/${irmId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!checkRes.ok) {
        setErreur("IRM introuvable")
        setLoading(false)
        return
      }
      const irmData = await checkRes.json()
      if (!irmData.fichier_path && !irmData.fichier_url && !irmData.chemin_fichier) {
        setErreur("Aucun fichier IRM disponible pour cette IRM")
        setLoading(false)
        return
      }

      

      // 3️⃣ Charger Niivue
      const { Niivue } = await import('@niivue/niivue')
      niivueRef.current = null

      const nv = new Niivue({
        show3Dcrosshair: true,
        backColor: [0, 0, 0, 1],
        crosshairColor: [1, 0, 0, 1],
        isColorbar: true,
        isOrientCube: true,
      })
      niivueRef.current = nv
      await nv.attachToCanvas(canvasRef.current)

      // ✅ URL absolue avec token en query param
      const urlFichier = `${API_BASE}/api/patients/${patientId}/irm/${irmId}/fichier?token=${token}`

      await nv.loadVolumes([{
        url: urlFichier,
        name: `${sequenceType || 'IRM'}.nii`,
        colormap: 'gray',
        opacity: 1,
      }])

      // 4️⃣ Auto-fenêtrage
      const vol0 = nv.volumes[0]
      if (vol0?.img) {
        const sorted = Float32Array.from(vol0.img).filter(v => v > 0).sort()
        if (sorted.length > 0) {
          vol0.cal_min = sorted[Math.floor(sorted.length * 0.02)]
          vol0.cal_max = sorted[Math.floor(sorted.length * 0.98)]
          nv.updateGLVolume()
        }
      }

      // 5️⃣ Mode 2D / 3D
      nv.setSliceType(mode === '3D' ? nv.sliceTypeRender : nv.sliceTypeAxial)

      // 6️⃣ Nombre de coupes — cherche dans toutes les dimensions possibles
      const vol = nv.volumes[0]
      if (vol) {
        console.log('vol.dims:', vol.dims, 'vol.hdr:', vol.hdr)
        // dims = [ndim, nx, ny, nz, nt, ...]
        const dims = vol.dims || vol.hdr?.dims || []
        const nx = dims[1] || 0
        const ny = dims[2] || 0
        const nz = dims[3] || 0
        // Prend la plus grande dimension comme nombre de coupes axiales
        const total = nz > 0 ? nz : Math.max(nx, ny)
        console.log('nx:', nx, 'ny:', ny, 'nz:', nz, 'total:', total)
        setTotalSlices(total)
        setSlice(Math.floor(total / 2))
      }

  // ✅ NOUVEAU
nv.onImageLoaded = () => {
  nv.setSliceType(mode === '3D' ? nv.sliceTypeRender : nv.sliceTypeAxial)
  
  const vol = nv.volumes[0]
  if (vol) {
    const dims = vol.dims || vol.hdr?.dims || []
    const nz = dims[3] || 0
    const nx = dims[1] || 0
    const ny = dims[2] || 0
    const total = nz > 0 ? nz : Math.max(nx, ny)
    setTotalSlices(total)
    setSlice(Math.floor(total / 2))
  }
  
  nv.drawScene()
  setLoading(false)
}

await nv.loadVolumes([{
  url: urlFichier,
  name: `${sequenceType || 'IRM'}.nii`,
  colormap: 'gray',
  opacity: 1,
}])

    } catch (e) {
      console.error('ViewerIRM error:', e)
      setErreur('Erreur lors du chargement de l\'IRM : ' + e.message)
      setLoading(false)
    }
  }

  const changerSlice = (delta) => {
    if (!niivueRef.current) return
    const newSlice = Math.max(0, Math.min(totalSlices - 1, slice + delta))
    setSlice(newSlice)
    niivueRef.current.scene.crosshairPos[2] = newSlice / totalSlices
    niivueRef.current.drawScene()
  }

  return (
    <div style={{
      background: '#000', borderRadius: '12px', overflow: 'hidden',
      position: 'relative',
      height: plein ? '80vh' : '400px',
      transition: 'height 0.3s ease'
    }}>
      {/* Toolbar */}
      <div style={{
        position: 'absolute', top: '10px', left: '10px', right: '10px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.7)', borderRadius: '8px',
          padding: '6px 12px', color: 'white', fontSize: '12px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{sequenceType || 'IRM'}</span>
          {totalSlices > 0 && <span style={{ color: '#94a3b8' }}>Coupe {slice + 1}/{totalSlices}</span>}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setMode(mode === '2D' ? '3D' : '2D')} style={{
            background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px', padding: '6px 12px', color: 'white',
            cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            {mode === '2D' ? <><Box size={14} /> 3D</> : <><Layers size={14} /> 2D</>}
          </button>
          <button onClick={() => setPlein(!plein)} style={{
            background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px', padding: '6px 10px', color: 'white', cursor: 'pointer'
          }}>
            {plein ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* ✅ Canvas toujours visible même si totalSlices = 0 */}
      <canvas ref={canvasRef} style={{
        width: '100%', height: '100%',
        display: loading || erreur ? 'none' : 'block'
      }} />

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #1e3a5f',
            borderTop: '3px solid #38bdf8', borderRadius: '50%',
            animation: 'spin 1s linear infinite', marginBottom: '12px'
          }} />
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Chargement de l'IRM...</p>
        </div>
      )}

      {erreur && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'white', padding: '24px'
        }}>
          <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>❌ {erreur}</p>
          <button onClick={chargerViewer} style={{
            marginTop: '12px', padding: '8px 16px', borderRadius: '8px',
            background: '#1e3a5f', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px'
          }}>Réessayer</button>
        </div>
      )}

      {!loading && !erreur && mode === '2D' && totalSlices > 0 && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(0,0,0,0.7)', borderRadius: '20px', padding: '6px 12px'
        }}>
          <button onClick={() => changerSlice(-1)} style={{
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '2px'
          }}><ChevronLeft size={18} /></button>
          <input type="range" min="0" max={totalSlices - 1} value={slice}
            onChange={e => { const v = Number(e.target.value); setSlice(v); changerSlice(0) }}
            style={{ width: '120px', accentColor: '#38bdf8' }} />
          <button onClick={() => changerSlice(1)} style={{
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '2px'
          }}><ChevronRight size={18} /></button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
