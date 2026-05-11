import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const { get, post, showMock } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  showMock: vi.fn(),
}))
vi.mock('@/api/client', () => ({ api: { get, post } }))
vi.mock('@/store/toastStore', () => ({
  useToastStore: () => ({ show: showMock, addToast: vi.fn() }),
}))

import { BackupsTab } from '@/pages/admin/BackupsTab'

beforeEach(() => {
  vi.clearAllMocks()
  get.mockImplementation((url: string) => {
    if (url === '/admin/backups') {
      return Promise.resolve({
        data: { data: [
          { key: 'db/manual/2026-05-11_07-00-00.sql.gz', size: 2048, last_modified: '2026-05-11T07:00:00Z', trigger: 'manual' },
          { key: 'db/scheduled/2026-05-10_07-00-00.sql.gz', size: 1024, last_modified: '2026-05-10T07:00:00Z', trigger: 'scheduled' },
        ] },
      })
    }
    if (url === '/admin/backups/snapshots') {
      return Promise.resolve({
        data: { data: [
          { snapshot_id: 'prode-db-manual-1', type: 'manual', status: 'available',
            created_at: '2026-05-11T07:00:00Z', size_gb: 20, engine: 'postgres' },
        ] },
      })
    }
    if (url === '/admin/backups/download') {
      return Promise.resolve({ data: { data: { url: 'https://signed/url', expires_in: 300 } } })
    }
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
  post.mockResolvedValue({ data: { data: {} } })
})

describe('BackupsTab', () => {
  it('lista dumps y snapshots tras cargar', async () => {
    render(<BackupsTab />)
    await waitFor(() => expect(screen.getByLabelText('Lista de backups')).toBeInTheDocument())
    expect(screen.getByLabelText('Lista de snapshots RDS')).toBeInTheDocument()
    expect(screen.getAllByText('manual').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('scheduled')).toBeInTheDocument()
    expect(screen.getByText('prode-db-manual-1')).toBeInTheDocument()
  })

  it('crear backup llama a POST /admin/backups y refresca', async () => {
    render(<BackupsTab />)
    await waitFor(() => screen.getByText('Crear backup'))
    fireEvent.click(screen.getByText('Crear backup'))
    await waitFor(() => expect(post).toHaveBeenCalledWith('/admin/backups'))
    expect(showMock).toHaveBeenCalledWith('Backup creado ✓', 'success')
    // refrescó: hubo al menos 2 llamadas iniciales + 2 al refrescar
    expect(get).toHaveBeenCalledWith('/admin/backups')
  })

  it('crear snapshot llama a POST /admin/backups/snapshots', async () => {
    render(<BackupsTab />)
    await waitFor(() => screen.getByText('Crear snapshot'))
    fireEvent.click(screen.getByText('Crear snapshot'))
    await waitFor(() => expect(post).toHaveBeenCalledWith('/admin/backups/snapshots'))
    expect(showMock).toHaveBeenCalledWith('Snapshot RDS iniciado ✓', 'success')
  })

  it('descargar usa link presignado', async () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)
    render(<BackupsTab />)
    await waitFor(() => screen.getAllByText('Descargar'))
    fireEvent.click(screen.getAllByText('Descargar')[0])
    await waitFor(() => expect(get).toHaveBeenCalledWith('/admin/backups/download', expect.any(Object)))
    expect(open).toHaveBeenCalledWith('https://signed/url', '_blank', 'noopener')
  })

  it('muestra toast en error de carga', async () => {
    get.mockReset()
    get.mockRejectedValue(new Error('boom'))
    render(<BackupsTab />)
    await waitFor(() => expect(showMock).toHaveBeenCalled())
    expect(showMock).toHaveBeenCalledWith(expect.stringContaining('Error'), 'error')
  })
})
