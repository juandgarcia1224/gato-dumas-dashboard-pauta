import {
  Link2,
  Database,
  CloudOff,
  Clock,
  Info,
  AlertTriangle,
} from "lucide-react";
import type { BannerVM } from "@/lib/dashboard/design-types";

const ICON: Record<string, React.ReactNode> = {
  "link-2": <Link2 size={16} />,
  database: <Database size={16} />,
  "cloud-off": <CloudOff size={16} />,
  clock: <Clock size={16} />,
  info: <Info size={16} />,
  "alert-triangle": <AlertTriangle size={16} />,
};

/**
 * Banners de estado/conexión REALES (derivados de status.notices del payload).
 * Reemplazan al "mockup banner" del diseño: aquí informan estado real, no mock.
 * No usar toasts (regla transversal de UI_STATES).
 */
export default function StatusBanners({ banners }: { banners: BannerVM[] }) {
  if (banners.length === 0) return null;
  return (
    <div role="status" aria-live="polite">
      {banners.map((b, i) => (
        <div key={`${b.title}-${i}`} className={`status-banner ${b.level}`}>
          <span className="sb-icon">{ICON[b.icon] ?? ICON.info}</span>
          <span>
            <span className="sb-title">{b.title}</span>
            <span> · {b.body}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
