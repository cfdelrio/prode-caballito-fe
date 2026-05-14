import { useState, useEffect } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useToastStore } from '@/store/toastStore'

const STORAGE_KEY = 'push_banner_dismissed_count'
const MAX_SHOWS = 3

/**
 * Dismissible CTA to enable browser push notifications. Hides itself when:
 *  - Browser doesn't support push
 *  - User already denied at the browser level (can't re-prompt anyway)
 *  - User already subscribed
 *  - User dismissed it 3 times already
 *
 * Mount it where it's contextually relevant (e.g. once the user has at least
 * one bet, so they understand the value of getting notified).
 */
export function PushOptInBanner() {
  const push = usePushNotifications()
  const { show } = useToastStore()
  const [dismissed, setDismissed] = useState(false)
  const [tooManyDismissals, setTooManyDismissals] = useState(false)

  useEffect(() => {
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
    if (count >= MAX_SHOWS) setTooManyDismissals(true)
  }, [])

  if (push.state !== 'unsubscribed') return null
  if (dismissed || tooManyDismissals) return null

  const handleDismiss = () => {
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) + 1
    localStorage.setItem(STORAGE_KEY, String(count))
    setDismissed(true)
  }

  const handleActivate = async () => {
    // Track analytics
    window.gtag?.('event', 'push_banner_activate_click')
    await push.subscribe()
    if (push.state === 'denied') {
      show('Bloqueaste las notificaciones — habilítalas desde la configuración del navegador', 'error')
      window.gtag?.('event', 'push_notification_denied')
    } else {
      show('Notificaciones activadas ✓', 'success')
      window.gtag?.('event', 'push_notification_enabled')
    }
  }

  const handleDismissWithTracking = () => {
    window.gtag?.('event', 'push_banner_dismiss')
    handleDismiss()
  }

  return (
    <div
      data-testid="push-optin-banner"
      className="relative rounded-2xl p-5 mb-4 overflow-hidden glow-card"
      style={{
        background: 'linear-gradient(135deg, #0042A5 0%, #003087 50%, #001A4B 100%)',
        animation: 'slideUp 0.6s ease-out, glow 4s ease-in-out infinite',
        boxShadow: '0 0 30px rgba(0, 66, 165, 0.3), 0 8px 16px rgba(0, 26, 75, 0.2)',
      }}
    >
      <button
        onClick={handleDismissWithTracking}
        aria-label="Descartar"
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors"
      >
        ✕
      </button>
      <div className="flex items-start gap-3.5 pr-6">
        <div className="text-3xl shrink-0">⏰</div>
        <div className="flex-1">
          <h3 className="font-black text-white text-sm leading-tight">
            Recibí recordatorios antes del cierre
          </h3>
          <p className="text-white/75 text-xs leading-relaxed mt-1.5">
            Activá notificaciones y no te pierdas ningún partido. Te avisamos 30 minutos antes de que cierre cada apuesta.
          </p>
          <button
            onClick={handleActivate}
            disabled={push.loading}
            className="mt-3 font-black text-xs px-5 py-2.5 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-lg"
            style={{ background: '#FFDF00', color: '#001A4B' }}
          >
            {push.loading ? 'Activando…' : '✓ Activar notificaciones'}
          </button>
        </div>
      </div>
    </div>
  )
}
