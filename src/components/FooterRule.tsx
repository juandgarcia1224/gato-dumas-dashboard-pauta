import { BUILD_VERSION, BUILD_DATE } from "@/lib/version";

/** Pie de página institucional (Cloud Design) con marcador de versión. */
export default function FooterRule({ generatedAt }: { generatedAt: string }) {
  return (
    <div className="footer-rule">
      <div>
        Centro de Seguimiento Digital · diseñado por CookMinds para Instituto Gato
        Dumas
      </div>
      <div className="stamps">
        <span>{BUILD_VERSION}</span>
        <span>·</span>
        <span>{BUILD_DATE}</span>
      </div>
    </div>
  );
}
