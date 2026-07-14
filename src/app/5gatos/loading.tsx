/** Skeleton de carga de /5gatos (mientras el servidor consulta Meta). */

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[6px] bg-gray-200 ${className}`} />;
}

export default function Loading() {
  return (
    <div className="fg-admin min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3.5">
            <Block className="h-10 w-10 !rounded-[8px]" />
            <div className="space-y-2">
              <Block className="h-7 w-44" />
              <Block className="h-4 w-64" />
            </div>
          </div>
          <Block className="h-10 w-40" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Block className="h-28" />
          <Block className="h-28" />
          <Block className="h-28" />
          <Block className="h-28" />
        </div>
        <div className="mt-10 space-y-3">
          <Block className="h-6 w-40" />
          <Block className="h-72 w-full" />
        </div>
        <p className="mt-10 text-center text-xs text-gray-400">
          Cargando datos de pauta…
        </p>
      </div>
    </div>
  );
}
