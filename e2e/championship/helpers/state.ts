/**
 * Shared state between championship specs.
 * Written by globalSetup, read by all specs and globalTeardown.
 * Stored at e2e/.champ-state.json (gitignored).
 */
import fs   from 'fs'
import path from 'path'

export interface ChampState {
  tournamentId:  string
  matchIds:      Record<string, string>  // mA, mB, mC, mD, mCutoff → UUID
  planillaIds:   Record<string, string>  // lider, rival, virtual → UUID
  userIds:       Record<string, string>  // lider, rival, virtual → UUID
}

const STATE_FILE = path.join(import.meta.dirname, '../../.champ-state.json')

export function readState(): ChampState {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`Championship state file not found at ${STATE_FILE}. Run globalSetup first.`)
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
}

export function writeState(partial: Partial<ChampState>): void {
  const current = fs.existsSync(STATE_FILE)
    ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
    : {}
  const merged = { ...current, ...partial }
  fs.writeFileSync(STATE_FILE, JSON.stringify(merged, null, 2))
}

export function deleteState(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE)
  }
}
