import type { ReactNode } from "react";
import {
  diasCorridos,
  fmtFechaCorta,
  fmtFrecuencia,
  frecuenciaCls,
} from "@/lib/fivegatos/constants";

/**
 * Chip discreto con la fecha de inicio de la pauta, los días corridos y la
 * frecuencia de Meta (impresiones ÷ alcance del período visto). Pedido del
 * cliente 5 Gatos: ver desde cuándo corre cada campaña/adset/ad y cuántas
 * veces (en promedio) cada persona la ha visto.
 *
 * Variantes (mismo dato, distinta densidad):
 *   campana → "Inicia 15 jun · 29 días corridos · Frecuencia 2,1"
 *             (si no hay frecuencia del período: "Frecuencia —")
 *   adset   → "Inicia 15 jun · 29 días · Frec 2,4"
 *   ad      → "Desde 20 jun · Frec 1,8" (fecha = created_time del ad)
 *
 * Si falta la fecha muestra "Inicio —". Frecuencia > 4 se pinta ámbar
 * (saturación) y > 6 rojo.
 */
export default function PautaInfoChip({
  startTime,
  frequency,
  variante = "adset",
}: {
  startTime: string | null;
  frequency: number | null;
  variante?: "campana" | "adset" | "ad";
}) {
  const fecha = startTime ? fmtFechaCorta(startTime) : "";
  const dias = diasCorridos(startTime);

  const partes: ReactNode[] = [];

  if (variante === "ad") {
    partes.push(fecha ? `Desde ${fecha}` : "Inicio —");
  } else {
    partes.push(fecha ? `Inicia ${fecha}` : "Inicio —");
    if (dias !== null) {
      partes.push(variante === "campana" ? `${dias} días corridos` : `${dias} días`);
    }
  }

  const labelFrec = variante === "campana" ? "Frecuencia" : "Frec";
  if (frequency !== null) {
    partes.push(
      <span key="frec" className={frecuenciaCls(frequency)}>
        {labelFrec} {fmtFrecuencia(frequency)}
      </span>,
    );
  } else if (variante === "campana") {
    // A nivel campaña el cliente siempre quiere ver el dato, aunque sea vacío.
    partes.push(`${labelFrec} —`);
  }

  return (
    <span className="inline-flex flex-wrap items-center whitespace-nowrap text-xs text-gray-500">
      {partes.map((p, i) => (
        <span key={i} className="inline-flex items-center">
          {i > 0 && <span className="mx-1 text-gray-300">·</span>}
          {p}
        </span>
      ))}
    </span>
  );
}
