import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useToastStore } from '@/store/toastStore'

type Step = 'email' | 'code'

export function ForgotPassword() {
  const navigate = useNavigate()
  const { show } = useToastStore()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      show('Te enviamos un código a tu email', 'success')
      setStep('code')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al enviar el código'
      show(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, code, newPassword })
      show('Contraseña actualizada. Ya podés iniciar sesión.', 'success')
      navigate('/login')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al restablecer la contraseña'
      show(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001A4B] to-[#0042A5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#001A4B] to-[#0042A5] px-8 py-6 text-center">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-white font-bold text-2xl">PRODE Caballito</h1>
          <p className="text-[#FFDF00] text-sm mt-1">Restablecer contraseña</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleRequestCode} className="p-8 space-y-4">
            <p className="text-sm text-gray-600">Ingresá tu email y te mandamos un código para restablecer tu contraseña.</p>
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
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-[#0042A5] hover:underline">Volver al login</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="p-8 space-y-4">
            <p className="text-sm text-gray-600">Revisá tu email e ingresá el código de 6 dígitos.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0042A5] text-sm text-center tracking-widest text-lg font-bold"
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0042A5] text-sm"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0042A5] text-white font-bold py-3 rounded-xl hover:bg-[#003080] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
            <p className="text-center text-sm text-gray-500">
              <button type="button" onClick={() => setStep('email')} className="text-[#0042A5] hover:underline">
                Reenviar código
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
