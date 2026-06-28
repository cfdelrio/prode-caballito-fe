import { format } from 'date-fns'
import { es as esLocale } from 'date-fns/locale'
import type { RankingEntry } from '@/types'

/* ── Keyframe: barra de progreso animada ─────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('pozo-anim')) {
  const s = document.createElement('style')
  s.id = 'pozo-anim'
  s.textContent = `@keyframes scaleBarIn { from { transform: scaleX(0) } to { transform: scaleX(1) } }`
  document.head.appendChild(s)
}

/* ── Constants ───────────────────────────────────────────────────── */
export const PRICE_PER_PLANILLA = 20_000

/* ── Helpers ─────────────────────────────────────────────────────── */
export function formatMoney(n: number): string {
  return '$' + n.toLocaleString('es-AR')
}

export function calcPozoStats(ranking: RankingEntry[]) {
  const totalPlayers = ranking.length
  const paidPlayers  = ranking.filter(r => r.precio_pagado).length
  const paidPct      = totalPlayers > 0 ? Math.round((paidPlayers / totalPlayers) * 100) : 0
  const recaudado    = paidPlayers * PRICE_PER_PLANILLA
  const pozoTotal    = totalPlayers * PRICE_PER_PLANILLA
  return { totalPlayers, paidPlayers, paidPct, recaudado, pozoTotal }
}

/* ── Props ───────────────────────────────────────────────────────── */
// Cada torneo reparte su propio pozo: el premio es por planilla × torneo, separado.
export interface PozoTorneo {
  name: string
  ranking: RankingEntry[]
}
export interface PozoHeroCardProps {
  pozos: PozoTorneo[]
  now: Date
}

/* ── Bloque de pozo de un torneo ─────────────────────────────────── */
function PozoTorneoBloque({ name, ranking, delay }: { name: string; ranking: RankingEntry[]; delay: number }) {
  const { totalPlayers, paidPlayers, paidPct, pozoTotal } = calcPozoStats(ranking)
  return (
    <div
      className="transition-transform hover:scale-[1.02]"
      style={{
        background: 'rgba(255,214,0,0.10)',
        border: '1px solid rgba(255,214,0,0.35)',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 0 24px rgba(255,214,0,0.10)',
        animation: `slideUp 0.5s ease-out ${delay}s both`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl">🏆</span>
        <span
          style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
        >
          {name}
        </span>
      </div>
      <div
        className="font-black"
        style={{ color: '#FFD600', fontSize: 'clamp(16px, 3.4vw, 24px)' }}
        aria-label={`Pozo de ${name}: ${formatMoney(pozoTotal)}`}
      >
        {formatMoney(pozoTotal)}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
        {paidPlayers} de {totalPlayers} pagaron · si pagan todos
      </div>
      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,214,0,0.15)' }}>
        <div
          role="progressbar"
          aria-valuenow={paidPct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1 rounded-full"
          style={{ width: `${paidPct}%`, background: '#FFD600', animation: 'scaleBarIn 1.2s ease-out 0.6s both', transformOrigin: 'left' }}
        />
      </div>
      <div style={{ fontSize: 9, color: 'rgba(253,224,71,0.6)', marginTop: 3 }}>{paidPct}% adentro</div>
    </div>
  )
}

/* ── Component ───────────────────────────────────────────────────── */
export function PozoHeroCard({ pozos, now }: PozoHeroCardProps) {
  const torneos = pozos.filter(p => p.ranking.length > 0)
  const totalJugadores = torneos.reduce((s, p) => s + p.ranking.length, 0)

  return (
    <div
      className="text-white overflow-hidden relative md:flex-[3]"
      style={{ minHeight: 300, background: 'linear-gradient(135deg, #001f5b 0%, #002f87 100%)' }}
    >
      {/* Textura suave */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 40%, rgba(255,214,0,0.05) 0%, transparent 60%), radial-gradient(circle at 85% 20%, rgba(59,130,246,0.07) 0%, transparent 50%)',
        }}
      />

      <div className="relative px-5 py-6 flex flex-col gap-4" style={{ animation: 'slideUp 0.5s ease-out' }}>

        {/* Badges header */}
        <div className="flex items-center justify-between">
          <div
            style={{ background: 'rgba(255,214,0,0.12)', border: '1px solid rgba(255,214,0,0.35)', borderRadius: 99, padding: '5px 14px' }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', letterSpacing: '0.06em' }}>
              🔥 EL PREMIO CRECE
            </span>
          </div>
          <div
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 99, padding: '5px 12px' }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
              👥 PRODE 2026
            </span>
          </div>
        </div>

        {/* Título */}
        <div>
          <h1
            className="font-black text-white leading-none"
            style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontFamily: "'Arial Black', Arial, sans-serif", lineHeight: 0.95 }}
          >
            CADA TORNEO<br />
            <span style={{ color: '#FFD600' }}>SU PROPIO POZO</span>
          </h1>
          <p className="font-semibold text-white text-sm mt-2 leading-snug">
            Los premios se reparten por separado en cada torneo.
          </p>
          <p className="text-xs mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Cada planilla compite por el pozo de su torneo · {formatMoney(PRICE_PER_PLANILLA)} c/planilla.
          </p>
        </div>

        {/* Un pozo por torneo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {torneos.map((p, i) => (
            <PozoTorneoBloque key={p.name} name={p.name} ranking={p.ranking} delay={0.1 + i * 0.1} />
          ))}
        </div>

        {totalJugadores === 0 && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Todavía no hay jugadores anotados.
          </p>
        )}

        {/* Fecha */}
        <p className="text-white/25 text-[10px] tracking-wider font-semibold uppercase">
          {format(now, 'EEEE, d MMM yyyy', { locale: esLocale })}
        </p>
      </div>
    </div>
  )
}
