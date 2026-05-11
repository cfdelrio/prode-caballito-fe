import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { es as dfEs } from 'date-fns/locale'
import { api } from '@/api/client'
import { Spinner } from '@/components/ui/Spinner'
import { useToastStore } from '@/store/toastStore'

type BackupItem = {
  key: string
  size: number
  last_modified: string
  trigger: string
}

type SnapshotItem = {
  snapshot_id: string
  type: 'manual' | 'automated'
  status: string
  created_at: string
  size_gb: number
  engine: string
}

const fmtSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(u.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`
}

const fmtDate = (iso: string) =>
  format(new Date(iso), 'd MMM yyyy HH:mm', { locale: dfEs })

export function BackupsTab() {
  const { show } = useToastStore()
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [snapshotting, setSnapshotting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, sRes] = await Promise.allSettled([
        api.get('/admin/backups'),
        api.get('/admin/backups/snapshots'),
      ])
      if (bRes.status === 'fulfilled') setBackups(bRes.value.data.data || [])
      else show('Error al cargar backups', 'error')
      if (sRes.status === 'fulfilled') setSnapshots(sRes.value.data.data || [])
      else show('Error al cargar snapshots', 'error')
    } finally {
      setLoading(false)
    }
  }, [show])

  useEffect(() => { load() }, [load])

  const createDump = async () => {
    setCreating(true)
    try {
      await api.post('/admin/backups')
      show('Backup creado ✓', 'success')
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al crear backup'
      show(msg, 'error')
    } finally {
      setCreating(false)
    }
  }

  const createSnapshot = async () => {
    setSnapshotting(true)
    try {
      await api.post('/admin/backups/snapshots')
      show('Snapshot RDS iniciado ✓', 'success')
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al crear snapshot'
      show(msg, 'error')
    } finally {
      setSnapshotting(false)
    }
  }

  const download = async (key: string) => {
    try {
      const res = await api.get('/admin/backups/download', { params: { key } })
      const url = res.data.data.url
      window.open(url, '_blank', 'noopener')
    } catch {
      show('Error al generar link de descarga', 'error')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Spinner /></div>
  }

  return (
    <div className="space-y-6">
      {/* App-level dumps */}
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#001A4B]">💾 Dumps de base de datos</h2>
          <button
            onClick={createDump}
            disabled={creating}
            className="px-3 py-1.5 bg-[#0042A5] text-white text-sm font-medium rounded-lg hover:bg-[#003080] disabled:opacity-50">
            {creating ? 'Creando...' : 'Crear backup'}
          </button>
        </div>
        {backups.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">Todavía no hay backups.</p>
        ) : (
          <table className="w-full text-sm" aria-label="Lista de backups">
            <thead className="text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="text-left py-2">Fecha</th>
                <th className="text-left py-2">Origen</th>
                <th className="text-right py-2">Tamaño</th>
                <th className="text-right py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.key} className="border-b last:border-0">
                  <td className="py-2">{fmtDate(b.last_modified)}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${b.trigger === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {b.trigger}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{fmtSize(b.size)}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => download(b.key)}
                      className="text-blue-600 hover:underline text-xs">
                      Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Dumps SQL comprimidos (gzip), generados a diario a las 04:00 ART. Retención: 30 días en S3, luego Glacier, expira a los 365 días.
        </p>
      </section>

      {/* RDS snapshots */}
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#001A4B]">🗄 Snapshots RDS</h2>
          <button
            onClick={createSnapshot}
            disabled={snapshotting}
            className="px-3 py-1.5 bg-[#0042A5] text-white text-sm font-medium rounded-lg hover:bg-[#003080] disabled:opacity-50">
            {snapshotting ? 'Disparando...' : 'Crear snapshot'}
          </button>
        </div>
        {snapshots.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No hay snapshots disponibles.</p>
        ) : (
          <table className="w-full text-sm" aria-label="Lista de snapshots RDS">
            <thead className="text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Creado</th>
                <th className="text-right py-2">GB</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.snapshot_id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{s.snapshot_id}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${s.type === 'manual' ? 'bg-gray-100' : 'bg-blue-100 text-blue-700'}`}>
                      {s.type}
                    </span>
                  </td>
                  <td className="py-2">{s.status}</td>
                  <td className="py-2">{fmtDate(s.created_at)}</td>
                  <td className="py-2 text-right tabular-nums">{s.size_gb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Snapshots nativos de AWS RDS. Los automáticos se retienen 14 días; los manuales no expiran.
        </p>
      </section>
    </div>
  )
}
