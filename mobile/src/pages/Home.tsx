import { IonIcon } from "@ionic/react";
import { alertCircleOutline, cartOutline, peopleOutline, receiptOutline, trendingUpOutline } from "ionicons/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import QueueBanner from "~/components/QueueBanner";
import { Async, Card, Empty, Pill, Row, Screen, Stat } from "~/components/ui";
import { dateTime, initials, money, moneyShort, num, roleLabel, titleCase } from "~/lib/format";
import { useLowStock, usePaymentMix, useRecentSales, useStats, useTopProducts, useTrend } from "~/lib/queries";
import { useSession } from "~/lib/session";

export default function Home() {
  const s = useSession(); const nav = useNavigate(); const qc = useQueryClient();
  const cur = s.tenant?.currency;
  const stats = useStats(); const trend = useTrend(14); const top = useTopProducts(30); const mix = usePaymentMix(30); const low = useLowStock(); const recent = useRecentSales();
  const refresh = () => qc.invalidateQueries();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const maxTrend = Math.max(1, ...(trend.data ?? []).map(p => p.total));
  const mixTotal = (mix.data ?? []).reduce((a, p) => a + p.total, 0) || 1;

  return (
    <Screen title={s.tenant?.name ?? "Karyano"} onRefresh={refresh} right={<div className="avatar round" style={{ width: 36, height: 36 }}>{initials(s.user?.name)}</div>}>
      <QueueBanner currency={cur} />
      <div className="hero">
        <div className="label">{greet}, {s.user?.name?.split(" ")[0] ?? "there"}</div>
        <div className="big mono">{stats.data ? money(stats.data.todaySales, cur) : "—"}</div>
        <div style={{ opacity: 0.85, fontSize: 13 }}>Today's sales · {stats.data?.todayOrders ?? 0} order{stats.data?.todayOrders === 1 ? "" : "s"} · <span style={{ opacity: 0.8 }}>{roleLabel(s.role)}</span></div>
        {s.can.sell && <button className="btn btn-block" style={{ marginTop: 14, background: "#fff", color: "var(--c-navy)" }} onClick={() => nav("/sell")}><IonIcon icon={cartOutline} /> New sale</button>}
      </div>

      <div className="kpis">
        <Stat label="This month" value={stats.data ? moneyShort(num(stats.data.monthSales), cur) : "—"} />
        <Stat label="Customers" value={String(stats.data?.customers ?? "—")} />
        <Stat label="Products" value={String(stats.data?.products ?? "—")} />
        <Stat label="Low stock" value={String(stats.data?.lowStock ?? "—")} tone={stats.data?.lowStock ? "var(--c-amber)" : undefined} />
      </div>

      <div className="section-title">Last 14 days</div>
      <Card>
        <Async q={trend} empty={d => d.length ? null : <div className="muted small center">No sales in the last 14 days yet.</div>}>
          {d => (
            <div className="bars">{d.slice(-14).map(p => <div className="b" key={p.day}><i style={{ height: `${Math.max(3, (p.total / maxTrend) * 100)}%` }} title={`${p.day}: ${money(p.total, cur)}`} /><span>{p.day.slice(8, 10)}</span></div>)}</div>
          )}
        </Async>
      </Card>

      <div className="section-title">Top products · 30 days</div>
      <Card pad={false}>
        <Async q={top} empty={d => d.length ? null : <Empty icon={trendingUpOutline} title="No sales yet" hint="Top sellers appear after your first sales." />}>
          {d => <div className="divide">{d.map((p, i) => <Row key={p.productId} icon={receiptOutline} title={`${i + 1}. ${p.name}`} sub={`${p.units} sold`} right={<b className="mono">{moneyShort(p.revenue, cur)}</b>} />)}</div>}
        </Async>
      </Card>

      <div className="section-title">Payment methods · 30 days</div>
      <Card>
        <Async q={mix} empty={d => d.length ? null : <div className="muted small center">No payments recorded yet.</div>}>
          {d => <div className="stack" style={{ gap: 12 }}>{d.map(p => <div key={p.method}><div className="row between small"><b style={{ textTransform: "capitalize" }}>{p.method}</b><span className="muted mono">{moneyShort(p.total, cur)} · {p.orders}</span></div><div className="meter" style={{ marginTop: 5 }}><i style={{ width: `${(p.total / mixTotal) * 100}%` }} /></div></div>)}</div>}
        </Async>
      </Card>

      {(low.data?.length ?? 0) > 0 && <>
        <div className="section-title">Needs restocking</div>
        <Card pad={false}><div className="divide">{low.data!.slice(0, 5).map(p => <Row key={p.id} icon={alertCircleOutline} tone="amber" title={p.name} sub={p.sku} right={<Pill tone={p.stockQuantity === 0 ? "bad" : "warn"}>{p.stockQuantity} left</Pill>} />)}</div></Card>
      </>}

      <div className="section-title">Recent sales</div>
      <Card pad={false}>
        <Async q={recent} empty={d => d.length ? null : <Empty icon={peopleOutline} title="No sales yet" hint="Ring up your first sale from the Sell tab." />}>
          {d => <div className="divide">{d.map(r => <Row key={r.sale.id} icon={receiptOutline} tone="blue" onClick={() => nav("/orders")} title={r.sale.saleNumber} sub={`${r.customer?.name ?? "Walk-in"} · ${dateTime(r.sale.createdAt)}`} right={<div className="right"><b className="mono">{money(r.sale.total, cur)}</b><div><Pill tone={r.sale.status === "completed" ? "ok" : "warn"}>{titleCase(r.sale.status)}</Pill></div></div>} />)}</div>}
        </Async>
      </Card>
    </Screen>
  );
}
