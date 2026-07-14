/**
 * Badge de estado de campaña/adset/ad (effective_status de Meta).
 * Verde solo para ACTIVE; pausas en gris neutro; problemas en rojo/ámbar.
 */
const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE: {
    label: "Activo",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  PAUSED: {
    label: "Pausado",
    cls: "border-gray-200 bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  CAMPAIGN_PAUSED: {
    label: "Pausado (campaña)",
    cls: "border-gray-200 bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  ADSET_PAUSED: {
    label: "Pausado (adset)",
    cls: "border-gray-200 bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  IN_PROCESS: {
    label: "En proceso",
    cls: "border-amber-200 bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  PENDING_REVIEW: {
    label: "En revisión",
    cls: "border-amber-200 bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  WITH_ISSUES: {
    label: "Con problemas",
    cls: "border-red-200 bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  DISAPPROVED: {
    label: "Rechazado",
    cls: "border-red-200 bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  ARCHIVED: {
    label: "Archivado",
    cls: "border-gray-200 bg-gray-100 text-gray-500",
    dot: "bg-gray-400",
  },
  DELETED: {
    label: "Eliminado",
    cls: "border-gray-200 bg-gray-100 text-gray-500",
    dot: "bg-gray-400",
  },
};

function fallback(status: string) {
  const label = status
    ? status.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())
    : "—";
  return {
    label,
    cls: "border-gray-200 bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  };
}

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? fallback(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-2 py-0.5 text-xs font-medium ${s.cls}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
