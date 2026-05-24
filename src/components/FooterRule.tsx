/** Pie de página institucional (Cloud Design). */
export default function FooterRule({ generatedAt }: { generatedAt: string }) {
  return (
    <div className="footer-rule">
      <div>
        Centro de Seguimiento Digital · diseñado por CookMinds para Instituto Gato
        Dumas
      </div>
      <div className="stamps">
        <span>v1.0 · Fase 3</span>
        <span>·</span>
        <span>Datos reales vía /api/dashboard</span>
      </div>
    </div>
  );
}
