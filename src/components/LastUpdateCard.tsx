import { Clock } from "lucide-react";
import type { LastUpdate } from "@/lib/dashboard/contract";
import { formatDateTime } from "@/lib/dashboard/formatters";

/** Tarjeta de "última actualización" con desglose por cuenta. */
export default function LastUpdateCard({
  lastUpdate,
}: {
  lastUpdate: LastUpdate | null;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-700">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Última actualización</span>
      </div>
      {!lastUpdate ? (
        <p className="mt-2 text-sm text-gray-400">No disponible</p>
      ) : (
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-900">
            {formatDateTime(lastUpdate.finished_at)}
          </p>
          <p className="text-xs text-gray-500">
            Por {lastUpdate.updated_by || "—"} · rango{" "}
            {lastUpdate.date_preset_or_range || "—"}
          </p>
          <ul className="mt-2 space-y-0.5">
            {lastUpdate.perAccount.map((a) => (
              <li key={a.account_group} className="text-xs text-gray-600">
                <span
                  className={
                    a.status === "ok" ? "text-green-600" : "text-red-600"
                  }
                >
                  ●
                </span>{" "}
                {a.label}: {a.status === "ok" ? `${a.campaigns_count} campañas` : a.error_message || "error"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
