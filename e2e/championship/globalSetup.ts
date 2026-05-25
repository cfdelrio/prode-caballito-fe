/**
 * Championship globalSetup — creates all test data via API before any spec runs.
 *
 * Creates:
 *   - 1 tournament "[E2E] Copa Test {timestamp}"
 *   - 4 matches (cutoff +90min so users can bet from browser)
 *   - 1 match with past cutoff (for cutoff enforcement tests)
 *   - 3 test users (lider, rival, virtual) — registers if not exist
 *   - 3 planillas, one per user — named with [E2E] prefix
 *   - Marks lider and rival planillas as paid (via admin)
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

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL?.trim()    || 'cfdelrio@gmail.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD?.trim() || 'carlitos'

const USERS = {
  lider:   { email: process.env.E2E_LIDER_EMAIL?.trim()   || 'cfdelrio+lider@gmail.com',   password: process.env.E2E_LIDER_PASS?.trim()   || 'e2etest2026', nombre: 'E2E Lider'   },
  rival:   { email: process.env.E2E_RIVAL_EMAIL?.trim()   || 'cfdelrio+rival@gmail.com',   password: process.env.E2E_RIVAL_PASS?.trim()   || 'e2etest2026', nombre: 'E2E Rival'   },
  virtual: { email: process.env.E2E_VIRTUAL_EMAIL?.trim() || 'cfdelrio+virtual@gmail.com', password: process.env.E2E_VIRTUAL_PASS?.trim() || 'e2etest2026', nombre: 'E2E Virtual' },
}

async function globalSetup() {
  console.log('\n🏆 Championship globalSetup starting...')

  // 1. Admin login
  const admin = await ApiClient.login(ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('  ✓ Admin logged in')

  // 2. Create tournament
  const ts            = Date.now()
  const tournamentId  = await createTournament(admin, `[E2E] Copa Test ${ts}`)
  console.log(`  ✓ Tournament created: ${tournamentId}`)

  // 3. Create 4 main matches + 1 with past cutoff
  // Note: mCutoff has NO tournament_id — keeps it out of planilla lock validation
  const matchIds: Record<string, string> = {}
  for (const [key, m] of Object.entries(MATCHES)) {
    if (key === 'mCutoff') {
      matchIds[key] = await createMatchPastCutoff(admin, {
        home_team: m.home,
        away_team: m.away,
      })
    } else {
      matchIds[key] = await createMatch(admin, {
        home_team:     m.home,
        away_team:     m.away,
        tournament_id: tournamentId,
        jornada:       m.jornada,
      })
    }
  }
  console.log(`  ✓ ${Object.keys(matchIds).length} matches created`)

  // Publish mCutoff result immediately so it's 'finished' before planilla locking.
  // The lock validation checks ALL pending matches globally — if mCutoff stays pending
  // with no bets it would block locking even though it's not in the tournament.
  await publishResult(admin, matchIds.mCutoff, 1, 0)
  console.log('  ✓ mCutoff result published (match now finished, won\'t block planilla lock)')

  // 4. Register/login test users
  const userIds:   Record<string, string> = {}
  const userTokens: Record<string, string> = {}
  for (const [key, u] of Object.entries(USERS)) {
    const { client, userId } = await ApiClient.loginOrRegister(u.email, u.password, u.nombre)
    userIds[key]    = userId
    userTokens[key] = client.token
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 400))
  }
  console.log('  ✓ Test users ready')

  // 5. Create planillas for each user
  const planillaIds: Record<string, string> = {}
  for (const [key, u] of Object.entries(USERS)) {
    const userClient = new ApiClient(userTokens[key])
    const planillaId = await createPlanilla(userClient)
    await renamePlanilla(userClient, planillaId, PLANILLA_NAMES[key as keyof typeof PLANILLA_NAMES])
    planillaIds[key] = planillaId
    await new Promise(r => setTimeout(r, 300))
  }
  console.log('  ✓ Planillas created and renamed')

  // 6. Planillas are NOT locked yet — locking happens in spec 04 after all bets
  //    are placed through the browser UI (specs 01-03).
  console.log('  ✓ Planillas ready (locking happens after betting in spec 04)')

  // 7. Persist state for all specs
  writeState({ tournamentId, matchIds, planillaIds, userIds })
  console.log('  ✓ State persisted to .champ-state.json')
  console.log('🏆 Championship globalSetup complete!\n')
}

export default globalSetup
