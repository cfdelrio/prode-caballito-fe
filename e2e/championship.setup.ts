/**
 * Championship auth setup — logs in lider, rival and virtual test users
 * and saves their browser storage state for use in championship specs.
 *
 * Runs before the championship project (via dependencies in playwright.config).
 * Assumes globalSetup has already created/verified the users.
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
    authFile: AUTH_LIDER,
  },
  {
    key:      'rival',
    email:    process.env.E2E_RIVAL_EMAIL   ?? 'e2e.rival@prode.test',
    password: process.env.E2E_RIVAL_PASS    ?? 'e2etest2026',
    authFile: AUTH_RIVAL,
  },
  {
    key:      'virtual',
    email:    process.env.E2E_VIRTUAL_EMAIL ?? 'e2e.virtual@prode.test',
    password: process.env.E2E_VIRTUAL_PASS  ?? 'e2etest2026',
    authFile: AUTH_VIRTUAL,
  },
]

for (const user of USERS) {
  setup(`authenticate ${user.key}`, async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/email/i).fill(user.email)
    await page.getByPlaceholder(/contraseña|password/i).fill(user.password)
    await page.getByRole('button', { name: /ingresar|entrar|login/i }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
    await page.context().storageState({ path: user.authFile })
  })
}
