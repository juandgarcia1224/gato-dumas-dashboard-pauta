"use client";

import { Download } from "lucide-react";
import type {
  AdVM,
  AdsetVM,
  CampaignVM,
  EntityStatus,
} from "@/lib/dashboard/design-types";
import EmptyState from "./EmptyState";

const STATUS_MAP: Record<EntityStatus, { cls: string; txt: string }> = {
  active: { cls: "ok", txt: "Activa" },
  paused: { cls: "ghost", txt: "Pausada" },
  draft: { cls: "info", txt: "Borrador" },
  archived: { cls: "ghost", txt: "Archivada" },
};

function StatusBadge({ status }: { status: EntityStatus }) {
  const m = STATUS_MAP[status];
  return (
    <span className={"badge " + m.cls}>
      <span className="dot" />
      {m.txt}
    </span>
  );
}

function AlertCell({ alert }: { alert: "crit" | "warn" | "info" | null }) {
  if (!alert)
    return (
      <span className="badge ok">
        <span className="dot" />
        Sin alerta
      </span>
    );
  const map = { crit: "Crítica", warn: "Atención", info: "Aviso" } as const;
  return (
    <span className={"badge " + alert}>
      <span className="dot" />
      {map[alert]}
    </span>
  );
}

function EntityCell({ thumb, name, sub }: { thumb: string; name: string; sub: string }) {
  return (
    <div className="first-wrap">
      <div className="thumb">{thumb}</div>
      <div className="name">
        {name}
        <small>{sub}</small>
      </div>
    </div>
  );
}

const tabs = [
  { id: "Campañas", cls: "" },
  { id: "Conjuntos", cls: "tech-only" },
  { id: "Anuncios", cls: "" },
];

export default function PerformanceTables({
  campaigns,
  adsets,
  ads,
  tab,
  onTab,
}: {
  campaigns: CampaignVM[];
  adsets: AdsetVM[];
  ads: AdVM[];
  tab: string;
  onTab: (t: string) => void;
}) {
  const counts: Record<string, number> = {
    Campañas: campaigns.length,
    Conjuntos: adsets.length,
    Anuncios: ads.length,
  };

  return (
    <section className="section">
      <div className="section-head" style={{ paddingBottom: 0 }}>
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={"tab " + t.cls + (tab === t.id ? " active" : "")}
              onClick={() => onTab(t.id)}
            >
              {t.id} <span className="count">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <button className="btn ghost" style={{ padding: "6px 10px", fontSize: 11 }} disabled title="Exportación por terminal (próximamente)">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {tab === "Campañas" && <CampaignView rows={campaigns} />}
      {tab === "Conjuntos" && <AdsetView rows={adsets} />}
      {tab === "Anuncios" && <AdsView rows={ads} />}
    </section>
  );
}

function NoRows({ what }: { what: string }) {
  return (
    <div className="section-body">
      <EmptyState
        kind="no-data"
        title={`Sin ${what}`}
        body="No hay datos para el rango/cuenta seleccionados. Sincroniza con npm run meta:update."
      />
    </div>
  );
}

/* ---------- Campañas ---------- */
function CampaignView({ rows }: { rows: CampaignVM[] }) {
  if (rows.length === 0) return <NoRows what="campañas" />;
  return (
    <>
      <div className="table-scroll hide-mobile">
        <table className="tbl">
          <caption className="sr-only">Tabla de campañas</caption>
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Cuenta</th>
              <th>Estado</th>
              <th className="right">Inversión</th>
              <th className="right">Resultados</th>
              <th className="right">CPR</th>
              <th className="right">Frec.</th>
              <th className="right">CTR</th>
              <th className="right">CPC</th>
              <th className="right">CPM</th>
              <th>Alerta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={i}>
                <td className="first">
                  <EntityCell
                    thumb="CMP"
                    name={c.name}
                    sub={c.noConversions ? "Sin conversiones" : c.acct}
                  />
                </td>
                <td>
                  <span className="cell-acct">{c.acct}</span>
                </td>
                <td>
                  <div className="status-cell">
                    <StatusBadge status={c.status} />
                  </div>
                </td>
                <td className="right num">{c.spend}</td>
                <td className="right num">{c.results}</td>
                <td className="right num">{c.cpr}</td>
                <td className="right num">{c.freq}</td>
                <td className="right num">{c.ctr}</td>
                <td className="right num">{c.cpc}</td>
                <td className="right num">{c.cpm}</td>
                <td>
                  <AlertCell alert={c.alert} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CardList
        items={rows.map((c) => ({
          name: c.name,
          acct: c.acct,
          status: c.status,
          stats: [
            ["Inversión", c.spend],
            ["Resultados", c.results],
            ["CPR", c.cpr],
            ["CTR", c.ctr],
          ],
          alert: c.alert,
        }))}
      />
    </>
  );
}

/* ---------- Conjuntos ---------- */
function AdsetView({ rows }: { rows: AdsetVM[] }) {
  if (rows.length === 0) return <NoRows what="conjuntos" />;
  return (
    <>
      <div className="table-scroll hide-mobile">
        <table className="tbl">
          <caption className="sr-only">Tabla de conjuntos de anuncios</caption>
          <thead>
            <tr>
              <th>Conjunto</th>
              <th>Campaña</th>
              <th>Cuenta</th>
              <th>Estado</th>
              <th className="right">Inversión</th>
              <th className="right">Resultados</th>
              <th className="right">CPR</th>
              <th className="right">Frec.</th>
              <th className="right">CTR</th>
              <th>Alerta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={i}>
                <td className="first">
                  <EntityCell thumb="CJ" name={s.name} sub={s.noConversions ? "Sin conversiones" : "Conjunto"} />
                </td>
                <td>
                  <div className="name" style={{ fontSize: 12, fontWeight: 500 }}>
                    {s.camp}
                  </div>
                </td>
                <td>
                  <span className="cell-acct">{s.acct}</span>
                </td>
                <td>
                  <div className="status-cell">
                    <StatusBadge status={s.status} />
                  </div>
                </td>
                <td className="right num">{s.spend}</td>
                <td className="right num">{s.results}</td>
                <td className="right num">{s.cpr}</td>
                <td className="right num">{s.freq}</td>
                <td className="right num">{s.ctr}</td>
                <td>
                  <AlertCell alert={s.alert} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CardList
        items={rows.map((s) => ({
          name: s.name,
          acct: s.acct,
          status: s.status,
          stats: [
            ["Inversión", s.spend],
            ["Resultados", s.results],
            ["CPR", s.cpr],
            ["CTR", s.ctr],
          ],
          alert: s.alert,
        }))}
      />
    </>
  );
}

/* ---------- Anuncios ---------- */
function AdsView({ rows }: { rows: AdVM[] }) {
  if (rows.length === 0) return <NoRows what="anuncios" />;
  return (
    <>
      <div className="table-scroll hide-mobile">
        <table className="tbl">
          <caption className="sr-only">Tabla de anuncios</caption>
          <thead>
            <tr>
              <th>Anuncio</th>
              <th>Campaña</th>
              <th>Cuenta</th>
              <th>Estado</th>
              <th className="right">Inversión</th>
              <th className="right">Resultados</th>
              <th className="right">CPR</th>
              <th className="right">CTR</th>
              <th>Alerta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => (
              <tr key={i}>
                <td className="first">
                  <EntityCell thumb="AD" name={d.name} sub={d.noConversions ? "Sin conversiones" : "Anuncio"} />
                </td>
                <td>
                  <div className="name" style={{ fontSize: 12, fontWeight: 500 }}>
                    {d.camp}
                  </div>
                </td>
                <td>
                  <span className="cell-acct">{d.acct}</span>
                </td>
                <td>
                  <div className="status-cell">
                    <StatusBadge status={d.status} />
                  </div>
                </td>
                <td className="right num">{d.spend}</td>
                <td className="right num">{d.results}</td>
                <td className="right num">{d.cpr}</td>
                <td className="right num">{d.ctr}</td>
                <td>
                  <AlertCell alert={d.alert} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CardList
        items={rows.map((d) => ({
          name: d.name,
          acct: d.acct,
          status: d.status,
          stats: [
            ["Inversión", d.spend],
            ["Resultados", d.results],
            ["CPR", d.cpr],
            ["CTR", d.ctr],
          ],
          alert: d.alert,
        }))}
      />
    </>
  );
}

/* ---------- Mobile card list ---------- */
function CardList({
  items,
}: {
  items: {
    name: string;
    acct: string;
    status: EntityStatus;
    stats: [string, string][];
    alert: "crit" | "warn" | "info" | null;
  }[];
}) {
  return (
    <div className="card-list show-mobile">
      {items.map((it, i) => (
        <div className="entity-card" key={i}>
          <div className="ec-top">
            <div className="name">
              {it.name}
              <small>{it.acct}</small>
            </div>
            <StatusBadge status={it.status} />
          </div>
          <div className="ec-stats">
            {it.stats.map(([k, v]) => (
              <div className="stat" key={k}>
                <div className="stat-k">{k}</div>
                <div className="stat-v" style={{ fontSize: 18 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
          <AlertCell alert={it.alert} />
        </div>
      ))}
    </div>
  );
}
