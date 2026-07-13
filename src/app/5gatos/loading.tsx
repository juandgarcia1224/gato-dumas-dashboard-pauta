/** Skeleton de carga de /5gatos (mientras el servidor consulta Meta). */

import { labFontVars } from "@/lib/fivegatos/fonts";

function Block({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-sm bg-lab-coconut ${className}`} />
  );
}

export default function Loading() {
  return (
    <div className={`lab ${labFontVars} min-h-screen`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-lab-rule-strong pb-6">
          <div className="flex items-center gap-4">
            <Block className="h-14 w-14" />
            <div className="space-y-2">
              <Block className="h-3 w-36" />
              <Block className="h-9 w-64" />
              <Block className="h-4 w-40" />
            </div>
          </div>
          <Block className="h-10 w-44" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
          <Block className="h-32 !rounded-none" />
          <Block className="h-32 !rounded-none" />
          <Block className="h-32 !rounded-none" />
          <Block className="h-32 !rounded-none" />
        </div>
        <div className="mt-12 space-y-3">
          <Block className="h-7 w-56" />
          <Block className="h-64 w-full" />
        </div>
        <div className="mt-12 space-y-3">
          <Block className="h-7 w-56" />
          <Block className="h-64 w-full" />
        </div>
        <p className="lab-mono mt-10 text-center text-[11px] uppercase tracking-[0.18em] text-lab-faint">
          Cargando datos de pauta…
        </p>
      </div>
    </div>
  );
}
