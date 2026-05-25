/**
 * Championship auth setup — creates test users via API (if needed) and
 * injects their JWT tokens directly into localStorage. No browser login.
 *
 * This avoids rate limiting from multiple login attempts and is ~5x faster.
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
    email:    process.env.E2E_LIDER_EMAIL?.trim()   || 'cfdelrio.e2e.lider@gmail.com',
    password: process.env.E2E_LIDER_PASS?.trim()    || 'e2etest2026',
    nombre:   'E2E Lider',
    authFile: AUTH_LIDER,
  },
  {
    key:      'rival',
    email:    process.env.E2E_RIVAL_EMAIL?.trim()   || 'cfdelrio.e2e.rival@gmail.com',
    password: process.env.E2E_RIVAL_PASS?.trim()    || 'e2etest2026',
    nombre:   'E2E Rival',
    authFile: AUTH_RIVAL,
  },
  {
    key:      'virtual',
    email:    process.env.E2E_VIRTUAL_EMAIL?.trim() || 'cfdelrio.e2e.virtual@gmail.com',
    password: process.env.E2E_VIRTUAL_PASS?.trim()  || 'e2etest2026',
    nombre:   'E2E Virtual',
    authFile: AUTH_VIRTUAL,
  },
]

interface AuthData {
  token: string
  refreshToken: string
  user: Record<string, unknown>
}

async function loginOrRegisterViaAPI(
  email: string,
  password: string,
  nombre: string,
): Promise<AuthData> {
  // Try login first
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginData = await loginRes.json()
  if (loginData.success && loginData.data?.token) {
    return loginData.data
  }

  // Register if login failed
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nombre }),
  })
  const regData = await regRes.json()
  if (!regData.success || !regData.data?.token) {
    throw new Error(`Could not create user ${email}: ${JSON.stringify(regData)}`)
  }
  console.log(`  ✓ Registered new test user: ${email}`)
  return regData.data
}

for (const user of USERS) {
  setup(`authenticate ${user.key}`, async ({ page }) => {
    // 1. Get auth data from API (login or register)
    const authData = await loginOrRegisterViaAPI(user.email, user.password, user.nombre)

    // 2. Navigate to the app domain so we can write to its localStorage
    await page.goto('/')

    // 3. Inject auth tokens directly into localStorage (same keys as authStore.ts)
    await page.evaluate((data) => {
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
    }, authData)

    // 4. Verify auth works — navigate to /apuestas and confirm we're NOT redirected to /login
    await page.goto('/apuestas')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    // 5. Save storageState for use in championship specs
    await page.context().storageState({ path: user.authFile })

    // Small delay to avoid rate limiting between users
    await new Promise(r => setTimeout(r, 1000))
  })
}
