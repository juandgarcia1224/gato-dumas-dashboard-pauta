"use client";

import { useState } from "react";
import type { CampanaActiva } from "@/lib/fivegatos/data";
import type { ModoPresupuesto } from "@/lib/fivegatos/presupuesto";
import CampaignBlock from "./CampaignBlock";

const MODOS: { value: ModoPresupuesto; label: string }[] = [
  { value: "mes", label: "Este mes" },
  { value: "vida", label: "Toda la vida de la campaña" },
];

/**
 * Vista de campañas de /5gatos (v2, una sola página):
 *   - Solo campañas ACTIVAS (≥1 adset activo). Las 100% pausadas no
 *     aparecen, salvo opt-in cuando el filtro da 0.
 *   - Toggle "Este mes" / "Toda la vida" para la base del presupuesto.
 *   - Cada campaña es su propio bloque con acordeón de adsets → ads.
 */
export default function CampaignsView({
  activas,
  pausadas,
  month,
}: {
  activas: CampanaActiva[];
  pausadas: CampanaActiva[];
  month: string;
}) {
  const [modo, setModo] = useState<ModoPresupuesto>("mes");
  const [verPausadas, setVerPausadas] = useState(false);

  const sinActivas = activas.length === 0;
  const bloques = sinActivas && verPausadas ? pausadas : activas;

  return (
    <section aria-label="Campañas">
      {/* ── Toolbar: título + toggle de base de presupuesto ───── */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Campañas activas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Presupuesto planeado vs consumido por campaña. Haz clic en un
            adset para desplegar sus anuncios.
          </p>
        </div>
        <div
          role="group"
          aria-label="Base del cálculo de presupuesto"
          className="inline-flex rounded-[6px] border border-gray-300 bg-white p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          {MODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setModo(m.value)}
              aria-pressed={modo === m.value}
              className={`rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
                modo === m.value
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bloques de campaña ────────────────────────────────── */}
      {sinActivas && !verPausadas ? (
        <div className="flex flex-col items-center rounded-[8px] border border-gray-200 bg-white px-6 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="text-3xl" aria-hidden>
            😺
          </span>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">
            No hay campañas activas este mes
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-gray-500">
            Ninguna campaña tiene adsets activos hoy.
          </p>
          {pausadas.length > 0 && (
            <button
              type="button"
              onClick={() => setVerPausadas(true)}
              className="mt-4 rounded-[6px] border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              Ver todas, incluidas las pausadas ({pausadas.length})
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sinActivas && verPausadas && (
            <p className="text-sm text-gray-500">
              Mostrando las {pausadas.length} campañas del mes (todas
              pausadas).{" "}
              <button
                type="button"
                onClick={() => setVerPausadas(false)}
                className="font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600"
              >
                Ocultar
              </button>
            </p>
          )}
          {bloques.map((c) => (
            <CampaignBlock
              key={c.campaign_id}
              campana={c}
              month={month}
              modo={modo}
            />
          ))}
        </div>
      )}
    </section>
  );
}
