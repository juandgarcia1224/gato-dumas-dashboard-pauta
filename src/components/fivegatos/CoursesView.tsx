"use client";

import { useMemo, useState } from "react";
import type { AdsetConCurso, CampanaActiva } from "@/lib/fivegatos/data";
import { fmtCop, fmtInt } from "@/lib/fivegatos/constants";
import FinCursoChip from "./FinCursoChip";

// ---------------------------------------------------------------------------
// Agrupación por curso/programa a partir de las campañas activas
// ---------------------------------------------------------------------------

type Tipo = "Curso" | "Programa";

interface AgrupacionCurso {
  clave: string;
  nombre: string;
  tipo: Tipo;
  fecha_inicio: string | null; // ISO
  fecha_fin: string | null; // ISO
  estado: string | null;
  inscritos: number | null;
  spend: number;
  leads: number;
  cpl: number | null;
  adsets: Array<AdsetConCurso & { campaign_name: string }>;
}

function agruparPorCurso(activas: CampanaActiva[]): {
  cursos: AgrupacionCurso[];
  programas: AgrupacionCurso[];
} {
  const map = new Map<string, AgrupacionCurso>();

  for (const camp of activas) {
    for (const a of camp.adsets) {
      // Tipo viene del mapping (Curso/Programa); nombre normalizado del mapping.
      if (a.tipo !== "Curso" && a.tipo !== "Programa") continue;
      const nombre = a.nombre_normalizado ?? a.curso?.nombre ?? null;
      if (!nombre) continue;
      const tipo: Tipo = a.tipo;

      const clave = `${tipo}::${nombre.toLowerCase()}`;
      const existing = map.get(clave);
      if (existing) {
        existing.spend += a.spend;
        existing.leads += a.leads;
        existing.adsets.push({ ...a, campaign_name: camp.campaign_name });
      } else {
        map.set(clave, {
          clave,
          nombre,
          tipo,
          fecha_inicio: a.curso?.fecha_inicio ?? null,
          fecha_fin: a.curso?.fecha_fin ?? null,
          estado: a.curso?.estado ?? null,
          inscritos: a.curso?.inscritos ?? null,
          spend: a.spend,
          leads: a.leads,
          cpl: null,
          adsets: [{ ...a, campaign_name: camp.campaign_name }],
        });
      }
    }
  }

  // Calcular CPL final por grupo
  for (const g of map.values()) {
    g.cpl = g.leads > 0 ? g.spend / g.leads : null;
    g.adsets.sort((a, b) => b.spend - a.spend);
  }

  const all = Array.from(map.values()).sort((a, b) => b.spend - a.spend);
  return {
    cursos: all.filter((g) => g.tipo === "Curso"),
    programas: all.filter((g) => g.tipo === "Programa"),
  };
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
      aria-hidden
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function EstadoBadge({ estado }: { estado: string | null }) {
  if (!estado) return null;
  const cls =
    estado === "FINALIZO" || estado === "CANCELADO"
      ? "bg-gray-100 text-gray-600"
      : estado === "DETENIDO" || estado === "SUSPENDIDO"
        ? "bg-red-50 text-red-700"
        : estado === "INICIO"
          ? "bg-emerald-50 text-emerald-700"
          : estado === "POR_ABRIR"
            ? "bg-amber-50 text-amber-700"
            : "bg-gray-100 text-gray-600";
  const label = estado.replace("_", " ").toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

function CourseRow({ grupo }: { grupo: AgrupacionCurso }) {
  const [expanded, setExpanded] = useState(false);
  const finISO = grupo.fecha_fin;
  const finDate = finISO ? new Date(finISO) : null;

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-gray-50 focus-within:bg-gray-50"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="w-4 py-3 pl-4">
          <Chevron expanded={expanded} />
        </td>
        <td className="py-3 pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {grupo.nombre}
            </span>
            <EstadoBadge estado={grupo.estado} />
            {finDate && (
              <FinCursoChip
                curso={{
                  nombre: grupo.nombre,
                  fecha_texto: "",
                  fecha_inicio: grupo.fecha_inicio,
                  fecha_fin: grupo.fecha_fin,
                  estado: (grupo.estado as
                    | "POR_ABRIR"
                    | "INICIO"
                    | "FINALIZO"
                    | "DETENIDO"
                    | "CANCELADO"
                    | "SUSPENDIDO"
                    | "OTRO") || "OTRO",
                  inscritos: grupo.inscritos ?? 0,
                }}
              />
            )}
          </div>
          {(grupo.inscritos !== null || grupo.adsets.length > 0) && (
            <div className="mt-0.5 text-xs text-gray-500">
              {grupo.inscritos !== null && (
                <>Inscritos: {grupo.inscritos} · </>
              )}
              {grupo.adsets.length} adset{grupo.adsets.length === 1 ? "" : "s"}
            </div>
          )}
        </td>
        <td className="py-3 pr-4 text-right text-sm text-gray-900 tabular-nums">
          {fmtCop(grupo.spend)}
        </td>
        <td className="py-3 pr-4 text-right text-sm text-gray-900 tabular-nums">
          {fmtInt(grupo.leads)}
        </td>
        <td className="py-3 pr-4 text-right text-sm text-gray-900 tabular-nums">
          {fmtCop(grupo.cpl)}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/60">
          <td colSpan={5} className="px-4 pb-4 pt-1">
            <div className="ml-6 rounded-[6px] border border-gray-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      Adset
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      Campaña
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      Consumido
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      Leads
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      CPL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.adsets.map((a) => (
                    <tr
                      key={a.adset_id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {a.adset_name}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {a.campaign_name}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-900 tabular-nums">
                        {fmtCop(a.spend)}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-900 tabular-nums">
                        {fmtInt(a.leads)}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-900 tabular-nums">
                        {fmtCop(a.cpl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function GroupTable({
  titulo,
  grupos,
  vacio,
}: {
  titulo: string;
  grupos: AgrupacionCurso[];
  vacio: string;
}) {
  const totales = useMemo(() => {
    const spend = grupos.reduce((s, g) => s + g.spend, 0);
    const leads = grupos.reduce((s, g) => s + g.leads, 0);
    const cpl = leads > 0 ? spend / leads : null;
    return { spend, leads, cpl };
  }, [grupos]);

  return (
    <section aria-label={titulo} className="rounded-[8px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">{titulo}</h3>
      </div>
      {grupos.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">{vacio}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-4 py-2 pl-4" aria-hidden />
                <th className="py-2 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-gray-600">
                  Nombre
                </th>
                <th className="py-2 pr-4 text-right text-[11px] font-medium uppercase tracking-wide text-gray-600">
                  Consumido hasta hoy
                </th>
                <th className="py-2 pr-4 text-right text-[11px] font-medium uppercase tracking-wide text-gray-600">
                  Leads
                </th>
                <th className="py-2 pr-4 text-right text-[11px] font-medium uppercase tracking-wide text-gray-600">
                  CPL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grupos.map((g) => (
                <CourseRow key={g.clave} grupo={g} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="py-3 pl-4" aria-hidden />
                <td className="py-3 pr-4 text-sm font-semibold text-gray-900">
                  Total
                </td>
                <td className="py-3 pr-4 text-right text-sm font-semibold text-gray-900 tabular-nums">
                  {fmtCop(totales.spend)}
                </td>
                <td className="py-3 pr-4 text-right text-sm font-semibold text-gray-900 tabular-nums">
                  {fmtInt(totales.leads)}
                </td>
                <td className="py-3 pr-4 text-right text-sm font-semibold text-gray-900 tabular-nums">
                  {fmtCop(totales.cpl)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * Desglose por Curso y Programa. Cada fila es clickeable y despliega
 * los adsets que componen ese curso/programa (con su campaña padre).
 */
export default function CoursesView({
  activas,
}: {
  activas: CampanaActiva[];
}) {
  const { cursos, programas } = useMemo(
    () => agruparPorCurso(activas),
    [activas],
  );

  if (cursos.length === 0 && programas.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <GroupTable
        titulo="Cursos"
        grupos={cursos}
        vacio="Sin cursos activos este mes"
      />
      <GroupTable
        titulo="Programas"
        grupos={programas}
        vacio="Sin programas activos este mes"
      />
    </div>
  );
}
