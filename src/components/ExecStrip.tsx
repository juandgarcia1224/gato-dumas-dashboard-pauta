import type { ExecBlock } from "@/lib/dashboard/design-types";

/**
 * Tira de resumen ejecutivo superior (Cloud Design §3 top).
 * Contenido derivado de datos reales (viewmodel.buildExec).
 */
export default function ExecStrip({
  data,
  mode,
}: {
  data: { works: ExecBlock; attn: ExecBlock; next: ExecBlock };
  mode: "interno" | "cliente";
}) {
  return (
    <section className="exec-strip">
      <div className="exec-head">
        <div className="eyebrow">
          {mode === "cliente" ? "Resumen para cliente" : "Resumen ejecutivo"}
        </div>
        <h2>
          {mode === "cliente"
            ? "Una mirada rápida al estado de la pauta."
            : "Una vista de control para empezar el día."}
        </h2>
        <div className="stamp">Vista {mode === "cliente" ? "Cliente" : "Interna"}</div>
      </div>
      {(["works", "attn", "next"] as const).map((key) => {
        const tone = key === "works" ? "ok" : key === "attn" ? "warn" : "next";
        const b = data[key];
        return (
          <div className={`exec-cell ${tone}`} key={key}>
            <div className="ec-head">
              <span className="icon-dot" />
              {b.head}
            </div>
            <div className="ec-body">{b.body}</div>
            <div className="ec-foot">{b.foot}</div>
          </div>
        );
      })}
    </section>
  );
}
