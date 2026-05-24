/* global React, ReactDOM */
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "interno",
  "theme": "light",
  "density": "comfortable",
  "accent": "#28808D"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const [filters, setFilters] = useStateApp({
    range: "Últimos 7 días",
    acct: "all",
    level: "Campañas",
  });

  useEffectApp(() => {
    document.documentElement.dataset.mode = tweaks.mode;
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
    document.documentElement.style.setProperty("--brand-teal", tweaks.accent);
  }, [tweaks.mode, tweaks.theme, tweaks.density, tweaks.accent]);

  const M = window.MOCK;
  const G = window.GD;

  return (
    <div className="app" data-screen-label="Dashboard">
      <G.TopBar />

      <div className="mockup-banner">
        <div>
          <strong>Mockup visual</strong> · No hay datos reales conectados. Todos los valores son placeholders explícitos (
          <span className="example-stamp" style={{display:"inline-flex"}}>—</span>
          <span style={{margin:"0 8px"}}>·</span>
          <span className="example-stamp" style={{display:"inline-flex"}}>$—</span>
          <span style={{margin:"0 8px"}}>·</span>
          <span className="example-stamp" style={{display:"inline-flex"}}>Sin datos</span>
          ).
        </div>
        <div>Vista actual: <strong>{tweaks.mode === "cliente" ? "Cliente" : "Interna"}</strong></div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />

      <ExecStrip data={M.exec} mode={tweaks.mode} />

      <div style={{marginBottom:16, display:"flex", alignItems:"center", gap:14}}>
        <span className="h-rule" style={{display:"inline-block", width:28, height:1, background:"var(--ink)"}}></span>
        <h3 className="h-section">Resumen ejecutivo · KPIs</h3>
        <span style={{fontSize:12, color:"var(--muted)"}}>Métricas principales · {filters.range}</span>
        <span style={{marginLeft:"auto"}} className="example-stamp">Placeholder</span>
      </div>
      <G.KpiGrid items={M.kpis} />

      <div style={{height:8}}></div>
      <G.AccountsBlock accounts={M.accounts} />

      <div style={{height:24}}></div>
      <G.PacingBlock data={M.pacingExample} />

      <div style={{height:24}}></div>
      <G.AlertsPanel alerts={M.alerts} mode={tweaks.mode} />

      <div style={{height:24}}></div>
      <div className="internal-only" style={{marginBottom:16, display:"flex", alignItems:"center", gap:14}}>
        <span className="h-rule" style={{display:"inline-block", width:28, height:1, background:"var(--ink)"}}></span>
        <h3 className="h-section">Análisis por nivel</h3>
        <span style={{fontSize:12, color:"var(--muted)"}}>Vista operativa · campañas, conjuntos y anuncios</span>
      </div>
      <div className="internal-only"><G.PerfTables /></div>

      <div style={{height:24}}></div>
      {/* Closing executive block — for client view */}
      <section className="section" style={{background:"var(--ink)", color:"var(--paper)", borderColor:"var(--ink)"}}>
        <div className="section-head" style={{borderBottomColor:"rgba(255,255,255,.12)"}}>
          <div className="title-wrap">
            <span style={{display:"inline-block", width:28, height:1, background:"var(--paper)"}}></span>
            <h3 style={{color:"var(--paper)"}}>Resumen ejecutivo para cliente</h3>
            <span className="sub" style={{color:"rgba(255,255,255,.55)"}}>Para presentación con Gato Dumas</span>
          </div>
          <span className="example-stamp" style={{color:"rgba(255,255,255,.45)"}}>Vista cliente</span>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0}}>
          {[M.exec.works, M.exec.attn, M.exec.next].map((b, i) => (
            <div key={i} style={{padding:"22px 24px", borderLeft: i===0 ? "0" : "1px solid rgba(255,255,255,.12)"}}>
              <div style={{display:"flex", alignItems:"center", gap:8, fontSize:10.5, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(255,255,255,.5)", fontWeight:700}}>
                <span style={{width:8,height:8,borderRadius:"50%", background: i===0 ? "var(--ok)" : i===1 ? "var(--warn)" : "var(--brand-teal)"}}></span>
                {b.head}
              </div>
              <div style={{fontSize:14, marginTop:10, lineHeight:1.55, fontWeight:500}}>{b.body}</div>
              <div style={{fontSize:11, marginTop:12, color:"rgba(255,255,255,.5)"}}>{b.foot}</div>
            </div>
          ))}
        </div>
      </section>

      <G.FooterRule />

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Vista">
            <window.TweakRadio
              label="Modo"
              value={tweaks.mode}
              onChange={v => setTweak("mode", v)}
              options={[
                { value: "interno", label: "Interno" },
                { value: "cliente", label: "Cliente" },
              ]}
            />
            <window.TweakRadio
              label="Tema"
              value={tweaks.theme}
              onChange={v => setTweak("theme", v)}
              options={[
                { value: "light", label: "Claro" },
                { value: "dark",  label: "Oscuro" },
              ]}
            />
            <window.TweakRadio
              label="Densidad"
              value={tweaks.density}
              onChange={v => setTweak("density", v)}
              options={[
                { value: "comfortable", label: "Cómoda" },
                { value: "compact",     label: "Compacta" },
              ]}
            />
          </window.TweakSection>
          <window.TweakSection label="Acento institucional">
            <window.TweakColor
              label="Color"
              value={tweaks.accent}
              onChange={v => setTweak("accent", v)}
              options={["#28808D", "#1F6772", "#798184", "#6FB6BF"]}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
