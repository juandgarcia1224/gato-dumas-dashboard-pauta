/* global React */
const { useState: useState2 } = React;

/* ---- Alerts panel ---- */
function AlertsPanel({ alerts, mode }) {
  return (
    <section className="section">
      <div className="section-head">
        <div className="title-wrap">
          <span className="h-rule" style={{display:"inline-block", width:28, height:1, background:"var(--ink)"}}></span>
          <h3>Alertas operativas</h3>
          <span className="sub">{alerts.length} señales detectadas · motor de alertas en standby</span>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <span className="badge crit"><span className="dot"></span>2 críticas</span>
          <span className="badge warn"><span className="dot"></span>3 atención</span>
          <span className="badge info"><span className="dot"></span>1 aviso</span>
        </div>
      </div>

      <div className="alerts-list">
        {alerts.map((a, i) => (
          <div className={"alert-row sev-" + a.sev} key={i}>
            <div className={"sev " + a.sev}>{a.label}</div>

            <div>
              <div className="what">{a.what}</div>
              <div style={{fontSize:11, color:"var(--muted)", marginTop:2, letterSpacing:".06em"}}>
                {a.account}
              </div>
            </div>

            <div className="target">
              {a.target}
              <small>{a.targetType}</small>
            </div>

            <div className="metric">
              {a.metric}
              <small>{a.metricLabel}</small>
            </div>

            <div className="reco internal-only">{a.reco}</div>

            <div className="action">
              <button className="btn ghost" style={{padding:"6px 10px", fontSize:11}}>
                Ver detalle
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---- Tables: Campaigns / Adsets / Ads ---- */
function StatusBadge({ status }) {
  const map = {
    active: { cls: "ok",   txt: "Activa" },
    paused: { cls: "ghost",txt: "Pausada"},
    draft:  { cls: "info", txt: "Borrador"},
    archived:{cls: "ghost",txt: "Archivada"},
  };
  const m = map[status] || { cls: "ghost", txt: status };
  return <span className={"badge " + m.cls}><span className="dot"></span>{m.txt}</span>;
}

function AlertCell({ alert }) {
  if (!alert) return <span className="badge ok"><span className="dot"></span>Sin alerta</span>;
  if (alert === "crit") return <span className="badge crit"><span className="dot"></span>Crítica</span>;
  if (alert === "warn") return <span className="badge warn"><span className="dot"></span>Atención</span>;
  return <span className="badge info"><span className="dot"></span>Aviso</span>;
}

function PerfTable({ tab }) {
  const data = window.MOCK;
  if (tab === "Campañas") {
    return (
      <table className="tbl">
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
          {data.campaigns.map((c, i) => (
            <tr key={i}>
              <td>
                <div className="first">
                  <div className="thumb">CMP</div>
                  <div className="name">{c.name}<small>ID — · creada —</small></div>
                </div>
              </td>
              <td><span className="cell-acct">{c.acct}</span></td>
              <td><div className="status-cell"><StatusBadge status={c.status}/></div></td>
              <td className="right num">{c.spend}</td>
              <td className="right num">{c.results}</td>
              <td className="right num">{c.cpr}</td>
              <td className="right num">{c.freq}</td>
              <td className="right num">{c.ctr}</td>
              <td className="right num">{c.cpc}</td>
              <td className="right num">{c.cpm}</td>
              <td><AlertCell alert={c.alert}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (tab === "Conjuntos") {
    return (
      <table className="tbl">
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
          {data.adsets.map((c, i) => (
            <tr key={i}>
              <td>
                <div className="first">
                  <div className="thumb">CJ</div>
                  <div className="name">{c.name}<small>Audiencia · plataforma —</small></div>
                </div>
              </td>
              <td><div className="name" style={{fontSize:12, fontWeight:500}}>{c.camp}</div></td>
              <td><span className="cell-acct">{c.acct}</span></td>
              <td><div className="status-cell"><StatusBadge status={c.status}/></div></td>
              <td className="right num">{c.spend}</td>
              <td className="right num">{c.results}</td>
              <td className="right num">{c.cpr}</td>
              <td className="right num">{c.freq}</td>
              <td className="right num">{c.ctr}</td>
              <td><AlertCell alert={c.alert}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Anuncios
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Anuncio</th>
          <th>Campaña</th>
          <th>Cuenta</th>
          <th>Formato</th>
          <th>Estado</th>
          <th className="right">Inversión</th>
          <th className="right">Resultados</th>
          <th className="right">CPR</th>
          <th className="right">CTR</th>
          <th>Alerta</th>
        </tr>
      </thead>
      <tbody>
        {data.ads.map((c, i) => (
          <tr key={i}>
            <td>
              <div className="first">
                <div className="thumb">AD</div>
                <div className="name">{c.name}<small>Creativo de ejemplo</small></div>
              </div>
            </td>
            <td><div className="name" style={{fontSize:12, fontWeight:500}}>{c.camp}</div></td>
            <td><span className="cell-acct">{c.acct}</span></td>
            <td><span className="badge ghost">{c.format}</span></td>
            <td><div className="status-cell"><StatusBadge status={c.status}/></div></td>
            <td className="right num">{c.spend}</td>
            <td className="right num">{c.results}</td>
            <td className="right num">{c.cpr}</td>
            <td className="right num">{c.ctr}</td>
            <td><AlertCell alert={c.alert}/></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PerfTables() {
  const [tab, setTab] = useState2("Campañas");
  const tabs = [
    { id: "Campañas",  count: window.MOCK.campaigns.length, cls: "" },
    { id: "Conjuntos", count: window.MOCK.adsets.length,    cls: "tech-only" },
    { id: "Anuncios",  count: window.MOCK.ads.length,       cls: "" },
  ];
  return (
    <section className="section">
      <div className="section-head" style={{paddingBottom:0, borderBottom:"1px solid var(--hairline)"}}>
        <div className="tabs">
          {tabs.map(t => (
            <button key={t.id}
                    className={"tab " + t.cls + (tab === t.id ? " active" : "")}
                    onClick={() => setTab(t.id)}>
              {t.id} <span className="count">{t.count}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <span className="example-stamp">Datos de ejemplo</span>
          <button className="btn ghost" style={{padding:"6px 10px", fontSize:11}}>
            <window.GD.Icon.download /> Exportar CSV
          </button>
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <PerfTable tab={tab} />
      </div>
    </section>
  );
}

/* ---- Footer rule ---- */
function FooterRule() {
  return (
    <div className="footer-rule">
      <div>
        Centro de Seguimiento Digital · diseñado por CookMinds para Instituto Gato Dumas
      </div>
      <div className="stamps">
        <span>v0.1 · mockup</span>
        <span>·</span>
        <span>Datos no conectados</span>
      </div>
    </div>
  );
}

window.GD = Object.assign(window.GD || {}, { AlertsPanel, PerfTables, FooterRule });
