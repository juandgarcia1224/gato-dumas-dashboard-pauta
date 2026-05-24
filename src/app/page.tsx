import DashboardShell from "@/components/DashboardShell";

/**
 * Ruta única de Fase 1. Estructura preparada para separar luego en
 * /dashboard/internal y /dashboard/client (ver docs/DESIGN_CONTRACT.md).
 */
export default function Page() {
  return <DashboardShell view="internal" />;
}
