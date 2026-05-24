import type { AccountVM, Severity } from "@/lib/dashboard/design-types";

function StatusBadge({ status, label }: { status: AccountVM["status"]; label: string }) {
  const cls =
    status === "ok"
      ? "ok"
      : status === "warn"
        ? "warn"
        : status === "crit"
          ? "crit"
          : status === "info"
            ? "info"
            : "ghost";
  return (
    <span className={`badge ${cls}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

function AccountCard({ account, active }: { account: AccountVM; active: boolean }) {
  const meterTone: Severity = account.pacing.tone;
  return (
    <div className={"account-card" + (active ? " active" : "")}>
      <div className="ac-head">
        <div className="ac-title">
          <span
            className="instituto-frame"
            style={{ padding: "4px 8px", fontSize: 9, letterSpacing: ".18em", fontWeight: 700 }}
          >
            GD
          </span>
          <div>
            <h4>{account.name}</h4>
            <div className="ac-cities">{account.cities}</div>
          </div>
        </div>
        <StatusBadge status={account.status} label={account.statusLabel} />
      </div>

      <div className="grid-stats">
        {account.stats.map((s, i) => (
          <div className="stat" key={i}>
            <div className="stat-k">{s.k}</div>
            <div className="stat-v">
              {s.v}
              {s.u && <span className="u">{s.u}</span>}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--muted)",
            marginBottom: 6,
          }}
        >
          <span style={{ letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600 }}>
            Consumo de plan
          </span>
          <span>{account.pacing.label}</span>
        </div>
        <div className={`meter ${meterTone}`}>
          <div className="fill" style={{ width: `${account.pacing.fill}%` }} />
          {account.pacing.marker > 0 && (
            <div className="tick" style={{ left: `${account.pacing.marker}%` }} />
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
          La marca vertical indica el gasto esperado a la fecha.
        </div>
      </div>
    </div>
  );
}

export default function AccountSummary({
  accounts,
  activeAccount = "all",
}: {
  accounts: AccountVM[];
  activeAccount?: string;
}) {
  const focused = activeAccount !== "all";
  return (
    <section className="section">
      <div className="section-head">
        <div className="title-wrap">
          <span className="h-rule" />
          <h3>Resumen por cuenta</h3>
          <span className="sub">
            {focused
              ? "Cuenta en foco resaltada · ambas siempre visibles para comparar"
              : "Gato Colombia y Gato Bucaramanga · Meta Ads"}
          </span>
        </div>
      </div>
      <div className="accounts">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} active={a.id === activeAccount} />
        ))}
      </div>
    </section>
  );
}
