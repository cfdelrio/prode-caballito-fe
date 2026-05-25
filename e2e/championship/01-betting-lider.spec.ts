/**
 * E2E: Lider places bets on all 4 championship matches via the browser UI.
 *
 * Logged in as: e2e.lider@prode.test
 * Planilla: "[E2E] Planilla Lider" (pagada)
 *
 * What this tests:
 *  - User can navigate to /apuestas and see the championship matches
 *  - User can select their planilla from the dropdown
 *  - User can enter and save a score through the MatchCard UI
 *  - The saved score is displayed immediately after saving
 *  - The bet progress counter updates
 */
import { test, expect } from '@playwright/test'
import path from 'path'
import { BETS_LIDER, MATCHES, PLANILLA_NAMES } from './helpers/fixture'

const AUTH_FILE = path.join(import.meta.dirname, '../.auth/lider.json')
test.use({ storageState: AUTH_FILE })

async function selectPlanilla(page: any) {
  const select = page.locator('[data-tour="planilla-selector"] select')
  await select.waitFor({ state: 'attached', timeout: 15_000 })
  await select.selectOption({ label: PLANILLA_NAMES.lider })
}

async function placeBetInUI(
  page: any,
  homeTeam: string,
  awayTeam: string,
  score: string,
) {
  const matchList = page.locator('[data-tour="match-list"]')
  // Find the card that contains both team names
  const card = matchList
    .locator('.t-surface, [class*="rounded"]')
    .filter({ hasText: homeTeam })
    .filter({ hasText: awayTeam })
    .first()

  await card.waitFor({ timeout: 8_000 })

  // Click "Apostar" button (blue CTA)
  const apostarBtn = card.getByRole('button', { name: /apostar|\+/i })
  await apostarBtn.click()

  // Fill score input
  const input = card.locator('input[placeholder="2-1"], input[type="text"]').first()
  await input.waitFor({ timeout: 5_000 })
  await input.fill(score)

  // Click Guardar
  const saveBtn = card.getByRole('button', { name: /guardar/i })
  await saveBtn.click()

  // Wait for save confirmation — score should be visible in the card
  await expect(card.getByText(score)).toBeVisible({ timeout: 8_000 })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/apuestas')
  // Verify we're on /apuestas (not redirected to /login due to expired auth)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  await page.waitForSelector('[data-tour="planilla-selector"]', { timeout: 30_000 })
  await selectPlanilla(page)
})

test('Lider ve los partidos del campeonato en /apuestas', async ({ page }) => {
  await expect(page.getByText('Argentina')).toBeVisible()
  await expect(page.getByText('Brasil')).toBeVisible()
  await expect(page.getByText('Uruguay')).toBeVisible()
  await expect(page.getByText('Chile')).toBeVisible()
})

test('Lider apuesta mA: Argentina vs Brasil — 2-0', async ({ page }) => {
  await placeBetInUI(page, MATCHES.mA.home, MATCHES.mA.away, BETS_LIDER.mA)
})

test('Lider apuesta mB: Uruguay vs Chile — 0-0', async ({ page }) => {
  await placeBetInUI(page, MATCHES.mB.home, MATCHES.mB.away, BETS_LIDER.mB)
})

test('Lider apuesta mC: Argentina vs Uruguay — 3-1', async ({ page }) => {
  await placeBetInUI(page, MATCHES.mC.home, MATCHES.mC.away, BETS_LIDER.mC)
})

test('Lider apuesta mD: Brasil vs Chile — 1-1', async ({ page }) => {
  await placeBetInUI(page, MATCHES.mD.home, MATCHES.mD.away, BETS_LIDER.mD)
})

test('Lider ve el progreso actualizado después de apostar todos', async ({ page }) => {
  // Progress should show 4 bets placed
  // The header shows something like "4/4 Completados" or "4 completados"
  const progress = page.getByText(/4.*completad|completad.*4/i)
  const isVisible = await progress.isVisible().catch(() => false)
  if (!isVisible) {
    // Alternative: no pending bets message
    const noPending = page.getByText(/al día|sin pendientes|todo completado/i)
    await expect(noPending.or(progress)).toBeVisible({ timeout: 5_000 })
  }
})
