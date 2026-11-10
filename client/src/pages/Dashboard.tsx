import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Landmark,
  Minus,
  Package,
  Plus,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { moneyWhole as money } from "@/lib/format";

const RANGES = [7, 14, 30] as const;

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)));

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Delta({ current, previous, label }: { current: number; previous: number; label: string }) {
  if (!previous) return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400"><Minus className="h-3 w-3" /> {label}</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(pct).toFixed(1)}% <span className="font-medium text-slate-400">{label}</span>
    </span>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-12px_rgba(15,23,42,0.08)] ${className}`}>{children}</section>;
}

function PanelHeader({ eyebrow, title, icon: Icon, tone = "text-slate-400" }: { eyebrow: string; title: string; icon?: typeof Receipt; tone?: string }) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500">{eyebrow}</p>
        <h4 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{title}</h4>
      </div>
      {Icon && <Icon className={`h-5 w-5 ${tone}`} />}
    </div>
  );
}

function Empty({ icon: Icon, title, hint, action }: { icon: typeof Receipt; title: string; hint: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200"><Icon className="h-4 w-4 text-slate-400" /></span>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-500">{hint}</p>
      {action && <button onClick={action.onClick} className="mt-4 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">{action.label}</button>}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

const methodMeta: Record<string, { label: string; icon: typeof Banknote; color: string }> = {
  cash: { label: "Cash", icon: Banknote, color: "#14b8a6" },
  card: { label: "Card", icon: CreditCard, color: "#6366f1" },
  transfer: { label: "Transfer", icon: Landmark, color: "#fb7c66" },
};

function ChartTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { label: string; total: number; orders: number };
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl">
      <p className="text-[11px] font-semibold text-slate-500">{p.label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{money(p.total)}</p>
      <p className="text-[11px] text-slate-500">{p.orders} {p.orders === 1 ? "order" : "orders"}</p>
    </div>
  );
}

export default function DashboardView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);

  const settings = trpc.tenant.settings.useQuery();
  const stats = trpc.dashboard.stats.useQuery();
  const trend = trpc.dashboard.salesTrend.useQuery({ days: range });
  const lowStock = trpc.dashboard.lowStock.useQuery();
  const recent = trpc.dashboard.recentSales.useQuery();
  const top = trpc.dashboard.topProducts.useQuery({ days: range });
  const mix = trpc.dashboard.paymentMix.useQuery({ days: range });

  // Fill missing days so the chart never skips a date.
  const series = useMemo(() => {
    const byDay = new Map((trend.data ?? []).map(r => [r.day, r]));
    const out: { key: string; label: string; total: number; orders: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      const r = byDay.get(k);
      out.push({ key: k, label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), total: r?.total ?? 0, orders: r?.orders ?? 0 });
    }
    return out;
  }, [trend.data, range]);

  const periodRevenue = series.reduce((s, d) => s + d.total, 0);
  const periodOrders = series.reduce((s, d) => s + d.orders, 0);
  const periodAvg = periodOrders ? periodRevenue / periodOrders : 0;
  const best = series.reduce((b, d) => (d.total > b.total ? d : b), series[0] ?? { label: "", total: 0, orders: 0, key: "" });
  const yesterday = series[series.length - 2]?.total ?? 0;

  const todaySales = Number(stats.data?.todaySales ?? 0);
  const todayOrders = Number(stats.data?.todayOrders ?? 0);
  const monthSales = Number(stats.data?.monthSales ?? 0);
  const productCount = Number(stats.data?.products ?? 0);
  const lowCount = Number(stats.data?.lowStock ?? 0);
  const customerCount = Number(stats.data?.customers ?? 0);
  const todayAvg = todayOrders ? todaySales / todayOrders : 0;
  const readiness = productCount ? Math.round(((productCount - lowCount) / productCount) * 100) : null;

  const mixTotal = (mix.data ?? []).reduce((s, m) => s + m.total, 0);
  const topMax = Math.max(...(top.data ?? []).map(t => t.revenue), 1);
  const noSalesEver = !trend.isLoading && periodOrders === 0;
  const name = settings.data?.name;

  const kpis = [
    { label: "Today's sales", value: money(todaySales), icon: Receipt, foot: <Delta current={todaySales} previous={yesterday} label="vs yesterday" />, tone: "bg-teal-50 text-teal-600" },
    { label: "Month to date", value: money(monthSales), icon: TrendingUp, foot: <span className="text-[11px] font-medium text-slate-400">{new Date().toLocaleDateString("en-GB", { month: "long" })} revenue</span>, tone: "bg-indigo-50 text-indigo-600" },
    { label: "Avg. order value", value: money(todayOrders ? todayAvg : periodAvg), icon: ShoppingBag, foot: <span className="text-[11px] font-medium text-slate-400">{todayOrders ? `${todayOrders} orders today` : `last ${range} days`}</span>, tone: "bg-orange-50 text-orange-600" },
    { label: "Customers", value: customerCount.toLocaleString("en-PK"), icon: Users, foot: <span className="text-[11px] font-medium text-slate-400">in your directory</span>, tone: "bg-sky-50 text-sky-600" },
  ];

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-[-0.015em] text-slate-900">{greeting()}{name ? `, ${name}` : ""}.</h3>
          <p className="mt-1 text-sm text-slate-500">Here's how your business is performing.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Date range">
            {RANGES.map(r => (
              <button key={r} role="tab" aria-selected={range === r} onClick={() => setRange(r)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${range === r ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"}`}>{r}D</button>
            ))}
          </div>
          <button onClick={() => setActiveTab("pos")} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-teal-400 to-teal-500 px-4 py-2.5 text-xs font-bold text-teal-950 shadow-[0_10px_24px_-10px_rgba(20,184,166,0.8)] transition hover:-translate-y-0.5"><Plus className="h-3.5 w-3.5" /> New sale</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[132px]" />)
          : kpis.map(k => (
              <Panel key={k.label} className="!p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold text-slate-500">{k.label}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></span>
                </div>
                <p className="mt-3 text-[26px] font-extrabold leading-none tracking-tight text-slate-900">{k.value}</p>
                <div className="mt-3">{k.foot}</div>
              </Panel>
            ))}
      </div>

      {/* revenue + top sellers */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Revenue · last {range} days</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{money(periodRevenue)}</p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <p><span className="font-bold text-slate-900">{periodOrders}</span> orders</p>
              <p className="mt-0.5">avg <span className="font-bold text-slate-900">{money(periodAvg)}</span></p>
            </div>
          </div>
          {trend.isLoading ? <Skeleton className="mt-4 h-64" /> : noSalesEver ? (
            <div className="mt-4"><Empty icon={TrendingUp} title="No sales in this period" hint="Ring up your first sale at the POS terminal and your revenue trend will appear here." action={{ label: "Open POS terminal", onClick: () => setActiveTab("pos") }} /></div>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="key" tickFormatter={(k: string) => new Date(k + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={range === 7 ? 0 : range === 14 ? 1 : 4} />
                  <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#14b8a6", strokeOpacity: 0.3 }} />
                  <Area type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2.5} fill="url(#rev)" activeDot={{ r: 5, fill: "#0d9488", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {!noSalesEver && !trend.isLoading && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <span className="text-slate-500">Best day <span className="font-bold text-slate-900">{best.label}</span></span>
              <span className="font-bold text-teal-700">{money(best.total)}</span>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader eyebrow={`Top sellers · ${range} days`} title="Best performing products" icon={TrendingUp} tone="text-teal-600" />
          {top.isLoading ? <Skeleton className="h-56" /> : !top.data?.length ? (
            <Empty icon={Package} title="No product sales yet" hint="Your best sellers will rank here once sales come in." />
          ) : (
            <ol className="space-y-4">
              {top.data.map((t, i) => (
                <li key={t.productId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">{i + 1}</span><span className="truncate font-semibold text-slate-800">{t.name}</span></span>
                    <span className="shrink-0 text-xs font-bold text-slate-900">{money(t.revenue)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: `${(t.revenue / topMax) * 100}%` }} /></div>
                    <span className="w-14 shrink-0 text-right text-[11px] text-slate-400">{t.units} sold</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {/* payment mix + inventory + low stock */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel>
          <PanelHeader eyebrow={`Payments · ${range} days`} title="How customers pay" icon={CreditCard} tone="text-indigo-500" />
          {mix.isLoading ? <Skeleton className="h-40" /> : !mixTotal ? (
            <Empty icon={CreditCard} title="No payments yet" hint="Cash, card and transfer splits show here." />
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                {(mix.data ?? []).map(m => <div key={m.method} title={m.method} style={{ width: `${(m.total / mixTotal) * 100}%`, background: methodMeta[m.method]?.color ?? "#94a3b8" }} />)}
              </div>
              <ul className="mt-5 space-y-3.5">
                {[...(mix.data ?? [])].sort((a, b) => b.total - a.total).map(m => {
                  const meta = methodMeta[m.method] ?? { label: m.method, icon: CreditCard, color: "#94a3b8" };
                  return (
                    <li key={m.method} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2.5 font-semibold text-slate-700"><span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${meta.color}22`, color: meta.color }}><meta.icon className="h-3.5 w-3.5" /></span>{meta.label}</span>
                      <span className="text-right"><span className="block text-xs font-bold text-slate-900">{money(m.total)}</span><span className="text-[11px] text-slate-400">{Math.round((m.total / mixTotal) * 100)}% · {m.orders} orders</span></span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Inventory" title="Stock health" icon={Package} tone="text-orange-500" />
          {stats.isLoading ? <Skeleton className="h-40" /> : readiness === null ? (
            <Empty icon={Package} title="No products yet" hint="Add products to start tracking stock levels." action={{ label: "Add products", onClick: () => setActiveTab("products") }} />
          ) : (
            <>
              <div className="flex items-end gap-2"><span className="text-5xl font-extrabold tracking-tight text-slate-900">{readiness}</span><span className="pb-2 text-lg font-bold text-slate-400">%</span></div>
              <p className="mt-1 text-xs text-slate-500">of products are above their minimum stock</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${readiness >= 80 ? "bg-teal-500" : readiness >= 50 ? "bg-amber-400" : "bg-rose-500"}`} style={{ width: `${readiness}%` }} /></div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Active products</dt><dd className="mt-1 text-lg font-bold text-slate-900">{productCount}</dd></div>
                <div className="rounded-xl bg-rose-50 p-3"><dt className="text-rose-600/80">Low stock</dt><dd className="mt-1 text-lg font-bold text-rose-600">{lowCount}</dd></div>
              </dl>
            </>
          )}
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Needs attention" title="Low-stock alerts" icon={AlertTriangle} tone="text-rose-500" />
          {lowStock.isLoading ? <Skeleton className="h-40" /> : !lowStock.data?.length ? (
            <Empty icon={Package} title="Stock levels look healthy" hint="Items at or below their minimum will be flagged here." />
          ) : (
            <ul className="space-y-2">
              {lowStock.data.slice(0, 5).map(p => (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{p.name}</p><p className="text-[11px] text-slate-400">{p.sku} · min {p.minStockLevel}</p></div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${p.stockQuantity <= 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{p.stockQuantity <= 0 ? "Out" : `${p.stockQuantity} left`}</span>
                </li>
              ))}
              {lowStock.data.length > 5 && <button onClick={() => setActiveTab("inventory")} className="w-full pt-1 text-center text-xs font-semibold text-teal-700 hover:underline">View all {lowStock.data.length} alerts</button>}
            </ul>
          )}
        </Panel>
      </div>

      {/* recent transactions */}
      <Panel>
        <div className="mb-4 flex items-start justify-between">
          <PanelHeader eyebrow="Latest activity" title="Recent transactions" />
          <button onClick={() => setActiveTab("sales")} className="text-xs font-semibold text-teal-700 hover:underline">View all</button>
        </div>
        {recent.isLoading ? <Skeleton className="h-48" /> : !recent.data?.length ? (
          <Empty icon={Receipt} title="No transactions yet" hint="Completed sales will be listed here in real time." action={{ label: "Open POS terminal", onClick: () => setActiveTab("pos") }} />
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"><th className="px-2 pb-3 font-semibold">Order</th><th className="px-2 pb-3 font-semibold">Customer</th><th className="px-2 pb-3 font-semibold">Payment</th><th className="px-2 pb-3 font-semibold">Time</th><th className="px-2 pb-3 text-right font-semibold">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recent.data.slice(0, 6).map(({ sale, customer }) => (
                  <tr key={sale.id} className="transition hover:bg-slate-50/70">
                    <td className="px-2 py-3 font-mono text-xs font-semibold text-slate-800">{sale.saleNumber}</td>
                    <td className="px-2 py-3 text-slate-600">{customer?.name ?? "Walk-in customer"}</td>
                    <td className="px-2 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">{sale.paymentMethod}</span></td>
                    <td className="px-2 py-3 text-xs text-slate-500">{new Date(sale.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-2 py-3 text-right font-bold text-slate-900">{money(Number(sale.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
