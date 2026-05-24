"use client";

/**
 * Filtro por cuenta: Todas / Gato Colombia / Gato Bucaramanga.
 * Las opciones vienen del payload (status.accounts) para no hardcodear.
 */
export default function AccountSelector({
  accounts,
  value,
  onChange,
}: {
  accounts: { key: string; label: string; configured: boolean }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [{ key: "all", label: "Todas", configured: true }, ...accounts];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={[
              "rounded-md border px-3 py-1.5 text-sm font-medium transition",
              active
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
              !o.configured && o.key !== "all" ? "opacity-60" : "",
            ].join(" ")}
            title={
              !o.configured && o.key !== "all"
                ? "Cuenta no configurada"
                : undefined
            }
          >
            {o.label}
            {!o.configured && o.key !== "all" && (
              <span className="ml-1 text-xs">· sin config</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
