/* ============================================================
   MOCK DATA — datos de ejemplo, claramente marcados como tales.
   No conectar a fuentes reales. Reemplazar al integrar.
   ============================================================ */

window.MOCK = {
  meta: {
    lastUpdate: "Pendiente · sin sincronizar",
    connection: "ok", // ok | warn | crit
    range: "Últimos 7 días",
    isExample: true,
  },

  kpis: [
    { id: "spend",      label: "Inversión total",      value: "$—",         unit: "COP",  ctx: "Sin datos cargados", trend: null, status: "empty", placeholder: true },
    { id: "budget",     label: "Presupuesto planeado", value: "$—",         unit: "COP",  ctx: "Por definir en plan mensual", trend: null, status: "empty", placeholder: true },
    { id: "pct",        label: "% consumido",          value: "—",          unit: "%",    ctx: "Pacing sin calcular",      trend: null, status: "empty", placeholder: true },
    { id: "results",    label: "Resultados",           value: "—",          unit: "lead", ctx: "Sin conversiones cargadas", trend: null, status: "empty", placeholder: true },
    { id: "cpr",        label: "Costo por resultado",  value: "$—",         unit: "COP",  ctx: "Cálculo pendiente",         trend: null, status: "empty", placeholder: true },
    { id: "freq",       label: "Frecuencia promedio",  value: "—",          unit: "",     ctx: "Sin impresiones únicas",    trend: null, status: "empty", placeholder: true, tech: true },
    { id: "ctr",        label: "CTR promedio",         value: "—",          unit: "%",    ctx: "Sin clics cargados",        trend: null, status: "empty", placeholder: true, tech: true },
    { id: "active",     label: "Campañas activas",     value: "—",          unit: "",     ctx: "Sin estado conectado",      trend: null, status: "empty", placeholder: true },
    { id: "alerts",     label: "Alertas críticas",     value: "—",          unit: "",     ctx: "Motor de alertas pendiente",trend: null, status: "empty", placeholder: true, alert: true },
  ],

  accounts: [
    {
      id: "gato-co",
      name: "Gato Colombia",
      cities: "Bogotá · Barranquilla",
      status: "warn",
      statusLabel: "Bajo consumo",
      stats: [
        { k: "Inversión",   v: "$—", u: "COP" },
        { k: "Presupuesto", v: "$—", u: "COP" },
        { k: "% consumo",   v: "—",  u: "%"   },
        { k: "Resultados",  v: "—" },
        { k: "Costo / res.",v: "$—", u: "COP" },
        { k: "Frecuencia",  v: "—"  },
        { k: "CTR",         v: "—",  u: "%"   },
        { k: "Campañas",    v: "—"  },
      ],
      pacing: { spent: 0, expected: 0, fill: 0 },
    },
    {
      id: "gato-bga",
      name: "Gato Bucaramanga / Cinco Gatos",
      cities: "Bucaramanga",
      status: "info",
      statusLabel: "Sin datos cargados",
      stats: [
        { k: "Inversión",   v: "$—", u: "COP" },
        { k: "Presupuesto", v: "$—", u: "COP" },
        { k: "% consumo",   v: "—",  u: "%"   },
        { k: "Resultados",  v: "—" },
        { k: "Costo / res.",v: "$—", u: "COP" },
        { k: "Frecuencia",  v: "—"  },
        { k: "CTR",         v: "—",  u: "%"   },
        { k: "Campañas",    v: "—"  },
      ],
      pacing: { spent: 0, expected: 0, fill: 0 },
    },
  ],

  // Para que el chart de pacing tenga una forma legible, dejamos
  // una pista visual MUY claramente etiquetada como “ejemplo visual”.
  pacingExample: {
    isExample: true,
    days: 30,
    expectedLine: [0,3.3,6.6,10,13.3,16.6,20,23.3,26.6,30,33.3,36.6,40,43.3,46.6,50,53.3,56.6,60,63.3,66.6,70,73.3,76.6,80,83.3,86.6,90,93.3,96.6,100],
    realLine:     [0,2.5,5,8,11,13,16,18,21,23,26,29,32,34,37,40,42,45,47,50,52,55,57,59,61,63,66,68,70,72,75],
    statusToday:  "Bajo consumo",
    spentToday:    "62%",
    expectedToday: "83%",
    deltaToday:    "−21 pts",
    deltaSeverity: "warn",
  },

  alerts: [
    {
      sev: "crit", label: "Crítico",
      what: "Sobreconsumo de presupuesto",
      account: "Gato Colombia",
      target: "CMP · Inscripciones Bogotá Q2",
      targetType: "Campaña",
      metric: "—", metricLabel: "% sobre plan",
      reco: "Reducir presupuesto diario o pausar conjuntos con CPR alto.",
    },
    {
      sev: "crit", label: "Crítico",
      what: "Frecuencia alta",
      account: "Gato Bucaramanga",
      target: "CJ · Remarketing 30d Brunch",
      targetType: "Conjunto",
      metric: "—", metricLabel: "Frecuencia",
      reco: "Refrescar creativos o ampliar audiencia para evitar fatiga.",
    },
    {
      sev: "warn", label: "Atención",
      what: "CTR por debajo del umbral",
      account: "Gato Colombia",
      target: "AD · Carrusel chefs Barranquilla v3",
      targetType: "Anuncio",
      metric: "—", metricLabel: "CTR",
      reco: "Probar variantes de copy y primer cuadro del video.",
    },
    {
      sev: "warn", label: "Atención",
      what: "Subconsumo respecto al pacing",
      account: "Gato Bucaramanga",
      target: "CMP · Curso intensivo panadería",
      targetType: "Campaña",
      metric: "—", metricLabel: "% del plan",
      reco: "Ampliar audiencia o subir presupuesto diario para alcanzar pacing.",
    },
    {
      sev: "info", label: "Aviso",
      what: "Campaña sin gasto las últimas 48h",
      account: "Gato Colombia",
      target: "CMP · Open day Bogotá",
      targetType: "Campaña",
      metric: "—", metricLabel: "Gasto 48h",
      reco: "Verificar estado de entrega y configuración de presupuesto.",
    },
    {
      sev: "warn", label: "Atención",
      what: "CPM elevado",
      account: "Gato Bucaramanga",
      target: "CJ · Prospecting Foodies BGA",
      targetType: "Conjunto",
      metric: "—", metricLabel: "CPM",
      reco: "Revisar segmentación y solapamiento con otros conjuntos.",
    },
  ],

  campaigns: [
    { name: "Inscripciones Bogotá Q2",   acct: "Gato Colombia",     status: "active", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", cpc: "$—", cpm: "$—", alert: "crit" },
    { name: "Open day Bogotá",            acct: "Gato Colombia",     status: "paused", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", cpc: "$—", cpm: "$—", alert: "info" },
    { name: "Curso intensivo panadería",  acct: "Gato Bucaramanga",  status: "active", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", cpc: "$—", cpm: "$—", alert: "warn" },
    { name: "Cinco Gatos · Brunch",       acct: "Gato Bucaramanga",  status: "active", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", cpc: "$—", cpm: "$—", alert: null   },
    { name: "Inscripciones Barranquilla", acct: "Gato Colombia",     status: "active", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", cpc: "$—", cpm: "$—", alert: "warn" },
    { name: "Awareness gastronómico CO",  acct: "Gato Colombia",     status: "active", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", cpc: "$—", cpm: "$—", alert: null   },
  ],

  adsets: [
    { name: "Prospecting Foodies BGA",        camp: "Curso intensivo panadería",   acct: "Gato Bucaramanga", status: "active", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", alert: "warn" },
    { name: "Remarketing 30d Brunch",         camp: "Cinco Gatos · Brunch",         acct: "Gato Bucaramanga", status: "active", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", alert: "crit" },
    { name: "Lookalike inscritos 1%",         camp: "Inscripciones Bogotá Q2",      acct: "Gato Colombia",    status: "active", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", alert: null },
    { name: "Padres prospect 25-45",          camp: "Inscripciones Bogotá Q2",      acct: "Gato Colombia",    status: "active", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", alert: "warn" },
    { name: "Open day · interés gastronomía", camp: "Open day Bogotá",              acct: "Gato Colombia",    status: "paused", spend: "$—", results: "—", cpr: "$—", freq: "—", ctr: "—", alert: null },
  ],

  ads: [
    { name: "Carrusel chefs Barranquilla v3", camp: "Inscripciones Barranquilla", acct: "Gato Colombia", format: "Carrusel", status: "active", spend: "$—", results: "—", cpr: "$—", ctr: "—", alert: "warn" },
    { name: "Reel cocina al wok v1",          camp: "Curso intensivo panadería",  acct: "Gato Bucaramanga", format: "Reel",  status: "active", spend: "$—", results: "—", cpr: "$—", ctr: "—", alert: null },
    { name: "Static · plato signature",       camp: "Awareness gastronómico CO",  acct: "Gato Colombia", format: "Imagen", status: "active", spend: "$—", results: "—", cpr: "$—", ctr: "—", alert: null },
    { name: "Reel testimonio egresado",       camp: "Inscripciones Bogotá Q2",    acct: "Gato Colombia", format: "Reel",   status: "active", spend: "$—", results: "—", cpr: "$—", ctr: "—", alert: null },
    { name: "Carrusel cinco gatos brunch",    camp: "Cinco Gatos · Brunch",       acct: "Gato Bucaramanga", format: "Carrusel", status: "active", spend: "$—", results: "—", cpr: "$—", ctr: "—", alert: "crit" },
  ],

  exec: {
    works:  { head: "Qué está funcionando",    body: "Pendiente · al conectar datos se priorizarán las 3 campañas con mejor costo por resultado y CTR sobre el umbral.", foot: "Se actualiza automáticamente cuando el motor reciba métricas." },
    attn:   { head: "Qué requiere atención",   body: "Pendiente · se listarán las campañas con sobreconsumo, fatiga creativa o sin entrega en las últimas 48 horas.",      foot: "Visible para vista interna y vista cliente." },
    next:   { head: "Próximo paso recomendado", body: "Pendiente · al cargar el plan mensual y conectar Meta Ads se calculará pacing y se propondrá ajuste de presupuesto.", foot: "Acción sugerida por el motor de alertas." },
  },
};
