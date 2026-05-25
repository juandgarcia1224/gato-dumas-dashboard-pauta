import { AlertCircle } from "lucide-react";
import type { UnclassifiedVM } from "@/lib/dashboard/design-types";

/**
 * Campañas de Gato Colombia sin sede clasificada (no se ocultan del consolidado
 * ni de Colombia; solo no aparecen en Bogotá/Barranquilla). Permite corregirlas
 * vía 08_Campaign_Mapping. Es vista interna.
 */
export default function UnclassifiedPanel({ data }: { data: UnclassifiedVM }) {
  if (data.count === 0) return null;
  return (
    <section className="section" style={{ marginBottom: 24 }}>
      <div className="section-head">
        <div className="title-wrap">
          <span className="h-rule" />
          <h3>Campañas pendientes por clasificar</h3>
          <span className="sub">{data.count} sin sede · solo Gato Colombia</span>
        </div>
        <span className="badge warn">
          <span className="dot" />
          Revisar
        </span>
      </div>
      <div className="section-body" style={{ paddingTop: 12 }}>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 0, marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={16} style={{ flex: "0 0 16px", marginTop: 1 }} />
          Estas campañas sí cuentan en Consolidado y Gato Colombia, pero no en Bogotá/Barranquilla
          (no se detectó la sede). Para clasificarlas, agrega su <code>campaign_id</code> y sede en la hoja
          <strong> 08_Campaign_Mapping</strong> (ver docs/CAMPAIGN_MAPPING_GATO_DUMAS.md).
        </p>
        <div className="table-scroll">
          <table className="tbl">
            <caption className="sr-only">Campañas sin sede clasificada</caption>
            <thead>
              <tr>
                <th>Campaña</th>
                <th className="right">Inversión</th>
                <th className="right">Resultados</th>
                <th>campaign_id</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr key={c.campaign_id}>
                  <td className="name">{c.campaign_name}</td>
                  <td className="right num">{c.spend}</td>
                  <td className="right num">{c.results}</td>
                  <td><span className="cell-acct" style={{ textTransform: "none" }}>{c.campaign_id}</span></td>
                  <td style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
