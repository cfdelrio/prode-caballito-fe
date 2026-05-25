/**
 * Championship auth setup — ensures test users exist (via API) then logs in
 * via browser and saves storage state for use in championship specs.
 *
 * Order matters: this project (championship-auth) runs BEFORE globalSetup
 * of the championship project. So we must create users here, not rely on
 * globalSetup to do it.
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'

export const AUTH_LIDER   = path.join(import.meta.dirname, '.auth/lider.json')
export const AUTH_RIVAL   = path.join(import.meta.dirname, '.auth/rival.json')
export const AUTH_VIRTUAL = path.join(import.meta.dirname, '.auth/virtual.json')

const API_BASE =
  process.env.API_BASE?.trim() ||
  'https://t49euho172.execute-api.us-east-1.amazonaws.com/prod/api'

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

async function ensureUserExists(email: string, password: string, nombre: string) {
  // Try login first
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginData = await loginRes.json()
  if (loginData.success) return // user already exists

  // Register if login failed
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nombre }),
  })
  const regData = await regRes.json()
  if (!regData.success) {
    throw new Error(`Could not create user ${email}: ${JSON.stringify(regData)}`)
  }
  console.log(`  ✓ Registered new test user: ${email}`)
}

for (const user of USERS) {
  setup(`authenticate ${user.key}`, async ({ page }) => {
    // 1. Ensure user exists in DB (API — no browser needed)
    await ensureUserExists(user.email, user.password, user.nombre)

    // 2. Browser login to capture full auth state (cookies + localStorage)
    await page.goto('/login')
    await page.waitForSelector('input[type="email"]', { timeout: 10_000 })
    await page.fill('input[type="email"]', user.email)
    await page.fill('input[type="password"]', user.password)
    await page.click('button[type="submit"]')

    // 3. Wait until redirected away from login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })

    // 4. Navigate to /apuestas to confirm auth is fully active in localStorage
    await page.goto('/apuestas')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    // 5. Save auth state from /apuestas so specs start fully authenticated
    await page.context().storageState({ path: user.authFile })
  })
}
