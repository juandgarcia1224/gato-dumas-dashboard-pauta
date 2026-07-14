const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function labelMes(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const nombre = MESES[(m ?? 1) - 1] ?? "";
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${y}`;
}
