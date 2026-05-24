/**
 * Definición del cliente y sus grupos de cuentas.
 *
 * Gato Dumas se gestiona como UN solo cliente estratégico, pero opera con
 * DOS cuentas publicitarias de Meta distintas (dueños y operación separados).
 * El dashboard es general, con visualización separada por `account_group`.
 *
 * Arquitectura modular: para agregar TikTok (Fase 2) basta con añadir
 * entradas con `platform: 'tiktok'` y un cliente Meta-equivalente, sin
 * tocar la capa de dashboard.
 */

export const CLIENT = {
  id: "gatodumas",
  name: "Gato Dumas",
} as const;

export type Platform = "meta" | "tiktok";

export type AccountGroupKey = "gato_colombia" | "gato_bucaramanga";

export interface AccountGroup {
  /** Clave estable usada en filtros, URLs y como `account_group` en Sheets. */
  key: AccountGroupKey;
  /** Etiqueta visible. */
  label: string;
  /** Plataforma de pauta. Fase 1 = solo Meta. */
  platform: Platform;
  /** Variable de entorno que contiene el `act_...` de esta cuenta. */
  envVar: string;
  /** Sede / cobertura geográfica. */
  sede: string;
  /** Notas operativas internas. */
  notes: string;
}

export const ACCOUNT_GROUPS: AccountGroup[] = [
  {
    key: "gato_colombia",
    label: "Gato Colombia",
    platform: "meta",
    envVar: "META_AD_ACCOUNT_GATO_COLOMBIA",
    sede: "Bogotá / Barranquilla",
    notes: "Una sola cuenta publicitaria. Cubre Bogotá y Barranquilla.",
  },
  {
    key: "gato_bucaramanga",
    label: "Gato Bucaramanga",
    platform: "meta",
    envVar: "META_AD_ACCOUNT_GATO_BUCARAMANGA",
    sede: "Cinco Gatos / Bucaramanga",
    notes:
      "Cuenta distinta, dueños diferentes. Trabaja bajo estrategia conjunta con Colombia.",
  },
];

/** Grupos de cuentas de una plataforma específica (Fase 1: meta). */
export function getAccountGroups(platform: Platform = "meta"): AccountGroup[] {
  return ACCOUNT_GROUPS.filter((g) => g.platform === platform);
}

export function getAccountGroup(key: string): AccountGroup | undefined {
  return ACCOUNT_GROUPS.find((g) => g.key === key);
}
