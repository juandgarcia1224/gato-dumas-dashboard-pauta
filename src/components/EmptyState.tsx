import { Database, CloudOff, Link2, CheckCircle2 } from "lucide-react";

type Kind = "no-data" | "error" | "token" | "sheet" | "ok";

const ICONS: Record<Kind, React.ReactNode> = {
  "no-data": <Database size={22} />,
  error: <CloudOff size={22} />,
  token: <Link2 size={22} />,
  sheet: <Database size={22} />,
  ok: <CheckCircle2 size={22} />,
};

/**
 * Estado vacío (Cloud Design UI_STATES). Vive dentro del cuerpo de una sección;
 * la sección conserva su header. Nunca muestra datos inventados.
 */
export default function EmptyState({
  kind = "no-data",
  title,
  body,
  action,
}: {
  kind?: Kind;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="empty-state">
      <div className="es-icon">{ICONS[kind]}</div>
      <p className="es-title">{title}</p>
      {body && <p className="es-body">{body}</p>}
      {action && (
        <button className="btn ghost es-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
