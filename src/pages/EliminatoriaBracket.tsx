import { useEffect, useState, useCallback } from 'react'
import { api } from '@/api/client'
import { useT } from '@/hooks/useT'
import { MatchCard } from '@/components/match/MatchCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkMatchCard } from '@/components/ui/Skeleton'
import type { Match, Bet, Tournament } from '@/types'

interface Props {
  planillaId: string
  planillaLocked: boolean
  tournament: Tournament
  now: number
}

export function EliminatoriaBracket({ planillaId, planillaLocked, tournament, now }: Props) {
  const t = useT()
  const [matches, setMatches] = useState<Match[]>([])
  const [bets, setBets] = useState<Record<string, Bet>>({})
  const [loading, setLoading] = useState(true)

  const loadBets = useCallback(async (pid: string) => {
    if (!pid) return
    const { data } = await api.get(`/bets/planillas/${pid}/bets?t=${Date.now()}`)
    const bMap: Record<string, Bet> = {}
    for (const b of (data.data || [])) bMap[b.match_id] = b
    setBets(bMap)
  }, [])

  useEffect(() => {
    setLoading(true)
    setBets({})
    api.get(`/matches?limit=200&tournament_id=${tournament.id}`)
      .then(({ data }) => setMatches(data.data.matches || []))
      .finally(() => setLoading(false))
  }, [tournament.id])

  useEffect(() => {
    loadBets(planillaId).catch(() => {})
  }, [planillaId, loadBets])

  const handleBetSaved = (bet: Bet) => setBets(prev => ({ ...prev, [bet.match_id]: bet }))
  const handleBetDeleted = (matchId: string) => {
    setBets(prev => { const n = { ...prev }; delete n[matchId]; return n })
  }

  // Group matches by jornada, sort chronologically within each round
  const rounds: [number, Match[]][] = []
  const byJornada = new Map<number, Match[]>()
  for (const m of matches) {
    const j = m.jornada ?? 0
    if (!byJornada.has(j)) byJornada.set(j, [])
    byJornada.get(j)!.push(m)
  }
  for (const [j, ms] of [...byJornada.entries()].sort(([a], [b]) => a - b)) {
    rounds.push([j, ms.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())])
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map(i => <SkMatchCard key={i} />)}
      </div>
    )
  }

  if (matches.length === 0) {
    return <EmptyState icon="⚡" message={t.eliminatoria.noMatches} />
  }

  if (!planillaId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium text-center">
        {t.eliminatoria.selectPlanilla}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {rounds.map(([jornada, roundMatches]) => {
        const openCount = roundMatches.filter(m => new Date(m.time_cutoff).getTime() > now).length
        return (
          <div key={jornada}>
            {/* Round header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#001A4B]/20 to-[#001A4B]/40" />
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-[#001A4B]">
                  {t.eliminatoria.round(jornada)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {t.eliminatoria.matchCount(roundMatches.length, openCount)}
                </p>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#001A4B]/20 to-[#001A4B]/40" />
            </div>

            {/* Match cards */}
            <div className="space-y-3">
              {roundMatches.map(m => (
                <MatchCard
                  key={m.id}
                  match={m}
                  bet={bets[m.id]}
                  planillaId={planillaId}
                  onBetSaved={handleBetSaved}
                  onBetDeleted={handleBetDeleted}
                  planillaLocked={planillaLocked}
                  now={now}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
