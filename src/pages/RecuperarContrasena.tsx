import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import { useToastStore } from '@/store/toastStore'

export function RecuperarContrasena() {
  const { show } = useToastStore()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [step, setStep] = useState<'email' | 'reset'>(token ? 'reset' : 'email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ password: '', confirmPassword: '' })

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      show('Se envió un email con instrucciones para recuperar tu contraseña', 'success')
      setEmail('')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al enviar email'
      show(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.password || !form.confirmPassword) return
    if (form.password !== form.confirmPassword) {
      show('Las contraseñas no coinciden', 'error')
      return
    }
    if (form.password.length < 6) {
      show('La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }
    if (!token) {
      show('Token inválido o expirado', 'error')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      show('Contraseña restablecida correctamente', 'success')
      setForm({ password: '', confirmPassword: '' })
      setStep('email')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al restablecer contraseña'
      show(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001A4B] to-[#0042A5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#001A4B] to-[#0042A5] px-8 py-6 text-center">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-white font-bold text-2xl">PRODE Caballito</h1>
          <p className="text-[#FFDF00] text-sm mt-1">Recuperar Contraseña</p>
        </div>

        <div className="p-8 space-y-4">
          {step === 'email' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <p className="text-gray-600 text-sm">
                Ingresa tu email y te enviaremos instrucciones para recuperar tu contraseña.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0042A5] text-sm"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0042A5] text-white font-bold py-3 rounded-xl hover:bg-[#003080] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar Instrucciones'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-gray-600 text-sm">
                Ingresa tu nueva contraseña.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0042A5] text-sm"
                  placeholder="••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0042A5] text-sm"
                  placeholder="••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0042A5] text-white font-bold py-3 rounded-xl hover:bg-[#003080] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link to="/login" className="text-[#0042A5] font-semibold hover:underline">
              Volver al login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
