import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Home } from '@/pages/Home'

// ─── Mocks ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLANILLA = { id: 'p1', user_id: 'u1', nombre_planilla: 'Mi planilla', precio_pagado: true }

function futureMatch(id: string) {
  return {
    id,
    home_team: `Home${id}`,
    away_team: `Away${id}`,
    start_time: new Date(Date.now() + 73 * 3600 * 1000).toISOString(),
    time_cutoff: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    estado: 'pending',
    finished: false,
  }
}

function setupApi(overrides: {
  matches?: unknown[]
  bets?: unknown[]
  ranking?: unknown[]
  rejectAll?: boolean
} = {}) {
  return import('@/api/client').then(({ api }) => {
    if (overrides.rejectAll) {
      ;(api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        if (url.startsWith('/matches')) return Promise.reject(new Error('network'))
        return Promise.resolve({ data: { data: [] } })
      })
      return
    }
    ;(api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.startsWith('/matches'))   return Promise.resolve({ data: { data: { matches: overrides.matches ?? [] } } })
      if (url.startsWith('/planillas')) return Promise.resolve({ data: { data: [PLANILLA] } })
      if (url.startsWith('/ranking'))   return Promise.resolve({ data: { data: { ranking: overrides.ranking ?? [] } } })
      if (url.includes('/bets'))        return Promise.resolve({ data: { data: overrides.bets ?? [] } })
      return Promise.resolve({ data: { data: [] } })
    })
  })
}

function renderHome() {
  return render(<MemoryRouter><Home /></MemoryRouter>)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Home — estado de carga y errores', () => {
  afterEach(() => vi.clearAllMocks())

  it('muestra skeleton mientras carga', async () => {
    const { api } = await import('@/api/client')
    ;(api.get as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}))
    renderHome()
    expect(screen.queryByText(/pronóstico/i)).toBeNull()
  })

  it('error de red → muestra botón de reintentar', async () => {
    await setupApi({ rejectAll: true })
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/reintentar/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('Home — reglamento inline', () => {
  afterEach(() => vi.clearAllMocks())

  it('muestra sección "Cómo funciona" con los 3 pasos', async () => {
    await setupApi({})
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/Cómo funciona/i)).toBeInTheDocument()
      expect(screen.getByText(/Pronosticá/i)).toBeInTheDocument()
      expect(screen.getByText(/Ganá/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('muestra sistema de puntuación con 5 niveles', async () => {
    await setupApi({})
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/Sistema de Puntuación/i)).toBeInTheDocument()
      expect(screen.getByText(/4 pts/i)).toBeInTheDocument()
      expect(screen.getByText(/3 pts/i)).toBeInTheDocument()
      expect(screen.getByText(/0 pts/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('muestra ejemplos prácticos', async () => {
    await setupApi({})
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/Ejemplos Prácticos/i)).toBeInTheDocument()
      expect(screen.getByText(/Resultado real/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('muestra condiciones importantes', async () => {
    await setupApi({})
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/Condiciones Importantes/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('Home — ranking y hero', () => {
  afterEach(() => vi.clearAllMocks())

  it('muestra posición y puntos del usuario en el hero cuando tiene ranking', async () => {
    const ranking = [
      { planilla_id: 'p2', user_id: 'u2', user_name: 'Ana García', puntos_totales: 50, position: 1 },
      { planilla_id: 'p1', user_id: 'u1', user_name: 'Carlos Foo', puntos_totales: 30, position: 2 },
    ]
    await setupApi({ ranking })
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/30\s*pts/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('muestra LeaderHome cuando el usuario está en posición 1', async () => {
    const ranking = [
      { planilla_id: 'p1', user_id: 'u1', user_name: 'Carlos Foo', puntos_totales: 50, position: 1 },
    ]
    await setupApi({ ranking })
    renderHome()
    await waitFor(() => {
      expect(screen.getByTestId('leader-home')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('sin ranking no muestra puntos en el hero', async () => {
    await setupApi({ ranking: [] })
    renderHome()
    await waitFor(() => {
      expect(screen.queryByText(/pts$/)).toBeNull()
    }, { timeout: 3000 })
  })
})

describe('Home — partidos y apuestas', () => {
  afterEach(() => vi.clearAllMocks())

  it('sin partidos → no muestra tarjetas de partido', async () => {
    await setupApi({ matches: [], ranking: [] })
    renderHome()
    await waitFor(() => {
      expect(screen.queryByTestId('match-card')).toBeNull()
    }, { timeout: 3000 })
  })

  it('con apuestas pendientes muestra CTA para completar pronósticos', async () => {
    const matches = [futureMatch('m1'), futureMatch('m2')]
    await setupApi({ matches, bets: [] })
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/pronóstico/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('Home — botón compartir', () => {
  afterEach(() => vi.clearAllMocks())

  it('muestra botón "Enviar a un amigo" siempre visible en el hero', async () => {
    await setupApi({ ranking: [] })
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/Enviar a un amigo/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('muestra card de compartir por WhatsApp al final de la página', async () => {
    await setupApi({ ranking: [] })
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/Enviar por WhatsApp/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('sticky bar mobile tiene botón de WhatsApp', async () => {
    await setupApi({ ranking: [] })
    renderHome()
    await waitFor(() => {
      const waButtons = screen.getAllByText(/Enviar a amigo/i)
      expect(waButtons.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })
  })
})
