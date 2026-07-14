import type { AdStats } from "@/lib/fivegatos/data";
import { fmtCop, fmtInt, fmtPct } from "@/lib/fivegatos/constants";
import SeveridadPill from "./SeveridadPill";
import StatusBadge from "./StatusBadge";

/** CTAs de Meta más comunes en español. Fallback: prettify del enum. */
const CTA_LABELS: Record<string, string> = {
  WHATSAPP_MESSAGE: "Enviar WhatsApp",
  MESSAGE_PAGE: "Enviar mensaje",
  LEARN_MORE: "Más información",
  SIGN_UP: "Registrarte",
  SUBSCRIBE: "Suscribirte",
  CONTACT_US: "Contactar",
  GET_QUOTE: "Pedir información",
  APPLY_NOW: "Solicitar ahora",
  BOOK_NOW: "Reservar",
  CALL_NOW: "Llamar",
  SHOP_NOW: "Comprar",
  GET_OFFER: "Ver oferta",
};

function ctaLabel(cta: string): string {
  return (
    CTA_LABELS[cta] ??
    cta.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}

/**
 * Nivel 3 del drill-down: card de un anuncio individual con thumbnail del
 * creative, texto, CTA y métricas del mes.
 */
export default function AdCard({ ad }: { ad: AdStats }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[6px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      {/* Thumbnail del creative */}
      <div className="relative h-44 w-full bg-gray-100">
        {ad.creative_image ? (
          // Imagen del CDN de Meta (URLs firmadas y efímeras) → <img> plano.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.creative_image}
            alt={`Creative del anuncio ${ad.ad_name}`}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs font-medium uppercase tracking-wide text-gray-400">
            Sin vista previa
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="min-w-0 text-sm font-semibold leading-snug text-gray-900"
            title={ad.ad_name}
          >
            {ad.ad_name}
          </h3>
          <div className="shrink-0">
            <StatusBadge status={ad.effective_status || ad.status} />
          </div>
        </div>

        {(ad.creative_title || ad.creative_body) && (
          <div className="min-w-0">
            {ad.creative_title && (
              <p className="truncate text-sm font-medium text-gray-700">
                {ad.creative_title}
              </p>
            )}
            {ad.creative_body && (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                {ad.creative_body}
              </p>
            )}
          </div>
        )}

        {ad.cta && (
          <span className="inline-flex w-fit items-center rounded-[4px] bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            CTA · {ctaLabel(ad.cta)}
          </span>
        )}

        <div className="mt-auto grid grid-cols-3 gap-x-3 gap-y-2 border-t border-gray-200 pt-3">
          <Metric label="Inversión" value={fmtCop(ad.spend)} />
          <Metric label="Leads" value={fmtInt(ad.leads)} />
          <Metric label="CPL" value={fmtCop(ad.cpl)} />
          <Metric label="Impresiones" value={fmtInt(ad.impressions)} />
          <Metric label="Clics" value={fmtInt(ad.clicks)} />
          <Metric label="CTR" value={fmtPct(ad.ctr)} />
        </div>

        <div>
          <SeveridadPill semaforo={ad.semaforo} />
        </div>
      </div>
    </article>
  );
}
