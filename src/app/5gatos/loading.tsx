/** Skeleton de carga de /5gatos (mientras el servidor consulta Meta). */

function Block({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-neutral-200/70 ${className}`} />
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f6f4f0]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b-2 border-neutral-300 pb-5">
          <div className="flex items-center gap-4">
            <Block className="h-12 w-12 !rounded-full" />
            <div className="space-y-2">
              <Block className="h-7 w-64" />
              <Block className="h-4 w-40" />
            </div>
          </div>
          <Block className="h-10 w-44" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Block className="h-32" />
          <Block className="h-32" />
          <Block className="h-32" />
          <Block className="h-32" />
        </div>
        <div className="mt-12 space-y-3">
          <Block className="h-7 w-56" />
          <Block className="h-64 w-full" />
        </div>
        <div className="mt-12 space-y-3">
          <Block className="h-7 w-56" />
          <Block className="h-64 w-full" />
        </div>
        <p className="mt-10 text-center text-sm text-neutral-400">
          Cargando datos de pauta…
        </p>
      </div>
    </div>
  );
}
