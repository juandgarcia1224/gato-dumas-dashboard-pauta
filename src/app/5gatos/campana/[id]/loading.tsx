/** Skeleton de carga del detalle de campaña. */

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[6px] bg-gray-200 ${className}`} />;
}

export default function Loading() {
  return (
    <div className="fg-admin min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Block className="h-5 w-72" />
        <div className="mt-6 space-y-2 border-b border-gray-200 pb-5">
          <Block className="h-4 w-40" />
          <Block className="h-8 w-96 max-w-full" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Block className="h-28" />
          <Block className="h-28" />
          <Block className="h-28" />
          <Block className="h-28" />
        </div>
        <div className="mt-8 space-y-3">
          <Block className="h-6 w-32" />
          <Block className="h-72 w-full" />
        </div>
      </div>
    </div>
  );
}
