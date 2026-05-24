import type { ExecBlock } from "@/lib/dashboard/design-types";

/**
 * Resumen ejecutivo para cliente (Cloud Design §3 bottom). Fondo oscuro,
 * pensado para presentación/captura. Visible también en modo interno.
 * Mismo contenido (real) que ExecStrip.
 */
export default function ClientExecutiveSummary({
  data,
}: {
  data: { works: ExecBlock; attn: ExecBlock; next: ExecBlock };
}) {
  const cells = [
    { tone: "var(--ok)", b: data.works },
    { tone: "var(--warn)", b: data.attn },
    { tone: "var(--brand-teal)", b: data.next },
  ];
  return (
    <section className="section client-exec">
      <div className="section-head">
        <div className="title-wrap">
          <span className="h-rule" style={{ background: "var(--paper)" }} />
          <h3 style={{ color: "var(--paper)" }}>Resumen ejecutivo para cliente</h3>
          <span className="sub" style={{ color: "rgba(255,255,255,.55)" }}>
            Para presentación con Gato Dumas
          </span>
        </div>
        <span className="example-stamp" style={{ color: "rgba(255,255,255,.45)" }}>
          Vista cliente
        </span>
      </div>
      <div className="client-exec-grid">
        {cells.map((c, i) => (
          <div className="client-exec-cell" key={i}>
            <div className="ce-head">
              <span className="dot" style={{ background: c.tone }} />
              {c.b.head}
            </div>
            <div className="ce-body">{c.b.body}</div>
            <div className="ce-foot">{c.b.foot}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
