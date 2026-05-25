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
    email:    process.env.E2E_LIDER_EMAIL?.trim()   || 'cfdelrio+lider@gmail.com',
    password: process.env.E2E_LIDER_PASS?.trim()    || 'carlitos',
    nombre:   'E2E Lider',
    authFile: AUTH_LIDER,
  },
  {
    key:      'rival',
    email:    process.env.E2E_RIVAL_EMAIL?.trim()   || 'cfdelrio+rival@gmail.com',
    password: process.env.E2E_RIVAL_PASS?.trim()    || 'carlitos',
    nombre:   'E2E Rival',
    authFile: AUTH_RIVAL,
  },
  {
    key:      'virtual',
    email:    process.env.E2E_VIRTUAL_EMAIL?.trim() || 'cfdelrio+virtual@gmail.com',
    password: process.env.E2E_VIRTUAL_PASS?.trim()  || 'carlitos',
    nombre:   'E2E Virtual',
    authFile: AUTH_VIRTUAL,
  },
]

interface AuthData {
  token: string
  refreshToken: string
  user: Record<string, unknown>
}

interface LoginResult {
  data: AuthData | null
  error: string
}

async function loginViaAPI(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  if (body.success && body.data?.token) return { data: body.data, error: '' }
  return { data: null, error: body.error || JSON.stringify(body) }
}

async function loginOrRegisterViaAPI(
  email: string,
  password: string,
  nombre: string,
): Promise<AuthData> {
  // Try login first
  const first = await loginViaAPI(email, password)
  if (first.data) return first.data
  console.log(`  Login failed for ${email}: ${first.error}`)

  // If rate-limited on login, wait and retry before trying register
  if (first.error.includes('Demasiados')) {
    console.log(`  Rate limited — waiting 60s...`)
    await new Promise(r => setTimeout(r, 60_000))
    const retry = await loginViaAPI(email, password)
    if (retry.data) return retry.data
    console.log(`  Retry after 60s failed: ${retry.error}`)
  }

  // Try register
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nombre }),
  })
  const regData = await regRes.json()
  if (regData.success && regData.data?.token) {
    console.log(`  ✓ Registered new test user: ${email}`)
    return regData.data
  }
  console.log(`  Register failed for ${email}: ${regData.error}`)

  // User already exists but login failed → likely rate-limited; retry with backoff
  const backoff = [10_000, 20_000, 30_000, 60_000]
  for (const delay of backoff) {
    console.log(`  Waiting ${delay / 1000}s before login retry...`)
    await new Promise(r => setTimeout(r, delay))
    const retry = await loginViaAPI(email, password)
    if (retry.data) {
      console.log(`  ✓ Login succeeded after ${delay / 1000}s wait`)
      return retry.data
    }
    console.log(`  Still failing: ${retry.error}`)
  }

  throw new Error(
    `Could not authenticate ${email}. ` +
    `Login: ${first.error} | Register: ${regData.error}`,
  )
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

    // Delay between users to avoid rate limiting
    await new Promise(r => setTimeout(r, 2_000))
  })
}
