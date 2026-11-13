import { IonIcon } from "@ionic/react";
import { alertCircleOutline, arrowDownOutline, arrowUpOutline, bookOutline, cartOutline, cashOutline, cubeOutline, peopleOutline, receiptOutline, trendingUpOutline, walletOutline } from "ionicons/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QueueBanner from "~/components/QueueBanner";
import { AreaChart, Sparkline } from "~/components/charts";
import { SaleRow } from "~/components/SaleRow";
import { Async, Avatar, Card, Empty, Pill, Row, Screen, SectionHead } from "~/components/ui";
import { dateTime, initials, money, moneyShort, num, roleLabel } from "~/lib/format";
import { tap } from "~/lib/native";
import { useCreditSummary, useLowStock, usePaymentMix, useRecentSales, useStats, useTopProducts, useTrend } from "~/lib/queries";
import { useSession } from "~/lib/session";

const MIX_COLORS: Record<string, string> = { cash: "#14b8a6", card: "#6366f1", transfer: "#fb7c66", credit: "#f59e0b", other: "#94a3b8" };
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayLabel = (day: string) => new Date(day + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function Home() {
  const s = useSession(); const nav = useNavigate(); const qc = useQueryClient();
  const cur = s.tenant?.currency;
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const credit = useCreditSummary();
  const stats = useStats(); const trend = useTrend(days); const week = useTrend(7); const top = useTopProducts(30); const mix = usePaymentMix(30); const low = useLowStock(); const recent = useRecentSales();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Fill days with no sales so charts show every date.
  const series = useMemo(() => {
    const byDay = new Map((trend.data ?? []).map(p => [p.day, p.total]));
    return Array.from({ length: days }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); const k = ymd(d); return { day: k, label: dayLabel(k), value: byDay.get(k) ?? 0 }; });
  }, [trend.data, days]);
  const spark = useMemo(() => {
    const byDay = new Map((week.data ?? []).map(p => [p.day, p.total]));
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return byDay.get(ymd(d)) ?? 0; });
  }, [week.data]);

  const today = num(stats.data?.todaySales);
  const yKey = ymd(new Date(Date.now() - 86_400_000));
  const yesterday = (week.data ?? []).find(p => p.day === yKey)?.total ?? 0;
  const delta = yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : null;
  const periodTotal = series.reduce((a, p) => a + p.value, 0);
  const mixTotal = (mix.data ?? []).reduce((a, p) => a + p.total, 0) || 1;
  const topMax = Math.max(1, ...(top.data ?? []).map(p => p.revenue));
  const first = s.user?.name?.split(" ")[0] ?? "there";

  const qa: { label: string; icon: string; to: string; bg: string; fg: string; show: boolean }[] = [
    { label: "New sale", icon: cartOutline, to: "/sell", bg: "#e6f4f2", fg: "#0f766d", show: s.can.sell },
    { label: "Expense", icon: walletOutline, to: "/more/expenses", bg: "#fff4e5", fg: "#c2410c", show: true },
    { label: "Shift", icon: cashOutline, to: "/more/shifts", bg: "#eef2ff", fg: "#4f46e5", show: true },
    { label: "Stock", icon: cubeOutline, to: "/inventory", bg: "#fdf2f8", fg: "#be185d", show: true },
  ];

  return (
    <Screen brand title={s.tenant?.name ?? "Karyano"} subtitle={`${greet}, ${first}`} strip={
      <div className="has-spark" style={{ position: "relative" }}>
        <div className="strip-top"><span className="strip-label">Today</span><span className="strip-chip">{roleLabel(s.role)}</span></div>
        <div className="strip-sub">Total sales</div>
        <div className="strip-big mono">{stats.data ? money(stats.data.todaySales, cur) : "—"}</div>
        <div className="strip-meta">
          {delta !== null && <span className={`delta ${Math.abs(delta) < 0.5 ? "flat" : delta > 0 ? "up" : "down"}`}><IonIcon icon={delta >= 0 ? arrowUpOutline : arrowDownOutline} />{Math.abs(delta).toFixed(0)}% vs yesterday</span>}
          <span>{stats.data?.todayOrders ?? 0} order{stats.data?.todayOrders === 1 ? "" : "s"} today</span>
        </div>
        <div style={{ height: 52 }} />
        <Sparkline values={spark} className="strip-spark" />
      </div>} onRefresh={() => qc.invalidateQueries()} right={<div className="avatar round" style={{ width: 38, height: 38 }}>{initials(s.user?.name)}</div>}>
      <QueueBanner currency={cur} />

      <div className="qa">{qa.filter(a => a.show).map(a => (
        <button key={a.label} onClick={() => { tap(); nav(a.to); }}><span className="ico" style={{ background: a.bg, color: a.fg }}><IonIcon icon={a.icon} /></span>{a.label}</button>))}</div>

      <div className="kpis">
        <div className="card kpi2"><div className="icon-chip green"><IonIcon icon={trendingUpOutline} /></div><div className="t"><div className="l">This month</div><div className="v mono">{stats.data ? moneyShort(num(stats.data.monthSales), cur) : "—"}</div></div></div>
        <div className="card kpi2" onClick={() => nav("/more/customers?owes=1")}><div className={`icon-chip ${Number(stats.data?.outstandingCredit) > 0 ? "red" : "green"}`}><IonIcon icon={bookOutline} /></div><div className="t"><div className="l">Udhaar owed</div><div className="v mono" style={Number(stats.data?.outstandingCredit) > 0 ? { color: "var(--c-red)" } : undefined}>{stats.data ? moneyShort(num(stats.data.outstandingCredit), cur) : "—"}</div></div></div>
        <div className="card kpi2"><div className="icon-chip"><IonIcon icon={cubeOutline} /></div><div className="t"><div className="l">Products</div><div className="v mono">{stats.data?.products ?? "—"}</div></div></div>
        <div className="card kpi2" onClick={() => nav("/inventory")}><div className={`icon-chip ${stats.data?.lowStock ? "amber" : "green"}`}><IonIcon icon={alertCircleOutline} /></div><div className="t"><div className="l">Low stock</div><div className="v mono" style={stats.data?.lowStock ? { color: "var(--c-amber)" } : undefined}>{stats.data?.lowStock ?? "—"}</div></div></div>
      </div>

      <Card>
        <div className="chart-head">
          <div><div className="tiny muted bold">REVENUE · LAST {days} DAYS</div><div className="h1 mono" style={{ fontSize: 22, marginTop: 2 }}>{moneyShort(periodTotal, cur)}</div></div>
          <div className="pillseg">{([7, 14, 30] as const).map(d => <button key={d} className={days === d ? "on" : ""} onClick={() => { tap(); setDays(d); }}>{d}D</button>)}</div>
        </div>
        {trend.isLoading ? <div className="skel" style={{ height: 168, borderRadius: 14 }} /> : <AreaChart data={series} format={v => money(v, cur)} />}
      </Card>

      <SectionHead title="Top products" action="This month" />
      <Card pad={false}>
        <Async q={top} empty={d => d.length ? null : <Empty icon={trendingUpOutline} title="No sales yet" hint="Top sellers appear after your first sales." />}>
          {d => <div className="divide">{d.slice(0, 5).map((p, i) => (
            <div className="list-row" key={p.productId}><div className={`rank ${i < 3 ? `r${i + 1}` : ""}`}>{i + 1}</div>
              <div className="grow"><div className="row between"><b className="ellipsis" style={{ color: "var(--c-navy)" }}>{p.name}</b><b className="mono">{moneyShort(p.revenue, cur)}</b></div>
                <div className="meter sm"><i style={{ width: `${(p.revenue / topMax) * 100}%`, background: i === 0 ? "linear-gradient(90deg,#14b8a6,#0f766d)" : "#7dd3c8" }} /></div>
                <div className="tiny muted" style={{ marginTop: 4 }}>{p.units} sold</div></div></div>))}</div>}
        </Async>
      </Card>

      {(credit.data?.debtors ?? 0) > 0 && <>
        <SectionHead title="Udhaar" action="See all" onAction={() => nav("/more/customers?owes=1")} />
        <Card pad={false}>
          <div className="row between" style={{ padding: "12px 14px", borderBottom: "1px solid var(--c-line)" }}>
            <div><div className="tiny muted bold">TOTAL OWED TO YOU</div><div className="h1 mono" style={{ fontSize: 22, color: "var(--c-red)" }}>{money(credit.data!.outstanding, cur)}</div></div>
            <div className="right small muted">{credit.data!.debtors} customer{credit.data!.debtors === 1 ? "" : "s"}{credit.data!.overdueCount ? <div style={{ color: "var(--c-amber)", fontWeight: 700 }}>{credit.data!.overdueCount} overdue</div> : null}</div>
          </div>
          <div className="divide">{credit.data!.top.slice(0, 4).map(d => (
            <Row key={d.id} lead={<Avatar name={d.name} />} onClick={() => nav("/more/customers?owes=1")} title={d.name} sub={d.lastPaymentAt ? `last paid ${d.ageDays}d ago` : `owing for ${d.ageDays}d`}
              right={<div className="right"><b className="mono" style={{ color: "var(--c-red)" }}>{moneyShort(d.balance, cur)}</b>{d.overdue && <div><Pill tone="warn">Overdue</Pill></div>}</div>} />))}</div>
        </Card>
      </>}

      <SectionHead title="How customers pay" action="30 days" />
      <Card>
        <Async q={mix} empty={d => d.length ? null : <div className="muted small center">No payments recorded yet.</div>}>
          {d => <>
            <div className="stackbar">{d.map(p => <i key={p.method} style={{ width: `${(p.total / mixTotal) * 100}%`, background: MIX_COLORS[p.method] ?? MIX_COLORS.other }} />)}</div>
            <div className="legend">{[...d].sort((a, b) => b.total - a.total).map(p => (
              <div className="li" key={p.method}><span className="dot" style={{ background: MIX_COLORS[p.method] ?? MIX_COLORS.other }} /><b style={{ textTransform: "capitalize", color: "var(--c-navy)" }}>{p.method}</b>
                <span className="muted small">{Math.round((p.total / mixTotal) * 100)}% · {p.orders} orders</span><b className="mono" style={{ marginLeft: "auto" }}>{moneyShort(p.total, cur)}</b></div>))}</div></>}
        </Async>
      </Card>

      {(low.data?.length ?? 0) > 0 && <>
        <SectionHead title="Needs restocking" action="Inventory" onAction={() => nav("/inventory")} />
        <Card pad={false}><div className="divide">{low.data!.slice(0, 4).map(p => <Row key={p.id} icon={alertCircleOutline} tone="amber" title={p.name} sub={p.sku} right={<Pill tone={p.stockQuantity === 0 ? "bad" : "warn"}>{p.stockQuantity === 0 ? "Out" : `${p.stockQuantity} left`}</Pill>} />)}</div></Card>
      </>}

      <SectionHead title="Recent sales" action="See all" onAction={() => nav("/orders")} />
      <Card pad={false}>
        <Async q={recent} empty={d => d.length ? null : <Empty icon={receiptOutline} title="No sales yet" hint="Ring up your first sale from the Sell tab." />}>
          {d => <div className="divide">{d.slice(0, 6).map(r => <SaleRow key={r.sale.id} sale={r.sale} customer={r.customer} cur={cur} when={dateTime(r.sale.createdAt)} onClick={() => nav("/orders")} />)}</div>}
        </Async>
      </Card>
    </Screen>
  );
}
