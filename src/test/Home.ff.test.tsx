import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Home } from '@/pages/Home'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const store = { user: { id: 'u1', nombre: 'Carlos', idioma_pref: 'es', rol: 'user' } }
    return selector ? selector(store) : store
  }),
}))

vi.mock('@/store/toastStore', () => ({
  useToastStore: () => ({ addToast: vi.fn(), show: vi.fn() }),
}))

vi.mock('@/utils/theme', () => ({ applyTheme: vi.fn() }))

vi.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: () => ({ state: { type: 'unavailable' }, install: vi.fn() }),
}))

vi.mock('@/pages/LeaderHome', () => ({
  LeaderHome: () => <div data-testid="leader-home" />,
}))

vi.mock('@/utils/teamFlags', () => ({
  teamFlag: () => '',
  teamAbbr: (name: string) => name.slice(0, 3).toUpperCase(),
}))

vi.mock('@/store/teamBadgesStore', () => ({
  useTeamBadgesStore: () => ({}),
  getTeamBadge: () => null,
}))

vi.mock('@/components/match/MatchCard', () => ({
  MatchCard: ({ match }: { match: { home_team: string; away_team: string } }) => (
    <div data-testid="match-card">{match.home_team} vs {match.away_team}</div>
  ),
}))

vi.mock('@/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLANILLA = { id: 'p1', user_id: 'u1', nombre_planilla: 'Mi planilla', precio_pagado: false, locked: false }

// u1 must NOT be at position 1 with points > 0, otherwise Home redirects to LeaderHome
const RANKING_ENTRIES = [
  { planilla_id: 'p1', user_id: 'u1', user_name: 'Carlos', nombre_planilla: 'Mi planilla', puntos_totales: 0, exactos_count: 0, aciertos_celeste: 0, aciertos_rojo: 0, aciertos_verde: 0, aciertos_amarillo: 0, position: 3, precio_pagado: true },
  { planilla_id: 'p2', user_id: 'u2', user_name: 'Ana', nombre_planilla: 'Planilla 2', puntos_totales: 5, exactos_count: 0, aciertos_celeste: 0, aciertos_rojo: 0, aciertos_verde: 0, aciertos_amarillo: 0, position: 1, precio_pagado: false },
  { planilla_id: 'p3', user_id: 'u3', user_name: 'Juan', nombre_planilla: 'Planilla 3', puntos_totales: 3, exactos_count: 0, aciertos_celeste: 0, aciertos_rojo: 0, aciertos_verde: 0, aciertos_amarillo: 0, position: 2, precio_pagado: false },
]

async function setupApi() {
  const { api } = await import('@/api/client')
  ;(api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (url.startsWith('/matches')) return Promise.resolve({ data: { data: { matches: [] } } })
    if (url.startsWith('/planillas')) return Promise.resolve({ data: { data: [PLANILLA] } })
    if (url.startsWith('/ranking')) return Promise.resolve({ data: { data: { ranking: RANKING_ENTRIES } } })
    if (url.includes('/bets')) return Promise.resolve({ data: { data: [] } })
    return Promise.resolve({ data: { data: [] } })
  })
}

function renderHome() {
  return render(<MemoryRouter><Home /></MemoryRouter>)
}

// ─── Feature flag OFF (default) ───────────────────────────────────────────────

describe('Home — hero con feature flag OFF (ff_pozo_hero no seteado)', () => {
  beforeEach(() => { localStorage.removeItem('ff_pozo_hero') })
  afterEach(() => vi.clearAllMocks())

  it('muestra el hero original "EL MUNDIAL"', async () => {
    await setupApi()
    renderHome()
    await waitFor(() => {
      // The h1 has multiple text nodes: "EL MUNDIAL", "SE JUEGA ACÁ", "TAMBIÉN"
      // Use getByRole('heading') to target the h1 directly
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.textContent).toMatch(/EL MUNDIAL/i)
    })
  })

  it('no muestra "ESTADO DEL POZO"', async () => {
    await setupApi()
    renderHome()
    await waitFor(() => {
      expect(screen.queryByText(/ESTADO DEL POZO/i)).not.toBeInTheDocument()
    })
  })

  it('muestra CTA "Jugar ahora" o "Completar mi prode"', async () => {
    await setupApi()
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/jugar ahora|completar mi prode/i)).toBeInTheDocument()
    })
  })

  it('llama al ranking con límite 200', async () => {
    await setupApi()
    const { api } = await import('@/api/client')
    renderHome()
    await waitFor(() => {
      const calls = (api.get as ReturnType<typeof vi.fn>).mock.calls.map((c: any[]) => c[0])
      expect(calls.some((url: string) => url.includes('/ranking') && url.includes('200'))).toBe(true)
    })
  })
})

// ─── Feature flag ON ──────────────────────────────────────────────────────────

describe('Home — hero con feature flag ON (ff_pozo_hero = "true")', () => {
  beforeEach(() => { localStorage.setItem('ff_pozo_hero', 'true') })
  afterEach(() => { localStorage.removeItem('ff_pozo_hero'); vi.clearAllMocks() })

  it('muestra "ESTADO DEL POZO" en lugar del hero original', async () => {
    await setupApi()
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/ESTADO DEL POZO/i)).toBeInTheDocument()
    })
  })

  it('no muestra el título "EL MUNDIAL"', async () => {
    await setupApi()
    renderHome()
    await waitFor(() => {
      expect(screen.queryByText(/EL MUNDIAL/i)).not.toBeInTheDocument()
    })
  })

  it('muestra métricas de jugadores que pagaron', async () => {
    await setupApi()
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/¿Cuántos ya pagaron\?/i)).toBeInTheDocument()
    })
  })

  it('muestra métricas de recaudado', async () => {
    await setupApi()
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/¿Cuánto recaudado\?/i)).toBeInTheDocument()
    })
  })

  it('muestra métricas del pozo potencial', async () => {
    await setupApi()
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/Pozo si todos pagan/i)).toBeInTheDocument()
    })
  })

  it('muestra PRODE 2026 badge', async () => {
    await setupApi()
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/PRODE 2026/i)).toBeInTheDocument()
    })
  })
})
