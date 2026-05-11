import { useEffect, useState } from 'react'
import { api } from '@/api/client'

interface WinnerData {
  image_url: string
  matchday_label?: string
  user_name?: string
  points?: number
  updated_at?: string
}

/* ── Animación fade-in del carousel ─────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('ganadores-modal-anim')) {
  const s = document.createElement('style')
  s.id = 'ganadores-modal-anim'
  s.textContent = `
    @keyframes ganadoresFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `
  document.head.appendChild(s)
}

export function GanadoresModal({ onClose }: { onClose: () => void }) {
  const [winners, setWinners] = useState<WinnerData[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    // 1) Intentar el historial completo (array)
    api.get('/config/ganadores_fechas')
      .then(r => {
        const row = r.data?.data
        if (row?.value) {
          try {
            const parsed = JSON.parse(row.value)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setWinners(parsed)
              setLoading(false)
              return
            }
          } catch { /* fall through */ }
        }
        // 2) Fallback: el último ganador (singular)
        return api.get('/config/ganador_fecha').then(r2 => {
          const single = r2.data?.data
          if (!single?.value) { setError(true); return }
          try {
            const parsed = JSON.parse(single.value)
            if (parsed?.image_url) setWinners([parsed])
            else setError(true)
          } catch { setError(true) }
        })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // Reset imgError al cambiar de ganador
  useEffect(() => { setImgError(false) }, [idx])

  // Auto-advance cada 5s si hay más de 1
  useEffect(() => {
    if (winners.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % winners.length), 5000)
    return () => clearInterval(t)
  }, [winners.length])

  const prev = () => setIdx(i => (i - 1 + winners.length) % winners.length)
  const next = () => setIdx(i => (i + 1) % winners.length)
  const current = winners[idx]
  const hasMulti = winners.length > 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ background: '#001A4B' }}>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            🏆 {current?.matchday_label ?? 'Ganadores de las Fechas'}
            {hasMulti && (
              <span className="text-xs font-normal text-white/50">
                {idx + 1}/{winners.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-1">
            {hasMulti && (
              <>
                <button
                  onClick={prev}
                  className="text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-xl leading-none"
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  className="text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-xl leading-none"
                  aria-label="Siguiente"
                >
                  ›
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl leading-none transition-colors px-2"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="bg-white">
          {loading && (
            <div className="flex items-center justify-center p-16 text-gray-400 text-sm">
              Cargando...
            </div>
          )}
          {!loading && (error || !current?.image_url) && (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400 text-sm gap-2">
              <span className="text-4xl">🏆</span>
              <p>Todavía no hay ganadores publicados</p>
              <p className="text-xs text-gray-300 text-center max-w-xs">
                El admin publica el ganador con la imagen FIFA cuando termina cada fecha
              </p>
            </div>
          )}
          {!loading && !error && current?.image_url && (
            <>
              {imgError ? (
                /* Fallback cuando la imagen expiró o no carga */
                <div className="flex flex-col items-center justify-center py-14 px-8 gap-4"
                  style={{ background: 'linear-gradient(135deg, #001A4B 0%, #0042A5 100%)' }}>
                  <span className="text-7xl">🏆</span>
                  {current.user_name && (
                    <p className="text-white font-black text-2xl text-center">{current.user_name}</p>
                  )}
                  {current.points != null && (
                    <p className="text-yellow-300 font-bold text-lg">{current.points} puntos</p>
                  )}
                  <p className="text-white/60 text-sm text-center">{current.matchday_label}</p>
                </div>
              ) : (
                <img
                  key={idx}
                  src={current.image_url}
                  alt={current.matchday_label ?? 'Ganador de la fecha'}
                  className="w-full block"
                  style={{ animation: 'ganadoresFadeIn .3s ease' }}
                  onError={() => setImgError(true)}
                />
              )}
              {/* Nombre y puntos debajo de la imagen (si están disponibles) */}
              {!imgError && (current.user_name || current.points != null) && (
                <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-gray-100">
                  {current.user_name && (
                    <span className="font-bold text-[#001A4B]">{current.user_name}</span>
                  )}
                  {current.points != null && (
                    <span className="text-sm font-semibold text-[#0042A5] bg-blue-50 px-2 py-0.5 rounded-full">
                      {current.points} pts
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Dots indicator cuando hay múltiples */}
        {!loading && !error && hasMulti && (
          <div className="flex items-center justify-center gap-1.5 py-3 bg-white border-t border-gray-100">
            {winners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ir a ganador ${i + 1}`}
                style={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  border: 'none',
                  cursor: 'pointer',
                  background: i === idx ? '#001A4B' : '#D1D5DB',
                  transition: 'all .3s',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
