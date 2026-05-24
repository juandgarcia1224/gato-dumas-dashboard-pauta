import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import type { AlertView, Notice } from "@/lib/dashboard/contract";
import { getAccountGroup } from "@/lib/config/clients";

const LEVEL_STYLE: Record<string, { box: string; icon: React.ReactNode }> = {
  critical: {
    box: "border-red-200 bg-red-50 text-red-800",
    icon: <OctagonAlert className="h-4 w-4 text-red-600" />,
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-800",
    icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  },
  info: {
    box: "border-blue-200 bg-blue-50 text-blue-800",
    icon: <Info className="h-4 w-4 text-blue-600" />,
  },
};

function levelStyle(level: string) {
  return LEVEL_STYLE[level] ?? LEVEL_STYLE.info;
}

/** Panel de alertas operativas + avisos de estado/configuración (notices). */
export default function AlertsPanel({
  alerts,
  notices,
}: {
  alerts: AlertView[];
  notices: Notice[];
}) {
  const ordered = [...alerts].sort((a, b) => rank(a.level) - rank(b.level));

  return (
    <div className="space-y-3">
      {notices.length > 0 && (
        <div className="space-y-2">
          {notices.map((nt, i) => {
            const st = levelStyle(nt.level);
            return (
              <div
                key={`${nt.code}-${i}`}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${st.box}`}
              >
                {st.icon}
                <span>{nt.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {ordered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
          Sin alertas operativas en el rango/filtro actual.
        </div>
      ) : (
        <ul className="space-y-2">
          {ordered.map((a, i) => {
            const st = levelStyle(a.level);
            return (
              <li
                key={`${a.entity_name}-${a.metric}-${i}`}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${st.box}`}
              >
                {st.icon}
                <div>
                  <p className="font-medium">{a.message}</p>
                  <p className="text-xs opacity-80">
                    {getAccountGroup(String(a.account_group))?.label ??
                      a.account_group}{" "}
                    · {a.entity_type}: {a.entity_name}
                  </p>
                  {a.recommended_action && (
                    <p className="mt-0.5 text-xs opacity-90">
                      → {a.recommended_action}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function rank(level: string): number {
  if (level === "critical") return 0;
  if (level === "warning") return 1;
  return 2;
}
