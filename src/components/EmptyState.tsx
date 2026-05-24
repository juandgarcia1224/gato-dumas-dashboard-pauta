import { Inbox } from "lucide-react";

/**
 * Estado vacío genérico. Se usa para: sin datos, no configurado, sin rango.
 * NUNCA mostrar datos inventados; en su lugar se muestra este estado.
 */
export default function EmptyState({
  title,
  message,
  icon,
}: {
  title: string;
  message?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <div className="mb-3 text-gray-400">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {message && <p className="mt-1 max-w-md text-xs text-gray-500">{message}</p>}
    </div>
  );
}
