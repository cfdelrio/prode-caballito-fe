/**
 * Championship globalSetup — creates all test data via API before any spec runs.
 *
 * Creates:
 *   - 1 tournament "[E2E] Copa Test {timestamp}"
 *   - 4 matches (cutoff +90min so users can bet from browser)
 *   - 1 match with past cutoff (for cutoff enforcement tests)
 *   - 3 test users (lider, rival, virtual) — registers if not exist
 *   - 3 planillas, one per user — named with [E2E] prefix
 */
import {
  ApiClient,
  createTournament,
  createMatch,
  createMatchPastCutoff,
  createPlanilla,
  renamePlanilla,
  publishResult,
} from './helpers/api'
import { writeState } from './helpers/state'
import { MATCHES, PLANILLA_NAMES } from './helpers/fixture'
import { E2E_RUN_TIMESTAMP } from './helpers/timestamp'

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL?.trim()    || 'cfdelrio@gmail.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD?.trim() || 'carlitos'

const USERS = {
  lider:   { email: process.env.E2E_LIDER_EMAIL?.trim()   || `cfdelrio.e2e.lider.${E2E_RUN_TIMESTAMP}@gmail.com`,   password: process.env.E2E_LIDER_PASS?.trim()   || 'e2etest2026', nombre: 'E2E Lider'   },
  rival:   { email: process.env.E2E_RIVAL_EMAIL?.trim()   || `cfdelrio.e2e.rival.${E2E_RUN_TIMESTAMP}@gmail.com`,   password: process.env.E2E_RIVAL_PASS?.trim()   || 'e2etest2026', nombre: 'E2E Rival'   },
  virtual: { email: process.env.E2E_VIRTUAL_EMAIL?.trim() || `cfdelrio.e2e.virtual.${E2E_RUN_TIMESTAMP}@gmail.com`, password: process.env.E2E_VIRTUAL_PASS?.trim() || 'e2etest2026', nombre: 'E2E Virtual' },
}

async function globalSetup() {
  console.log('\n🏆 Championship globalSetup starting...')

  // Step 1: Admin login
  const admin = await ApiClient.login(ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('  ✓ Admin logged in')

  // Step 2: Create tournament (matches need its ID)
  const ts           = Date.now()
  const tournamentId = await createTournament(admin, `[E2E] Copa Test ${ts}`)
  console.log(`  ✓ Tournament created: ${tournamentId}`)

  // Step 3: Create all matches + register all users in parallel (independent)
  const [matchEntries, userResults] = await Promise.all([
    Promise.all(
      Object.entries(MATCHES).map(async ([key, m]) => {
        const id = key === 'mCutoff'
          ? await createMatchPastCutoff(admin, { home_team: m.home, away_team: m.away })
          : await createMatch(admin, { home_team: m.home, away_team: m.away, tournament_id: tournamentId, jornada: m.jornada })
        return [key, id] as const
      })
    ),
    Promise.all(
      Object.entries(USERS).map(([key, u]) =>
        ApiClient.loginOrRegister(u.email, u.password, u.nombre).then(r => [key, r] as const)
      )
    ),
  ])

  const matchIds: Record<string, string> = Object.fromEntries(matchEntries)
  console.log(`  ✓ ${Object.keys(matchIds).length} matches created`)

  const userIds:    Record<string, string> = {}
  const userTokens: Record<string, string> = {}
  for (const [key, { client, userId }] of userResults) {
    userIds[key]    = userId
    userTokens[key] = client.token
  }
  console.log('  ✓ Test users ready')

  // Step 4: Publish mCutoff + create planillas in parallel
  // - mCutoff must be 'finished' before planilla locking (spec 04).
  //   Lock validation checks ALL pending matches globally; mCutoff has no tournament
  //   but would block locking if it stayed pending.
  // - Planillas are independent of mCutoff publish.
  const [, planillaEntries] = await Promise.all([
    publishResult(admin, matchIds.mCutoff, 1, 0),
    Promise.all(
      Object.keys(USERS).map(async key => {
        const userClient = new ApiClient(userTokens[key])
        const planillaId = await createPlanilla(userClient)
        await renamePlanilla(userClient, planillaId, PLANILLA_NAMES[key as keyof typeof PLANILLA_NAMES])
        return [key, planillaId] as const
      })
    ),
  ])

  const planillaIds: Record<string, string> = Object.fromEntries(planillaEntries)
  console.log('  ✓ mCutoff result published + planillas created and renamed')
  console.log('  ✓ Planillas ready (locking happens after betting in spec 04)')

  // Step 5: Persist state for all specs
  writeState({ tournamentId, matchIds, planillaIds, userIds })
  console.log('  ✓ State persisted to .champ-state.json')
  console.log('🏆 Championship globalSetup complete!\n')
}

export default globalSetup
