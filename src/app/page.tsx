import DashboardShell from "@/components/DashboardShell";

/**
 * Ruta única (Cloud Design). El modo Interno/Cliente se controla con un toggle
 * en el header (data-mode en <html>), sin rutas separadas.
 */
export default function Page() {
  return <DashboardShell />;
}
