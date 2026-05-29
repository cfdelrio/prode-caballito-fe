import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  count: number | null
}

/** Ícono de usuarios (Feather "users") — decorativo */
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

/** Ícono de tendencia al alza (Feather "trending-up") — decorativo */
function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

export function ComunidadCard({ count }: Props) {
  // Animación de entrada del número (respeta prefers-reduced-motion)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setShown(true); return }
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Sin dato todavía: no renderizamos (evita el flash de "0 jugando")
  if (count === null) return null

  const numEnter = `transition-all duration-700 ease-out motion-reduce:transition-none ${
    shown ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90'
  }`

  return (
    <div
      className="group relative w-full overflow-hidden rounded-2xl border border-green-400/20 shadow-xl
                 min-h-[300px] md:min-h-[240px]
                 transition-[transform,box-shadow] duration-300
                 motion-safe:hover:scale-[1.01] hover:shadow-[0_0_40px_-8px_rgba(34,197,94,0.5)]"
    >
      {/* Fondo: hinchada (decorativo) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/torcida.jpeg')" }}
        aria-hidden="true"
      />
      {/* Overlay verde para legibilidad + estética ESPN */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, rgba(5,46,22,0.97) 0%, rgba(6,78,59,0.92) 34%, rgba(20,83,45,0.74) 62%, rgba(21,128,61,0.42) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Contenido */}
      <div className="relative flex flex-col gap-5 p-5 md:flex-row md:items-center md:gap-4 md:p-6">
        {/* ─── Izquierda ─── */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Marca */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-green-500 text-lg leading-none text-white shadow-md">
              ♞
            </span>
            <span className="text-sm font-extrabold uppercase tracking-[0.15em] text-green-400">
              Prodecaballito
            </span>
          </div>

          <p className="text-2xl font-extrabold leading-none text-white md:text-3xl">Ya somos</p>

          {/* Número dinámico + jugando! */}
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span
              className={`text-6xl font-black tabular-nums leading-none text-green-400 drop-shadow-[0_0_14px_rgba(34,197,94,0.4)] md:text-7xl ${numEnter}`}
            >
              {count}
            </span>
            <span className="-rotate-2 text-3xl font-bold italic text-white md:text-4xl">
              jugando!
            </span>
          </div>
          <div className="h-1 w-28 rounded-full bg-green-400/70" aria-hidden="true" />

          {/* Bajada */}
          <p className="max-w-xs border-l-2 border-green-400 pl-3 text-sm leading-snug text-green-50/90">
            Cada vez somos más vecinos construyendo comunidad.
          </p>

          {/* CTA + estado */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/register"
              aria-label="Sumate ahora a ProdeCaballito — registrate gratis"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-green-600
                         px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-900/40
                         transition-colors hover:from-green-400 hover:to-green-500
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950"
            >
              <UsersIcon className="h-4 w-4" />
              Sumate ahora
              <span aria-hidden="true">→</span>
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-green-50 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-400 motion-safe:animate-pulse" aria-hidden="true" />
              Comunidad activa
            </span>
          </div>
        </div>

        {/* ─── Panel glassmorphism (derecha en desktop, abajo en mobile) ─── */}
        <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border border-green-400/25 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-md md:self-center">
          <div className="flex items-center gap-2.5">
            <UsersIcon className="h-7 w-7 text-green-400" />
            <div className="leading-tight">
              <div className="text-2xl font-black tabular-nums text-white">{count}</div>
              <div className="text-[11px] text-green-100/80">participantes</div>
            </div>
          </div>
          <div className="h-9 w-px bg-white/15" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-6 w-6 text-green-400" />
            <div className="text-xs font-semibold leading-tight text-white">
              La comunidad
              <br />
              <span className="text-green-400">sigue creciendo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
