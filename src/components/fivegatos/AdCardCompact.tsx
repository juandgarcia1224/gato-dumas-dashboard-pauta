import type { AdStats } from "@/lib/fivegatos/data";
import { fmtCop, fmtInt } from "@/lib/fivegatos/constants";
import { ctaLabel } from "./ctaLabel";
import PautaInfoChip from "./PautaInfoChip";

/**
 * Versión compacta de AdCard para el acordeón de adsets: thumbnail 48px,
 * título, CTA y métricas mínimas (gasto · leads · CPL). Nada de cards
 * grandes: fila densa sobre fondo gris para diferenciarse del adset.
 */
export default function AdCardCompact({ ad }: { ad: AdStats }) {
  const pausado = ad.effective_status !== "ACTIVE";
  return (
    <div className="flex items-start gap-3 rounded-[6px] border border-gray-200 bg-white px-3 py-2.5">
      {/* Thumbnail 48px (CDN de Meta, URLs firmadas → <img> plano) */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[4px] bg-gray-100">
        {ad.creative_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.creative_image}
            alt={`Creative del anuncio ${ad.ad_name}`}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-[9px] font-medium uppercase leading-tight text-gray-400">
            Sin
            <br />
            creative
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] font-medium ${pausado ? "text-gray-500" : "text-gray-900"}`}
          title={ad.ad_name}
        >
          {ad.ad_name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-gray-500">
          {ad.cta && (
            <span className="inline-flex items-center rounded-[4px] bg-gray-100 px-1.5 py-px font-medium text-gray-600">
              {ctaLabel(ad.cta)}
            </span>
          )}
          {pausado && <span className="text-gray-400">Pausado</span>}
          <PautaInfoChip
            variante="ad"
            startTime={ad.created_time}
            frequency={ad.frequency}
          />
        </p>
        <p className="mt-1 text-xs text-gray-600 tabular-nums">
          <span className="font-semibold text-gray-900">{fmtCop(ad.spend)}</span>
          <span className="text-gray-300"> · </span>
          {fmtInt(ad.leads)} leads
          <span className="text-gray-300"> · </span>
          CPL {fmtCop(ad.cpl)}
        </p>
      </div>
    </div>
  );
}
