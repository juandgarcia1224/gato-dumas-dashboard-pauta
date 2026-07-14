/**
 * Lectura de ADS (anuncios individuales) de un adset — Meta Graph API, SOLO GET.
 *
 * Alimenta el nivel 3 del drill-down de /5gatos:
 *   campañas → adsets → ads (creative, thumbnail, CTA y métricas del mes).
 *
 * Endpoints:
 *   - GET /{adset_id}/ads       → metadatos + creative (título, body, imagen,
 *     CTA). Para creatives Advantage+ el texto vive en asset_feed_spec
 *     (bodies/titles/call_to_action_types), no en title/body planos; los
 *     helpers de abajo resuelven ambos casos.
 *   - GET /{adset_id}/insights?level=ad → métricas por ad de un rango
 *     (time_range) o del mes en curso (date_preset=this_month).
 *
 * Mismo retry con backoff por rate limit que adsets.ts (withRateLimitRetry).
 */

import { withRateLimitRetry } from "./adsets";
import type { MetaClient } from "./client";
import type { MetaAction } from "./types";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface AssetFeedText {
  text?: string;
}

/** Shape (parcial) del creative tal como llega del edge /ads. */
export interface AdCreativeMeta {
  id?: string;
  title?: string;
  body?: string;
  image_url?: string;
  /** Con thumbnail_width/height(512) llega en tamaño usable para cards. */
  thumbnail_url?: string;
  call_to_action_type?: string;
  object_story_spec?: {
    link_data?: {
      message?: string;
      name?: string;
      picture?: string;
      call_to_action?: { type?: string };
    };
    video_data?: {
      message?: string;
      title?: string;
      image_url?: string;
      call_to_action?: { type?: string };
    };
  };
  /** Creatives Advantage+: variantes de texto por placement. */
  asset_feed_spec?: {
    bodies?: AssetFeedText[];
    titles?: AssetFeedText[];
    call_to_action_types?: string[];
  };
}

/** Metadatos de un ad tal como llegan del edge /{adset_id}/ads. */
export interface AdMeta {
  id: string;
  name: string;
  status?: string;
  effective_status: string;
  /**
   * Fecha de creación del ad (ISO con offset). Meta no reporta start_time a
   * nivel ad: created_time es la fecha en que se lanzó el creative.
   */
  created_time?: string;
  creative?: AdCreativeMeta;
}

/** Fila de insights agregada por ad (un rango: mes). */
export interface AdInsight {
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  /** Personas únicas alcanzadas en el rango. */
  reach?: string;
  /** Impresiones ÷ alcance del rango (promedio de veces que cada persona vio el ad). */
  frequency?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  date_start?: string;
  date_stop?: string;
}

/** Ad con sus insights del rango ya mergeados por ad_id. */
export interface AdWithInsight {
  meta: AdMeta;
  insight?: AdInsight;
}

const AD_FIELDS = [
  "id",
  "name",
  "status",
  "effective_status",
  "created_time",
  // thumbnail_width/height(512): sin esto Meta devuelve un thumb de 64px.
  "creative.thumbnail_width(512).thumbnail_height(512){id,title,body,image_url,thumbnail_url,object_story_spec,call_to_action_type,asset_feed_spec{bodies,titles,call_to_action_types}}",
].join(",");

const AD_INSIGHT_FIELDS = [
  "ad_id",
  "ad_name",
  "spend",
  "impressions",
  "reach",
  "frequency",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "actions",
  "cost_per_action_type",
  "date_start",
  "date_stop",
].join(",");

// ---------------------------------------------------------------------------
// Fetchers (SOLO lectura)
// ---------------------------------------------------------------------------

/** Todos los ads de un adset con su creative (paginado). */
export async function fetchAdsOfAdset(
  client: MetaClient,
  adsetId: string,
): Promise<AdMeta[]> {
  return withRateLimitRetry(
    () => client.getAll<AdMeta>(`${adsetId}/ads`, { fields: AD_FIELDS }),
    "ads",
  );
}

/**
 * Insights por ad de un rango (`since`/`until` en YYYY-MM-DD), agregados
 * con level=ad. Una sola llamada por adset.
 */
export async function fetchAdInsightsRange(
  client: MetaClient,
  adsetId: string,
  since: string,
  until: string,
): Promise<Map<string, AdInsight>> {
  const rows = await withRateLimitRetry(
    () =>
      client.getAll<AdInsight>(`${adsetId}/insights`, {
        level: "ad",
        time_range: JSON.stringify({ since, until }),
        fields: AD_INSIGHT_FIELDS,
      }),
    "ad-insights-range",
  );
  return byAdId(rows);
}

/** Insights del mes en curso (date_preset=this_month) por ad. */
export async function fetchAdInsightsThisMonth(
  client: MetaClient,
  adsetId: string,
): Promise<Map<string, AdInsight>> {
  const rows = await withRateLimitRetry(
    () =>
      client.getAll<AdInsight>(`${adsetId}/insights`, {
        level: "ad",
        date_preset: "this_month",
        fields: AD_INSIGHT_FIELDS,
      }),
    "ad-insights-this-month",
  );
  return byAdId(rows);
}

/** Merge metadatos ↔ insights por ad_id (los ads sin gasto quedan con insight undefined). */
export function mergeAdsWithInsights(
  ads: AdMeta[],
  insights: Map<string, AdInsight>,
): AdWithInsight[] {
  return ads.map((meta) => ({ meta, insight: insights.get(meta.id) }));
}

function byAdId(rows: AdInsight[]): Map<string, AdInsight> {
  const map = new Map<string, AdInsight>();
  for (const r of rows) {
    if (r.ad_id) map.set(r.ad_id, r);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Helpers de creative (título / body / imagen / CTA, tolerantes al formato)
// ---------------------------------------------------------------------------

/** Título visible del creative (plano, link_data, video_data o asset feed). */
export function creativeTitle(c?: AdCreativeMeta): string | null {
  return (
    c?.title ??
    c?.object_story_spec?.link_data?.name ??
    c?.object_story_spec?.video_data?.title ??
    c?.asset_feed_spec?.titles?.[0]?.text ??
    null
  );
}

/** Texto principal del creative. */
export function creativeBody(c?: AdCreativeMeta): string | null {
  return (
    c?.body ??
    c?.object_story_spec?.link_data?.message ??
    c?.object_story_spec?.video_data?.message ??
    c?.asset_feed_spec?.bodies?.[0]?.text ??
    null
  );
}

/** Mejor imagen disponible para la card (image_url > picture > thumbnail). */
export function creativeImage(c?: AdCreativeMeta): string | null {
  return (
    c?.image_url ??
    c?.object_story_spec?.link_data?.picture ??
    c?.object_story_spec?.video_data?.image_url ??
    c?.thumbnail_url ??
    null
  );
}

/** Tipo de CTA (ej. WHATSAPP_MESSAGE, LEARN_MORE) o null. */
export function creativeCta(c?: AdCreativeMeta): string | null {
  return (
    c?.call_to_action_type ??
    c?.object_story_spec?.link_data?.call_to_action?.type ??
    c?.object_story_spec?.video_data?.call_to_action?.type ??
    c?.asset_feed_spec?.call_to_action_types?.[0] ??
    null
  );
}
