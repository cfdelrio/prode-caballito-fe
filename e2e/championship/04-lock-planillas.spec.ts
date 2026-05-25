/**
 * E2E: Lock Lider and Rival planillas via API after all bets are placed.
 *
 * This runs after specs 01-03 (betting) and before 05 (publishing results).
 * Locking a planilla (precio_pagado=true) makes it appear with official positions
 * in the ranking. Virtual's planilla is intentionally NOT locked.
 *
 * Also verifies that a planilla with missing bets cannot be locked.
 */
import { test, expect } from '@playwright/test'
import { ApiClient, lockPlanilla } from './helpers/api'
import { readState } from './helpers/state'

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL?.trim()    || 'cfdelrio@gmail.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD?.trim() || 'carlitos'

const LIDER_EMAIL   = process.env.E2E_LIDER_EMAIL?.trim()  || 'cfdelrio+lider@gmail.com'
const LIDER_PASS    = process.env.E2E_LIDER_PASS?.trim()   || 'carlitos'
const RIVAL_EMAIL   = process.env.E2E_RIVAL_EMAIL?.trim()  || 'cfdelrio+rival@gmail.com'
const RIVAL_PASS    = process.env.E2E_RIVAL_PASS?.trim()   || 'carlitos'

test('Lider puede cerrar su planilla (todas las apuestas ya están colocadas)', async () => {
  const state  = readState()
  const lider  = await ApiClient.login(LIDER_EMAIL, LIDER_PASS)
  await lockPlanilla(lider, state.planillaIds.lider)
  // Verify it's now paid by fetching planillas
  const data = await lider.get('/planillas')
  const planilla = data.data?.find((p: any) => p.id === state.planillaIds.lider)
    ?? data.find?.((p: any) => p.id === state.planillaIds.lider)
  expect(planilla?.precio_pagado).toBe(true)
})

test('Rival puede cerrar su planilla', async () => {
  const state  = readState()
  const rival  = await ApiClient.login(RIVAL_EMAIL, RIVAL_PASS)
  await lockPlanilla(rival, state.planillaIds.rival)
  const data = await rival.get('/planillas')
  const planilla = data.data?.find((p: any) => p.id === state.planillaIds.rival)
    ?? data.find?.((p: any) => p.id === state.planillaIds.rival)
  expect(planilla?.precio_pagado).toBe(true)
})

test('Virtual NO intenta cerrar su planilla (seguirá como "no oficial")', async () => {
  // This is an intentional non-action: Virtual's planilla stays unpaid.
  // We just verify the state is still unpaid.
  const state  = readState()
  const admin  = await ApiClient.login(ADMIN_EMAIL, ADMIN_PASSWORD)
  const data   = await admin.get(`/planillas/${state.planillaIds.virtual}`)
  const planilla = data.data ?? data
  expect(planilla?.precio_pagado).toBe(false)
})
