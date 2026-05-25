/**
 * E2E: Verify badges and streaks in /profile after all results are published.
 *
 * Lider has 4 consecutive exact scores → should have:
 *   - primer_exacto badge (first exact result)
 *   - racha_3_exactos badge (3+ consecutive exactos)
 *   - current streak ≥ 4
 *
 * Rival has 0 exact scores → should NOT have any of those badges.
 *
 * Logged in as: Lider (checks own profile)
 */
import { test, expect } from '@playwright/test'
import path from 'path'
import { BADGES_LIDER } from './helpers/fixture'

const AUTH_LIDER  = path.join(import.meta.dirname, '../.auth/lider.json')
const AUTH_RIVAL  = path.join(import.meta.dirname, '../.auth/rival.json')

test.describe('Gamificación del Lider', () => {
  test.use({ storageState: AUTH_LIDER })

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile')
    // Wait for the page to load
    await page.waitForSelector('[class*="profile"], h1, [class*="badge"]', { timeout: 15_000 })
  })

  test('/profile del Lider muestra sección de logros', async ({ page }) => {
    // The gamification section should exist
    const gamSection = page
      .getByText(/logros|badges|🏅|racha|streak/i)
      .first()
    await expect(gamSection).toBeVisible({ timeout: 10_000 })
  })

  test('/profile del Lider muestra badge primer_exacto', async ({ page }) => {
    // Badge text or emoji — check by known label from BADGE_LABELS in types/index.ts
    const badge = page.getByText(/primer.*exacto|🎯|primero/i).first()
    await expect(badge).toBeVisible({ timeout: 10_000 })
  })

  test('/profile del Lider muestra badge racha_3_exactos', async ({ page }) => {
    const badge = page.getByText(/racha.*3|3.*exacto|🔥.*3|3.*🔥/i).first()
    await expect(badge).toBeVisible({ timeout: 10_000 })
  })

  test('/profile del Lider muestra streak actual mayor a 0', async ({ page }) => {
    // "Llevás X exactos seguidos" text
    const streak = page.getByText(/llevás.*exacto|exacto.*seguido|\d+.*exacto/i).first()
    await expect(streak).toBeVisible({ timeout: 10_000 })
    // Verify there's a number ≥ 1 in the streak text
    const text = await streak.textContent() ?? ''
    const nums = text.match(/\d+/)
    expect(nums).not.toBeNull()
    expect(parseInt(nums![0])).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Gamificación del Rival (sin exactos)', () => {
  test.use({ storageState: AUTH_RIVAL })

  test('/profile del Rival NO muestra badge primer_exacto', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForSelector('[class*="profile"], h1', { timeout: 15_000 })
    // Rival never scored exact — no badge
    const badge = page.getByText(/primer.*exacto|🎯/i)
    await expect(badge).not.toBeVisible({ timeout: 5_000 })
  })

  test('/profile del Rival NO muestra badge racha_3_exactos', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForSelector('[class*="profile"], h1', { timeout: 15_000 })
    const badge = page.getByText(/racha.*3.*exacto|3.*exacto.*seguido/i)
    await expect(badge).not.toBeVisible({ timeout: 5_000 })
  })
})
