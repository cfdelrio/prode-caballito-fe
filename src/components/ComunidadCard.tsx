import { Link } from 'react-router-dom'

interface Props {
  count: number | null
}

export function ComunidadCard({ count }: Props) {
  if (count === null) return null

  return (
    <div
      className="relative rounded-2xl overflow-hidden text-white p-5 shadow-lg"
      style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)' }}
    >
      {/* Silueta de ciudad — decorativo */}
      <div
        className="absolute bottom-0 right-0 w-40 h-full opacity-[0.07] pointer-events-none select-none"
        style={{
          backgroundImage: `url('/card-comunidad.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'right bottom',
        }}
      />

      <div className="relative flex items-center justify-between gap-4">
        {/* Contenido izquierdo */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">⚽</span>
            <span className="text-xs font-bold tracking-wide text-green-200">Prodecaballito</span>
          </div>

          <div className="leading-tight">
            <p className="text-sm font-semibold text-green-100">¡Ya somos</p>
            <p className="text-4xl font-black">{count} !!</p>
            <p className="text-sm font-semibold text-green-100">jugando..</p>
          </div>

          <p className="text-xs text-green-200/80 max-w-[200px]">
            Cada vez somos más vecinos construyendo comunidad.
          </p>

          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            👥 Sumate →
          </Link>
        </div>

        {/* Card flotante derecha */}
        <div className="relative shrink-0 mb-2">
          <div className="bg-white rounded-2xl px-4 py-5 shadow-xl flex items-center justify-center w-20 h-20">
            <span className="text-4xl">👥</span>
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-green-800 text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest">
            ★ JUGANDO
          </div>
        </div>
      </div>
    </div>
  )
}
