/* global React */
const { useState, useMemo } = React;

/* ----- Icon set: minimal hairline icons ----- */
const Icon = {
  refresh: () => (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 8a5 5 0 0 1 8.5-3.5L13 6" />
      <path d="M13 3v3h-3" />
      <path d="M13 8a5 5 0 0 1-8.5 3.5L3 10" />
      <path d="M3 13v-3h3" />
    </svg>
  ),
  download: () => (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M8 2v8m0 0L5 7m3 3l3-3M3 13h10" />
    </svg>
  ),
  share: () => (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="3.5" r="1.6"/><circle cx="4" cy="8" r="1.6"/><circle cx="12" cy="12.5" r="1.6"/>
      <path d="M5.4 7.1L10.6 4.4M5.4 8.9L10.6 11.6"/>
    </svg>
  ),
  arrow: () => (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 8h10M9 4l4 4-4 4"/>
    </svg>
  ),
  warn: () => (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M8 2l6.5 11h-13L8 2zM8 7v3M8 12v.5"/>
    </svg>
  ),
};

/* ----- Logo: render the Instituto Gato Dumas mark ----- */
function BrandLogo() {
  return (
    <img className="logo-img" src="assets/logo_gato_dumas.png" alt="Instituto Gato Dumas" />
  );
}

/* ----- Topbar ----- */
function TopBar() {
  return (
    <header className="topbar">
      <div className="brand-mark">
        <BrandLogo />
        <div className="brand-id">
          <div className="lvl-1">Centro de Seguimiento Digital</div>
          <div className="lvl-2">Gato Dumas</div>
          <div className="eyebrow" style={{marginTop:4}}>Pauta digital · Meta Ads</div>
        </div>
      </div>

      <div className="topbar-meta">
        <div className="meta-pill">
          <div className="k">Última actualización</div>
          <div className="v">
            <span className="status-dot warn"></span>
            <span>Pendiente · sin sincronizar</span>
          </div>
        </div>
        <div className="meta-pill">
          <div className="k">Estado de conexión</div>
          <div className="v">
            <span className="status-dot warn"></span>
            <span>Meta Ads · token no configurado</span>
          </div>
        </div>
        <button className="btn ghost" disabled title="Acción ejecutada por terminal vía Claude Code">
          <Icon.download />
          Exportar
        </button>
        <button className="btn primary" title="La actualización real la dispara Claude Code por terminal">
          <Icon.refresh />
          Actualizar datos
        </button>
      </div>
    </header>
  );
}

/* ----- Filter Bar ----- */
function FilterBar({ filters, setFilters }) {
  const ranges = ["Hoy", "Últimos 7 días", "Mes actual", "Personalizado"];
  const accounts = [
    { id: "all", label: "Todas", className: "" },
    { id: "co",  label: "Gato Colombia", className: "" },
    { id: "bga", label: "Gato Bucaramanga", className: "alt" },
  ];
  const levels = ["Campañas", "Conjuntos", "Anuncios"];

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="lbl">Rango</span>
        <div className="seg">
          {ranges.map(r =>
            <button key={r}
                    className={filters.range === r ? "active" : ""}
                    onClick={() => setFilters(f => ({...f, range: r}))}>{r}</button>
          )}
        </div>
      </div>

      <div className="filter-group">
        <span className="lbl">Cuenta</span>
        <div style={{display:"flex", gap:8}}>
          {accounts.map(a =>
            <button key={a.id}
                    className={"account-chip " + a.className + (filters.acct === a.id ? " active" : "")}
                    onClick={() => setFilters(f => ({...f, acct: a.id}))}>
              <span className="dot"></span>
              {a.label}
            </button>
          )}
        </div>
      </div>

      <div className="filter-group level">
        <span className="lbl">Nivel</span>
        <div className="seg">
          {levels.map(l =>
            <button key={l}
                    className={filters.level === l ? "active" : ""}
                    onClick={() => setFilters(f => ({...f, level: l}))}>{l}</button>
          )}
        </div>
      </div>

      <div style={{marginLeft:"auto"}}>
        <span className="example-stamp">Vista mockup · datos no conectados</span>
      </div>
    </div>
  );
}

/* ----- Executive strip (top of page) ----- */
function ExecStrip({ data, mode }) {
  return (
    <section className="exec-strip">
      <div className="exec-head">
        <div className="eyebrow">{mode === "cliente" ? "Resumen para cliente" : "Resumen ejecutivo"}</div>
        <h2>{mode === "cliente" ? "Una mirada rápida al estado de la pauta." : "Una vista de control para empezar el día."}</h2>
        <div className="stamp">Vista {mode === "cliente" ? "Cliente" : "Interna"}</div>
      </div>
      <div className="exec-cell ok">
        <div className="ec-head"><span className="icon-dot"></span>{data.works.head}</div>
        <div className="ec-body">{data.works.body}</div>
        <div className="ec-foot">{data.works.foot}</div>
      </div>
      <div className="exec-cell warn">
        <div className="ec-head"><span className="icon-dot"></span>{data.attn.head}</div>
        <div className="ec-body">{data.attn.body}</div>
        <div className="ec-foot">{data.attn.foot}</div>
      </div>
      <div className="exec-cell next">
        <div className="ec-head"><span className="icon-dot"></span>{data.next.head}</div>
        <div className="ec-body">{data.next.body}</div>
        <div className="ec-foot">{data.next.foot}</div>
      </div>
    </section>
  );
}

/* ----- KPI Card ----- */
function Kpi({ kpi }) {
  const cls = ["kpi"];
  if (kpi.id === "spend") cls.push("accent");
  if (kpi.alert) cls.push("alert-card");
  if (kpi.tech) cls.push("tech");
  return (
    <div className={cls.join(" ")}>
      <div className="kpi-top">
        <div className="label">{kpi.label}</div>
        <span className="trend flat">— vs período ant.</span>
      </div>
      <div className="value">
        {kpi.value}
        {kpi.unit && <span className="unit">{kpi.unit}</span>}
      </div>
      <div className="ctx">{kpi.ctx}</div>
      <div className="kpi-foot">
        <span className="example-stamp">Placeholder</span>
        <span className="badge ghost">Sin datos</span>
      </div>
    </div>
  );
}

function KpiGrid({ items }) {
  return (
    <section className="row cols-4" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
      {items.map(k => <Kpi key={k.id} kpi={k} />)}
    </section>
  );
}

/* ----- Account summary ----- */
function AccountCard({ account }) {
  const badge =
    account.status === "ok"   ? <span className="badge ok"><span className="dot"></span>Sano</span> :
    account.status === "warn" ? <span className="badge warn"><span className="dot"></span>{account.statusLabel}</span> :
    account.status === "crit" ? <span className="badge crit"><span className="dot"></span>{account.statusLabel}</span> :
                                <span className="badge info"><span className="dot"></span>{account.statusLabel}</span>;

  return (
    <div className="account-card">
      <div className="ac-head">
        <div className="ac-title">
          <span className="instituto-frame" style={{padding:"4px 8px", fontFamily:"var(--font-sans)", fontSize:9, letterSpacing:".18em", fontWeight:700}}>CTA</span>
          <div>
            <h4>{account.name}</h4>
            <div className="ac-cities">{account.cities}</div>
          </div>
        </div>
        {badge}
      </div>

      <div className="grid-stats">
        {account.stats.map((s,i) => (
          <div className="stat" key={i}>
            <div className="stat-k">{s.k}</div>
            <div className="stat-v">{s.v}{s.u && <span className="u">{s.u}</span>}</div>
            <div className="stat-d">— vs plan</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--muted)", marginBottom:6}}>
          <span style={{letterSpacing:".12em", textTransform:"uppercase", fontWeight:600}}>Consumo de plan</span>
          <span>—% / 100%</span>
        </div>
        <div className="meter warn">
          <div className="fill" style={{width:"0%"}}></div>
          <div className="tick" style={{left:"66%"}}></div>
        </div>
        <div style={{marginTop:6, fontSize:11, color:"var(--muted)"}}>Esperado hoy: 66% · Marca de referencia</div>
      </div>
    </div>
  );
}

function AccountsBlock({ accounts }) {
  return (
    <section className="section">
      <div className="section-head">
        <div className="title-wrap">
          <span className="h-rule" style={{display:"inline-block", width:28, height:1, background:"var(--ink)"}}></span>
          <h3>Resumen por cuenta</h3>
          <span className="sub">2 cuentas activas · Meta Ads</span>
        </div>
        <span className="example-stamp">Datos de ejemplo</span>
      </div>
      <div className="accounts">
        {accounts.map(a => <AccountCard key={a.id} account={a} />)}
      </div>
    </section>
  );
}

/* ----- Pacing chart ----- */
function PacingBlock({ data }) {
  // Build SVG path strings for expected vs real lines
  const W = 600, H = 200, padX = 30, padY = 24;
  const xs = (i, n) => padX + (i/(n-1)) * (W - padX*2);
  const ys = v => H - padY - (v/100) * (H - padY*2);

  const toPath = arr => arr.map((v,i) => `${i===0?"M":"L"} ${xs(i, arr.length).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");
  const expectedPath = toPath(data.expectedLine);
  const realPath     = toPath(data.realLine);
  const areaPath     = realPath + ` L ${xs(data.realLine.length-1, data.realLine.length).toFixed(1)} ${(H-padY).toFixed(1)} L ${padX} ${(H-padY).toFixed(1)} Z`;

  return (
    <section className="section">
      <div className="section-head">
        <div className="title-wrap">
          <span className="h-rule" style={{display:"inline-block", width:28, height:1, background:"var(--ink)"}}></span>
          <h3>Pacing de gasto</h3>
          <span className="sub">Gasto esperado vs gasto real · mes en curso</span>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:14}}>
          <span className="example-stamp">Ejemplo visual</span>
          <span className="badge warn"><span className="dot"></span>{data.statusToday}</span>
        </div>
      </div>
      <div className="pacing-wrap">
        <div className="pacing-chart">
          <svg className="line-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {/* grid */}
            {[0,25,50,75,100].map(v => (
              <g key={v}>
                <line x1={padX} y1={ys(v)} x2={W-padX} y2={ys(v)} stroke="var(--hairline)" strokeWidth="1"/>
                <text x={padX-6} y={ys(v)+3} fontSize="9" fill="var(--muted)" textAnchor="end" fontFamily="var(--font-mono)">{v}%</text>
              </g>
            ))}
            {/* area under real */}
            <path d={areaPath} fill="rgba(40,128,141,0.08)"/>
            {/* expected dashed */}
            <path d={expectedPath} fill="none" stroke="var(--muted)" strokeWidth="1.3" strokeDasharray="3 4"/>
            {/* real */}
            <path d={realPath} fill="none" stroke="var(--brand-teal)" strokeWidth="2"/>
            {/* today marker */}
            <line x1={xs(data.realLine.length-1, data.realLine.length)} y1={padY} x2={xs(data.realLine.length-1, data.realLine.length)} y2={H-padY} stroke="var(--ink)" strokeWidth="1" strokeDasharray="2 3"/>
            <text x={xs(data.realLine.length-1, data.realLine.length)} y={padY-6} fontSize="9" fill="var(--ink)" textAnchor="end" fontFamily="var(--font-mono)" letterSpacing="1">HOY</text>
          </svg>

          <div className="legend">
            <span className="lg-item"><span className="swatch" style={{background:"var(--brand-teal)"}}></span>Gasto real</span>
            <span className="lg-item"><span className="swatch" style={{background:"var(--muted)", borderTop:"1px dashed var(--muted)"}}></span>Gasto esperado</span>
            <span className="lg-item" style={{marginLeft:"auto"}}><span className="swatch" style={{background:"var(--ink)"}}></span>Día actual</span>
          </div>
        </div>

        <div className="pacing-panel">
          <div className="gauge-row">
            <div className="stat">
              <div className="stat-k">Gasto real</div>
              <div className="stat-v">{data.spentToday}</div>
              <div className="stat-d">del plan mensual</div>
            </div>
            <div className="stat">
              <div className="stat-k">Esperado</div>
              <div className="stat-v">{data.expectedToday}</div>
              <div className="stat-d">a la fecha</div>
            </div>
            <div className="stat">
              <div className="stat-k">Diferencia</div>
              <div className="stat-v" style={{color:"var(--warn)"}}>{data.deltaToday}</div>
              <div className="stat-d">vs curva esperada</div>
            </div>
            <div className="stat">
              <div className="stat-k">Estado</div>
              <div className="stat-v" style={{fontSize:15, fontFamily:"var(--font-sans)", fontWeight:700}}>{data.statusToday}</div>
              <div className="stat-d">según umbral ±10 pts</div>
            </div>
          </div>

          <div>
            <div style={{display:"flex", justifyContent:"space-between", fontSize:10.5, color:"var(--muted)", letterSpacing:".14em", textTransform:"uppercase", fontWeight:700, marginBottom:6}}>
              <span>Día 1</span><span>Día 30</span>
            </div>
            <div className="meter warn">
              <div className="fill" style={{width: data.spentToday}}></div>
              <div className="tick" style={{left: data.expectedToday}}></div>
            </div>
            <div style={{marginTop:8, fontSize:11, color:"var(--muted)"}}>
              La marca vertical indica el gasto esperado a la fecha.
              <br/><span className="example-stamp">Ejemplo visual</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.GD = Object.assign(window.GD || {}, { TopBar, FilterBar, ExecStrip, KpiGrid, AccountsBlock, PacingBlock, Icon });
