import { useState } from 'react'
import { api } from '@/api/client'
import { useToastStore } from '@/store/toastStore'

type VoiceEventType =
  | 'prode.voice_nuevo_lider'
  | 'prode.voice_match_reminder'
  | 'prode.voice_perfect_score'
  | 'prode.voice_weekly_summary'
  | 'prode.voice_trash_talk'
  | 'prode.voice_survey_campeon'

const EVENT_META: Record<VoiceEventType, { label: string; emoji: string; script: string; endpoint: string }> = {
  'prode.voice_nuevo_lider': {
    label: 'Nuevo líder',
    emoji: '🔥',
    script: 'ATENCIÓN... hay nuevo puntero. {nombre} llegó al top con {puntos} pts.',
    endpoint: '/admin/voice-campaigns/trigger',
  },
  'prode.voice_match_reminder': {
    label: 'Match reminder',
    emoji: '📣',
    script: 'En 30 min arranca {home} vs {away} y no cargaste tu resultado. Entrá ya.',
    endpoint: '/admin/voice-match-reminder-trigger',
  },
  'prode.voice_perfect_score': {
    label: 'Perfect score',
    emoji: '💥',
    script: '¡EXACTO! Adivinaste {home} {gl}-{gv} {away}. Sumaste 4 puntos. Sos un genio.',
    endpoint: '/admin/voice-campaigns/trigger',
  },
  'prode.voice_weekly_summary': {
    label: 'Weekly summary',
    emoji: '📊',
    script: 'Semana {N}. Líder: {nombre}. Mayor subida: {nombre2}. Tapado de la fecha: {nombre3}.',
    endpoint: '/admin/voice-campaigns/trigger',
  },
  'prode.voice_trash_talk': {
    label: 'Trash talk',
    emoji: '😄',
    script: '{rival} te pasó y ya empezó a hablar. Está en #{pos_rival}, vos en #{pos_mia}.',
    endpoint: '/admin/voice-campaigns/trigger',
  },
  'prode.voice_survey_campeon': {
    label: 'Survey campeón',
    emoji: '🏆',
    script: '¿Quién sale campeón del mundial? Presioná 1 Argentina, 2 Brasil, 3 otro.',
    endpoint: '/admin/voice-campeon-survey',
  },
}

export function CampaignBuilder() {
  const { show } = useToastStore()
  const [eventType, setEventType] = useState<VoiceEventType>('prode.voice_nuevo_lider')
  const [userIds, setUserIds] = useState('')
  const [dryRun, setDryRun] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const meta = EVENT_META[eventType]

  const handleFire = async () => {
    setLoading(true)
    setResult(null)
    try {
      const ids = userIds.split(',').map(s => s.trim()).filter(Boolean)
      const body: Record<string, unknown> = { dry_run: dryRun, event_type: eventType }
      if (ids.length > 0) body.user_ids = ids
      const { data } = await api.post(meta.endpoint, body)
      const summary = `${meta.label} ${dryRun ? '[dry-run]' : 'disparado'}: ${JSON.stringify(data?.data ?? data)}`
      setResult(summary)
      show(summary, 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al disparar'
      show(msg, 'error')
      setResult(`❌ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#001A4B]">🎙️ Disparar Campaña</h3>
        <p className="text-xs text-gray-400 mt-0.5">Envía un evento de voz vía Engage. Dry-run muestra preview sin llamar.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de evento</label>
        <select
          value={eventType}
          onChange={e => setEventType(e.target.value as VoiceEventType)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          {Object.entries(EVENT_META).map(([key, m]) => (
            <option key={key} value={key}>{m.emoji} {m.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Script preview:</p>
        <p className="text-xs text-gray-700 italic">"{meta.script}"</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">User IDs (opcional, CSV)</label>
        <input
          value={userIds}
          onChange={e => setUserIds(e.target.value)}
          placeholder="vacío = todos los usuarios elegibles"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} className="w-4 h-4" />
        <span>Dry-run (no llama, solo preview)</span>
      </label>

      <button
        onClick={handleFire}
        disabled={loading}
        className="bg-purple-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 w-full"
      >
        {loading ? 'Procesando...' : dryRun ? '🔍 Preview' : '📞 Disparar campaña'}
      </button>

      {result && (
        <pre className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs whitespace-pre-wrap break-all">{result}</pre>
      )}
    </div>
  )
}
