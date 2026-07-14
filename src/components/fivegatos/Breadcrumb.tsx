import Link from "next/link";

export interface Crumb {
  label: string;
  /** Sin href = nivel actual (no clickeable). */
  href?: string;
}

/**
 * Breadcrumb del drill-down: Todas las campañas › Campaña › Adset.
 * Separador "›", último nivel en tinta fuerte sin link.
 */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex min-w-0 items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="select-none text-gray-400">
                ›
              </span>
            )}
            {it.href ? (
              <Link
                href={it.href}
                className="max-w-[16rem] truncate text-gray-500 underline-offset-2 transition-colors hover:text-gray-900 hover:underline focus:outline-none focus-visible:rounded-[4px] focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                {it.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="max-w-[20rem] truncate font-medium text-gray-900"
              >
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
