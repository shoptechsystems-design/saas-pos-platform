import { IonIcon } from "@ionic/react";
import { barChartOutline, downloadOutline, lockClosedOutline } from "ionicons/icons";
import { useMemo, useState } from "react";
import { Async, Card, Empty, Screen, Seg, Stat, useNotify } from "~/components/ui";
import { daysAgo, money, moneyShort, startOfDay } from "~/lib/format";
import { savePdf } from "~/lib/native";
import { useList } from "~/lib/queries";
import { api, qs } from "~/lib/rest";
import { useSession } from "~/lib/session";
import type { Overview, PdfResult } from "~/lib/types";

type Range = "today" | "7d" | "30d" | "month" | "custom";
const GREEN = "var(--c-green)"; const RED = "var(--c-red)";
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

function rangeMs(r: Range, a: string, b: string): { from: number; to: number } | null {
  const end = new Date().setHours(23, 59, 59, 999); // through the end of today
  if (r === "today") return { from: startOfDay(), to: end };
  if (r === "7d") return { from: daysAgo(6), to: end };
  if (r === "30d") return { from: daysAgo(29), to: end };
  if (r === "month") { const d = new Date(); return { from: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), to: end }; }
  if (!a || !b) return null;
  const from = new Date(`${a}T00:00:00`).getTime(), to = new Date(`${b}T23:59:59`).getTime();
  return from <= to ? { from, to } : null;
}

const Line = ({ k, v, color, bold }: { k: string; v: string; color?: string; bold?: boolean }) => <div className="row between small"><span className="muted">{k}</span><span className={`mono ${bold ? "black" : "bold"}`} style={color ? { color } : undefined}>{v}</span></div>;

export default function Reports() {
  const s = useSession(); const n = useNotify();
  const cur = s.tenant?.currency;
  const [range, setRange] = useState<Range>("7d");
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [busy, setBusy] = useState(false);
  // Round to the minute so the query key stays stable between renders.
  const r = useMemo(() => { const x = rangeMs(range, a, b); return x ? { from: x.from, to: Math.floor(x.to / 60000) * 60000 } : null; }, [range, a, b]);
  const q = useList<Overview>(["reports", "overview", r?.from ?? 0, r?.to ?? 0], `/reports/overview${qs({ from: r?.from, to: r?.to })}`, s.can.admin && !!r);
  const pdf = async () => {
    setBusy(true);
    try { const res = await api.get<PdfResult>(`/reports/reconciliation${qs({ from: r?.from, to: r?.to })}`); await savePdf(res); if (res.summary) n.ok(`Net ${money(res.summary.net, cur)} from ${res.summary.orderCount} order${res.summary.orderCount === 1 ? "" : "s"}`); }
    catch (e) { n.fail(e); } finally { setBusy(false); }
  };
  if (!s.can.admin) return <Screen title="Reports" back="/more"><Empty icon={lockClosedOutline} title="Owner access only" hint="Financial reports are available to the business owner / admin." /></Screen>;
  return (
    <Screen title="Reports" back="/more" onRefresh={() => q.refetch()}>
      <Seg value={range} onChange={setRange} options={[{ value: "today", label: "Today" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "month", label: "Month" }, { value: "custom", label: "Custom" }]} />
      {range === "custom" && <div className="grid2"><input className="input" type="date" aria-label="From date" value={a} max={b || undefined} onChange={e => setA(e.target.value)} /><input className="input" type="date" aria-label="To date" value={b} min={a || undefined} onChange={e => setB(e.target.value)} /></div>}
      {!r ? <Empty icon={barChartOutline} title="Pick a date range" hint="Choose both a start and an end date." /> :
        <Async q={q}>
          {o => <>
            <div className="hero"><div className="label">Revenue</div><div className="big">{money(o.revenue, cur)}</div><div className="small" style={{ color: "#cbd5e1" }}>{o.orders} order{o.orders === 1 ? "" : "s"} · avg {money(o.avgOrder, cur)}</div></div>
            <div className="kpis">
              <Stat label="Gross profit" value={money(o.grossProfit, cur)} tone={o.grossProfit >= 0 ? GREEN : RED} />
              <Stat label="Net profit" value={money(o.netProfit, cur)} tone={o.netProfit >= 0 ? GREEN : RED} sub="After expenses" />
              <Stat label="Expenses" value={money(o.expenses, cur)} />
              <Stat label="Refunds" value={money(o.refunds.total, cur)} sub={`${o.refunds.count} refunded`} />
            </div>
            <Card><div className="h2" style={{ marginBottom: 10 }}>Profit breakdown</div><div className="stack" style={{ gap: 8 }}>
              <Line k="Revenue" v={money(o.revenue, cur)} /><Line k="Tax collected" v={`- ${money(o.tax, cur)}`} /><Line k="Cost of goods" v={`- ${money(o.cogs, cur)}`} />
              <Line k="Gross profit" v={money(o.grossProfit, cur)} bold /><Line k="Operating expenses" v={`- ${money(o.expenses, cur)}`} />
              <Line k="Net profit" v={money(o.netProfit, cur)} color={o.netProfit >= 0 ? GREEN : RED} bold /><Line k="Discounts given" v={money(o.discounts, cur)} />
            </div></Card>
            {o.daily.length > 0 && <Card><div className="h2" style={{ marginBottom: 12 }}>Daily sales</div>
              <div className="bars">{(() => { const days = o.daily.slice(-14); const max = Math.max(...days.map(d => d.total), 1); return days.map(d => <div className="b" key={d.day} title={`${d.day}: ${money(d.total, cur)}`}><i style={{ height: `${Math.max((d.total / max) * 100, 3)}%` }} /><span>{d.day.slice(8, 10)}</span></div>); })()}</div>
              <div className="tiny muted" style={{ marginTop: 6 }}>Peak day {moneyShort(Math.max(...o.daily.map(d => d.total)), cur)}</div></Card>}
            {o.byCategory.length > 0 && <Card><div className="h2" style={{ marginBottom: 10 }}>Sales by category</div><div className="stack" style={{ gap: 12 }}>{o.byCategory.map(c => <div key={c.name}><div className="row between small"><b>{c.name}</b><span className="mono">{money(c.revenue, cur)}</span></div><div className="meter" style={{ marginTop: 5 }}><i style={{ width: `${(c.revenue / (o.byCategory[0].revenue || 1)) * 100}%` }} /></div><div className="tiny muted">{c.units} units</div></div>)}</div></Card>}
            {o.byHour.length > 0 && <Card><div className="h2" style={{ marginBottom: 10 }}>Busiest hours</div><div className="stack" style={{ gap: 8 }}>{[...o.byHour].sort((x, y) => y.total - x.total).slice(0, 5).map(h => <Line key={h.hour} k={`${hourLabel(h.hour)} · ${h.orders} order${h.orders === 1 ? "" : "s"}`} v={money(h.total, cur)} />)}</div></Card>}
            {o.topCustomers.length > 0 && <Card><div className="h2" style={{ marginBottom: 10 }}>Top customers</div><div className="stack" style={{ gap: 8 }}>{o.topCustomers.map(c => <Line key={c.id} k={`${c.name} · ${c.orders} order${c.orders === 1 ? "" : "s"}`} v={money(c.total, cur)} />)}</div></Card>}
            {o.expenseByCategory.length > 0 && <Card><div className="h2" style={{ marginBottom: 10 }}>Expenses by category</div><div className="stack" style={{ gap: 8 }}>{o.expenseByCategory.map(c => <Line key={c.name} k={c.name} v={money(c.total, cur)} />)}</div></Card>}
            {o.orders === 0 && <Empty icon={barChartOutline} title="No sales in this period" hint="Try a wider date range." />}
          </>}
        </Async>}
      <button className="btn btn-dark btn-block" disabled={busy || !r} onClick={pdf}><IonIcon icon={downloadOutline} />{busy ? "Preparing…" : "Reconciliation PDF"}</button>
    </Screen>
  );
}
