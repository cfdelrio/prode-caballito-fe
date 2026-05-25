/**
 * Championship auth setup — logs in lider, rival and virtual test users
 * and saves their browser storage state for use in championship specs.
 *
 * Runs before the championship project (via dependencies in playwright.config).
 * If users don't exist, registers them first (since globalSetup runs after this).
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'

export const AUTH_LIDER   = path.join(import.meta.dirname, '.auth/lider.json')
export const AUTH_RIVAL   = path.join(import.meta.dirname, '.auth/rival.json')
export const AUTH_VIRTUAL = path.join(import.meta.dirname, '.auth/virtual.json')

const USERS = [
  {
    key:      'lider',
    email:    process.env.E2E_LIDER_EMAIL   ?? 'e2e.lider@prode.test',
    password: process.env.E2E_LIDER_PASS    ?? 'e2etest2026',
    nombre:   'E2E Lider',
    authFile: AUTH_LIDER,
  },
  {
    key:      'rival',
    email:    process.env.E2E_RIVAL_EMAIL   ?? 'e2e.rival@prode.test',
    password: process.env.E2E_RIVAL_PASS    ?? 'e2etest2026',
    nombre:   'E2E Rival',
    authFile: AUTH_RIVAL,
  },
  {
    key:      'virtual',
    email:    process.env.E2E_VIRTUAL_EMAIL ?? 'e2e.virtual@prode.test',
    password: process.env.E2E_VIRTUAL_PASS  ?? 'e2etest2026',
    nombre:   'E2E Virtual',
    authFile: AUTH_VIRTUAL,
  },
]

for (const user of USERS) {
  setup(`authenticate ${user.key}`, async ({ page }) => {
    // Try to login; if it fails with 401, register first then login
    let loginFailed = false

    await page.goto('/login')
    await page.waitForSelector('input[type="email"]', { timeout: 10_000 })

    // First attempt: login with existing credentials
    await page.fill('input[type="email"]', user.email)
    await page.fill('input[type="password"]', user.password)

    // Listen for any error messages before clicking
    let errorMsg = ''
    page.on('console', (msg) => {
      if (msg.type() === 'error') errorMsg = msg.text()
    })

    await page.click('button[type="submit"]')

    // Check if login succeeded or we're still on login page
    const stillOnLogin = await page.url().includes('/login')

    if (stillOnLogin) {
      // Likely 401: user doesn't exist. Register instead.
      console.log(`  ⚠️  Login failed for ${user.email} — registering...`)
      await page.goto('/register')
      await page.waitForSelector('input[type="email"]', { timeout: 10_000 })

      // Fill registration form
      await page.fill('input[name="nombre"], input[placeholder*="nombre" i]', user.nombre)
      await page.fill('input[type="email"]', user.email)
      await page.fill('input[type="password"]', user.password)

      // Submit registration
      await page.click('button[type="submit"]')

      // After registration, should be on login or redirected to home
      // Try to reach home via login
      await page.waitForURL(/\/(login|home|apuestas)?/, { timeout: 10_000 })

      if (await page.url().includes('/login')) {
        // Login form appeared after registration — fill and submit
        await page.fill('input[type="email"]', user.email)
        await page.fill('input[type="password"]', user.password)
        await page.click('button[type="submit"]')
      }
    }

    // Wait until we're NOT on login page
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })
    await page.context().storageState({ path: user.authFile })
  })
}
