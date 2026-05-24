/**
 * Tipos de presentación del diseño de Cloud Design (basados en
 * handoff/COMPONENT_MAP §11). Son VIEW-MODELS: strings ya formateados,
 * listos para render. Se construyen desde el DashboardPayload real en
 * viewmodel.ts. No reemplazan el contrato de datos (contract.ts).
 */

export type Severity = "crit" | "warn" | "info" | "ok";
export type EntityStatus = "active" | "paused" | "draft" | "archived";

export interface ExecBlock {
  head: string;
  body: string;
  foot: string;
}

export interface MetricVM {
  id: "spend" | "budget" | "pct" | "results" | "cpr" | "freq" | "ctr" | "active" | "alerts";
  label: string;
  value: string; // siempre string para soportar '—' / '$—'
  unit?: string;
  ctx: string;
  status: "ok" | "warn" | "crit" | "empty";
  placeholder: boolean;
  accent?: boolean;
  alert?: boolean;
  tech?: boolean;
}

export interface AccountStatVM {
  k: string;
  v: string;
  u?: string;
}

export interface AccountVM {
  id: string;
  name: string;
  cities: string;
  status: Severity | "ghost";
  statusLabel: string;
  stats: AccountStatVM[];
  pacing: { fill: number; marker: number; tone: Severity; label: string };
}

export interface PacingVM {
  hasPlan: boolean;
  interpolated: boolean; // true: la curva real es interpolación lineal (sin historial diario)
  expectedLine: number[]; // 0–100
  realLine: number[]; // 0–100
  spentToday: string; // "62%"
  expectedToday: string; // "83%"
  deltaToday: string; // "−21 pts"
  deltaSeverity: Severity;
  statusToday: string;
  /** Aviso de cobertura parcial (cuentas sin plan excluidas del cálculo). */
  note?: string;
}

export interface AlertVM {
  sev: Severity;
  label: string;
  what: string;
  account: string;
  target: string;
  targetType: string;
  metric: string;
  metricLabel: string;
  reco: string;
}

export interface RowAlert {
  sev: "crit" | "warn" | "info" | null;
}

export interface CampaignVM {
  name: string;
  acct: string;
  status: EntityStatus;
  spend: string;
  results: string;
  noConversions: boolean;
  cpr: string;
  freq: string;
  ctr: string;
  cpc: string;
  cpm: string;
  alert: "crit" | "warn" | "info" | null;
}

export interface AdsetVM {
  name: string;
  camp: string;
  acct: string;
  status: EntityStatus;
  spend: string;
  results: string;
  noConversions: boolean;
  cpr: string;
  freq: string;
  ctr: string;
  alert: "crit" | "warn" | "info" | null;
}

export interface AdVM {
  name: string;
  camp: string;
  acct: string;
  status: EntityStatus;
  spend: string;
  results: string;
  noConversions: boolean;
  cpr: string;
  ctr: string;
  alert: "crit" | "warn" | "info" | null;
}

export interface HeaderVM {
  brandName: string;
  subtitle: string;
  kicker: string;
  lastUpdate: { label: string; status: Severity };
  connection: { label: string; status: Severity };
}

export interface BannerVM {
  level: "warn" | "crit" | "info";
  title: string;
  body: string;
  icon: string;
}

export interface DashboardVM {
  connected: boolean; // hay datos reales de Meta
  header: HeaderVM;
  banners: BannerVM[];
  exec: { works: ExecBlock; attn: ExecBlock; next: ExecBlock };
  kpis: MetricVM[];
  accounts: AccountVM[];
  pacing: PacingVM | null; // null → sin plan (EmptyState)
  alerts: AlertVM[];
  alertCounts: { crit: number; warn: number; info: number };
  campaigns: CampaignVM[];
  adsets: AdsetVM[];
  ads: AdVM[];
  generatedAt: string;
}
