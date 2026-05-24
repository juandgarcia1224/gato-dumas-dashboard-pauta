import { RefreshCw } from "lucide-react";

/**
 * Encabezado del dashboard. Diseño PROVISIONAL (Cloud Design lo reemplazará).
 */
export default function DashboardHeader({
  clientName,
  onRefresh,
  loading,
}: {
  clientName: string;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {clientName} — Centro de Seguimiento Digital
        </h1>
        <p className="text-sm text-gray-500">Pauta digital · Meta Ads</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          Diseño base · provisional
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar vista
        </button>
      </div>
    </header>
  );
}
