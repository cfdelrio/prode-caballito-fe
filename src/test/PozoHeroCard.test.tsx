import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PozoHeroCard, calcPozoStats, formatMoney, PRICE_PER_PLANILLA } from '@/components/PozoHeroCard'
import type { RankingEntry } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return {
    planilla_id: 'p1',
    nombre_planilla: 'Planilla 1',
    user_id: 'u1',
    user_name: 'Test User',
    puntos_totales: 0,
    exactos_count: 0,
    aciertos_celeste: 0,
    aciertos_rojo: 0,
    aciertos_verde: 0,
    aciertos_amarillo: 0,
    position: 1,
    precio_pagado: false,
    ...overrides,
  }
}

const NOW = new Date('2026-06-04T12:00:00Z')

// ─── formatMoney ──────────────────────────────────────────────────────────────

describe('formatMoney', () => {
  it('formats 0 correctly', () => {
    expect(formatMoney(0)).toBe('$0')
  })

  it('formats 20000 with Argentine thousand separator', () => {
    const result = formatMoney(20_000)
    expect(result).toMatch(/^\$/)
    expect(result).toContain('20')
  })

  it('formats 360000 starting with $', () => {
    expect(formatMoney(360_000)).toMatch(/^\$/)
  })

  it('formats 840000 starting with $', () => {
    expect(formatMoney(840_000)).toMatch(/^\$/)
  })
})

// ─── PRICE_PER_PLANILLA ───────────────────────────────────────────────────────

describe('PRICE_PER_PLANILLA', () => {
  it('is 20000', () => {
    expect(PRICE_PER_PLANILLA).toBe(20_000)
  })
})

// ─── calcPozoStats ────────────────────────────────────────────────────────────

describe('calcPozoStats', () => {
  it('returns all zeros for empty ranking', () => {
    const stats = calcPozoStats([])
    expect(stats).toEqual({ totalPlayers: 0, paidPlayers: 0, paidPct: 0, recaudado: 0, pozoTotal: 0 })
  })

  it('counts totalPlayers as ranking.length', () => {
    const ranking = [makeEntry(), makeEntry({ planilla_id: 'p2', user_id: 'u2' })]
    expect(calcPozoStats(ranking).totalPlayers).toBe(2)
  })

  it('counts paidPlayers as entries with precio_pagado = true', () => {
    const ranking = [
      makeEntry({ precio_pagado: true }),
      makeEntry({ planilla_id: 'p2', precio_pagado: false }),
      makeEntry({ planilla_id: 'p3', precio_pagado: true }),
    ]
    expect(calcPozoStats(ranking).paidPlayers).toBe(2)
  })

  it('computes paidPct correctly', () => {
    const ranking = [
      makeEntry({ precio_pagado: true }),
      makeEntry({ planilla_id: 'p2', precio_pagado: false }),
      makeEntry({ planilla_id: 'p3', precio_pagado: false }),
      makeEntry({ planilla_id: 'p4', precio_pagado: false }),
    ]
    expect(calcPozoStats(ranking).paidPct).toBe(25)
  })

  it('rounds paidPct correctly (floor semantics)', () => {
    // 1/3 = 33.33... → rounds to 33
    const ranking = [
      makeEntry({ precio_pagado: true }),
      makeEntry({ planilla_id: 'p2', precio_pagado: false }),
      makeEntry({ planilla_id: 'p3', precio_pagado: false }),
    ]
    expect(calcPozoStats(ranking).paidPct).toBe(33)
  })

  it('computes recaudado = paidPlayers * PRICE_PER_PLANILLA', () => {
    const ranking = [
      makeEntry({ precio_pagado: true }),
      makeEntry({ planilla_id: 'p2', precio_pagado: true }),
      makeEntry({ planilla_id: 'p3', precio_pagado: false }),
    ]
    expect(calcPozoStats(ranking).recaudado).toBe(2 * PRICE_PER_PLANILLA)
  })

  it('computes pozoTotal = totalPlayers * PRICE_PER_PLANILLA', () => {
    const ranking = [makeEntry(), makeEntry({ planilla_id: 'p2' }), makeEntry({ planilla_id: 'p3' })]
    expect(calcPozoStats(ranking).pozoTotal).toBe(3 * PRICE_PER_PLANILLA)
  })

  it('paidPct is 100 when all players paid', () => {
    const ranking = [
      makeEntry({ precio_pagado: true }),
      makeEntry({ planilla_id: 'p2', precio_pagado: true }),
    ]
    expect(calcPozoStats(ranking).paidPct).toBe(100)
  })

  it('paidPct is 0 when no players paid', () => {
    const ranking = [makeEntry({ precio_pagado: false }), makeEntry({ planilla_id: 'p2', precio_pagado: false })]
    expect(calcPozoStats(ranking).paidPct).toBe(0)
  })
})

// ─── PozoHeroCard component ───────────────────────────────────────────────────

describe('PozoHeroCard', () => {
  const paidEntry = makeEntry({ precio_pagado: true })
  const unpaidEntry1 = makeEntry({ planilla_id: 'p2', precio_pagado: false })
  const unpaidEntry2 = makeEntry({ planilla_id: 'p3', precio_pagado: false })
  // Mundial: 1 de 2 pagaron (pozo $40.000) · 2° Prode: 0 de 1 (pozo $20.000)
  const pozos = [
    { name: 'Mundial 2026', ranking: [paidEntry, unpaidEntry1] },
    { name: '2° Prode', ranking: [unpaidEntry2] },
  ]

  it('renders "EL PREMIO CRECE" badge', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    expect(screen.getByText(/EL PREMIO CRECE/i)).toBeInTheDocument()
  })

  it('renders "PRODE 2026" badge', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    expect(screen.getByText(/PRODE 2026/i)).toBeInTheDocument()
  })

  it('renders the "un pozo por torneo" title', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(/CADA TORNEO/i)
    expect(heading.textContent).toMatch(/SU PROPIO POZO/i)
  })

  it('explica que los premios van por separado', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    expect(screen.getByText(/se reparten por separado en cada torneo/i)).toBeInTheDocument()
  })

  it('muestra un bloque por cada torneo con su nombre', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    expect(screen.getByText('Mundial 2026')).toBeInTheDocument()
    expect(screen.getByText('2° Prode')).toBeInTheDocument()
  })

  it('muestra el pozo de cada torneo por separado', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    // Mundial: 2 planillas × $20.000 = $40.000 · 2° Prode: 1 × $20.000 = $20.000
    expect(screen.getByLabelText(/Pozo de Mundial 2026: \$40\.000/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Pozo de 2° Prode: \$20\.000/i)).toBeInTheDocument()
  })

  it('muestra cuántos pagaron por torneo', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    expect(screen.getByText(/1 de 2 pagaron/i)).toBeInTheDocument()
    expect(screen.getByText(/0 de 1 pagaron/i)).toBeInTheDocument()
  })

  it('renderiza una barra de progreso por torneo', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    const bars = screen.getAllByRole('progressbar')
    expect(bars.length).toBe(2)
    // Mundial 1/2 = 50%
    expect(bars[0]).toHaveAttribute('aria-valuenow', '50')
  })

  it('renders the date', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    const dateEl = document.querySelector('p.text-white\\/25')
    expect(dateEl?.textContent).toMatch(/2026/i)
  })

  it('omite torneos sin jugadores y muestra zero-state si no hay ninguno', () => {
    render(<PozoHeroCard pozos={[{ name: 'Mundial 2026', ranking: [] }]} now={NOW} />)
    expect(screen.queryByText('Mundial 2026')).not.toBeInTheDocument()
    expect(screen.getByText(/no hay jugadores anotados/i)).toBeInTheDocument()
  })

  it('muestra 100% cuando todos pagaron en el torneo', () => {
    const allPaid = [
      makeEntry({ precio_pagado: true }),
      makeEntry({ planilla_id: 'p2', precio_pagado: true }),
    ]
    render(<PozoHeroCard pozos={[{ name: 'Mundial 2026', ranking: allPaid }]} now={NOW} />)
    expect(screen.getByText(/100% adentro/i)).toBeInTheDocument()
  })

  it('muestra el precio por planilla', () => {
    render(<PozoHeroCard pozos={pozos} now={NOW} />)
    expect(screen.getByText(/c\/planilla/i)).toBeInTheDocument()
  })
})
