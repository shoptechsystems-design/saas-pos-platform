import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, BookOpen, Download, Percent, Receipt, RotateCcw, Scale, TrendingUp, Wallet } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { moneyWhole as money } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { DataTable, Initials, PageHeader, Pill, Segmented, StatTile, fmtDate, fmtTime, type Column } from "@/components/data/kit";

type Range = "7d" | "30d" | "month" | "lastmonth" | "90d";
const compact = (n: number) => (Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : Math.abs(n) >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n)));
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function bounds(r: Range) {
  const n = new Date(), today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const end = new Date(today.getTime() + 86400000 - 1).getTime();
  if (r === "7d") return { from: today.getTime() - 6 * 86400000, to: end };
  if (r === "30d") return { from: today.getTime() - 29 * 86400000, to: end };
  if (r === "90d") return { from: today.getTime() - 89 * 86400000, to: end };
  if (r === "month") return { from: new Date(n.getFullYear(), n.getMonth(), 1).getTime(), to: end };
  return { from: new Date(n.getFullYear(), n.getMonth() - 1, 1).getTime(), to: new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59).getTime() };
}

function Panel({ title, eyebrow, children, className = "" }: { title: string; eyebrow?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-12px_rgba(15,23,42,0.08)] sm:p-6 ${className}`}>
      {eyebrow && <p className="text-xs font-semibold text-slate-500">{eyebrow}</p>}
      <h4 className="mb-4 mt-0.5 text-lg font-bold tracking-tight text-slate-900">{title}</h4>
      {children}
    </section>
  );
}

const Tip = ({ active, payload, label, fmt }: any) => active && payload?.length ? (
  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl"><p className="text-[11px] font-semibold text-slate-500">{label ?? payload[0].payload.name}</p><p className="text-sm font-bold text-slate-900">{fmt ? fmt(payload[0].value) : money(payload[0].value)}</p></div>
) : null;

export default function ReportsView() {
  const [range, setRange] = useState<Range>("30d");
  const b = useMemo(() => bounds(range), [range]);
  const q = trpc.reports.overview.useQuery(b);
  const shifts = trpc.shifts.list.useQuery();
  const d = q.data;

  const hours = useMemo(() => Array.from({ length: 24 }, (_, h) => ({ h, label: `${h % 12 || 12}${h < 12 ? "a" : "p"}`, total: d?.byHour.find(x => x.hour === h)?.total ?? 0 })).filter(x => x.h >= 7 && x.h <= 23), [d]);
  const weekdays = useMemo(() => DAYS.map((name, i) => ({ name, total: d?.byWeekday.find(x => x.day === i + 1)?.total ?? 0 })), [d]);
  const peakHour = hours.reduce((m, x) => (x.total > m.total ? x : m), hours[0] ?? { label: "", total: 0, h: 0 });
  const bestDay = weekdays.reduce((m, x) => (x.total > m.total ? x : m), weekdays[0]);
  const maxCat = Math.max(...(d?.byCategory ?? []).map(c => c.revenue), 1);
  const margin = d && d.revenue ? (d.grossProfit / d.revenue) * 100 : 0;
  const empty = !q.isLoading && d && d.orders === 0;

  type ShiftRow = NonNullable<typeof shifts.data>[number];
  const shiftCols: Column<ShiftRow>[] = [
    { key: "opened", header: "Opened", cell: r => <div><p className="text-sm text-slate-800">{fmtDate(r.shift.openedAt)}</p><p className="text-[11px] text-slate-400">{fmtTime(r.shift.openedAt)} · {r.opener?.name ?? "—"}</p></div> },
    { key: "status", header: "Status", cell: r => <Pill tone={r.shift.status === "open" ? "teal" : "slate"} dot>{r.shift.status === "open" ? "Open" : "Closed"}</Pill> },
    { key: "open", header: "Opening", align: "right", hideBelow: "sm", cell: r => <span className="tabular-nums text-slate-600">{money(r.shift.openingCash)}</span> },
    { key: "exp", header: "Expected", align: "right", hideBelow: "md", cell: r => <span className="tabular-nums text-slate-600">{r.shift.expectedCash ? money(r.shift.expectedCash) : "—"}</span> },
    { key: "cnt", header: "Counted", align: "right", hideBelow: "md", cell: r => <span className="tabular-nums text-slate-600">{r.shift.countedCash ? money(r.shift.countedCash) : "—"}</span> },
    { key: "var", header: "Variance", align: "right", cell: r => r.shift.variance == null ? <span className="text-slate-300">—</span> : Number(r.shift.variance) === 0 ? <Pill tone="emerald">Balanced</Pill> : <Pill tone={Number(r.shift.variance) < 0 ? "rose" : "amber"}>{Number(r.shift.variance) > 0 ? "+" : "−"}{money(Math.abs(Number(r.shift.variance)))}</Pill> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Profit & loss, sales patterns and cash-drawer history." actions={<>
        <Segmented value={range} onChange={setRange} options={[{ value: "7d", label: "7D" }, { value: "30d", label: "30D" }, { value: "90d", label: "90D" }, { value: "month", label: "This month" }, { value: "lastmonth", label: "Last month" }]} />
        <Button variant="outline" disabled={!d} onClick={() => d && downloadCsv("report-daily", ["Day", "Revenue", "Orders"], d.daily.map(x => [x.day, x.total, x.orders]))} className="h-10 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"><Download className="mr-2 h-4 w-4" /> Export</Button>
      </>} />

      <div className="stat-grid">
        <StatTile label="Net revenue" value={d ? money(d.revenue) : "…"} hint={d ? `${d.orders.toLocaleString()} orders · avg ${money(d.avgOrder)}` : ""} icon={Wallet} />
        <StatTile label="Gross profit" value={d ? money(d.grossProfit) : "…"} hint={d ? `${margin.toFixed(0)}% margin after tax & cost of goods` : ""} icon={TrendingUp} tone="bg-emerald-50 text-emerald-600" />
        <StatTile label="Expenses" value={d ? money(d.expenses) : "…"} hint="operating costs in period" icon={Banknote} tone="bg-rose-50 text-rose-600" />
        <StatTile label="Net profit" value={d ? <span className={d.netProfit < 0 ? "text-rose-600" : ""}>{money(d.netProfit)}</span> : "…"} hint="gross profit − expenses" icon={Scale} tone="bg-indigo-50 text-indigo-600" />
      </div>

      {empty ? (
        <Panel title="No sales in this period"><p className="text-sm text-slate-500">Pick a wider range, or ring up a sale at the POS terminal.</p></Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
            <Panel eyebrow="Trend" title="Revenue by day">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d?.daily ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="rr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} /><stop offset="100%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickFormatter={(k: string) => new Date(k + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={28} />
                    <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<Tip />} />
                    <Area type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2.5} fill="url(#rr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel eyebrow="Where the money goes" title="Profit & loss">
              {d && (
                <dl className="space-y-3 text-sm">
                  {[["Revenue (incl. tax)", d.revenue, ""], ["Tax collected", -d.tax, "text-slate-500"], ["Cost of goods sold", -d.cogs, "text-slate-500"]].map(([l, v, c]) => (
                    <div key={l as string} className={`flex justify-between ${c}`}><dt>{l}</dt><dd className="tabular-nums">{(v as number) < 0 ? "−" : ""}{money(Math.abs(v as number))}</dd></div>
                  ))}
                  <div className="flex justify-between border-t border-slate-200 pt-3 font-bold"><dt>Gross profit</dt><dd className="tabular-nums text-emerald-600">{money(d.grossProfit)}</dd></div>
                  <div className="flex justify-between text-slate-500"><dt>Expenses</dt><dd className="tabular-nums">−{money(d.expenses)}</dd></div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold"><dt>Net profit</dt><dd className={`tabular-nums ${d.netProfit < 0 ? "text-rose-600" : "text-slate-900"}`}>{money(d.netProfit)}</dd></div>
                  <div className="!mt-5 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-slate-500"><Percent className="h-3 w-3" /> Discounts given</p><p className="mt-1 text-base font-bold text-slate-900">{money(d.discounts)}</p></div>
                    <div className="rounded-xl bg-rose-50 p-3"><p className="flex items-center gap-1.5 text-rose-600/80"><RotateCcw className="h-3 w-3" /> Refunds</p><p className="mt-1 text-base font-bold text-rose-600">{money(d.refunds.total)} <span className="text-[11px] font-medium">({d.refunds.count})</span></p></div>
                  </div>
                </dl>
              )}
            </Panel>
          </div>

          <Panel eyebrow="Customer credit" title="Udhaar">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[["Credit given", d?.creditGiven ?? 0, "text-rose-600", "sold on account in this period"], ["Repayments received", d?.paymentsReceived ?? 0, "text-emerald-600", "collected from customers"], ["Outstanding now", d?.outstanding ?? 0, "text-slate-900", "owed to you today"]].map(([l, v, c, h]) => (
                <div key={l as string} className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-1.5 text-xs text-slate-500"><BookOpen className="h-3 w-3" />{l}</p><p className={`mt-1.5 text-xl font-extrabold tabular-nums ${c}`}>{money(v as number)}</p><p className="mt-0.5 text-[11px] text-slate-400">{h}</p></div>))}
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel eyebrow="Mix" title="Sales by category">
              <ul className="space-y-3.5">
                {(d?.byCategory ?? []).map(c => (
                  <li key={c.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm"><span className="truncate font-semibold text-slate-800">{c.name}</span><span className="shrink-0 text-xs font-bold">{money(c.revenue)}</span></div>
                    <div className="mt-1.5 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: `${(c.revenue / maxCat) * 100}%` }} /></div><span className="w-16 shrink-0 text-right text-[11px] text-slate-400">{c.units} units</span></div>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel eyebrow={peakHour?.total ? `Busiest hour: ${peakHour.label}` : "Timing"} title="Sales by hour of day">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hours} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<Tip />} cursor={{ fill: "#f1f5f9" }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} isAnimationActive={false}>{hours.map(h => <Cell key={h.h} fill={h.h === peakHour?.h ? "#0d9488" : "#99f6e4"} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Panel eyebrow={bestDay?.total ? `Best day: ${bestDay.name}` : "Pattern"} title="Weekday pattern">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdays} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<Tip />} cursor={{ fill: "#f1f5f9" }} />
                    <Bar dataKey="total" radius={[5, 5, 0, 0]} isAnimationActive={false}>{weekdays.map(w => <Cell key={w.name} fill={w.name === bestDay?.name ? "#6366f1" : "#c7d2fe"} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel eyebrow="Loyal buyers" title="Top customers">
              {!d?.topCustomers.length ? <p className="text-sm text-slate-500">No customer purchases in this period.</p> : (
                <ul className="space-y-3">
                  {d.topCustomers.map(c => <li key={c.id} className="flex items-center gap-3"><Initials name={c.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{c.name}</p><p className="text-[11px] text-slate-400">{c.orders} orders</p></div><span className="text-sm font-bold tabular-nums">{money(c.total)}</span></li>)}
                </ul>
              )}
            </Panel>
            <Panel eyebrow="Spending" title="Expenses by category">
              {!d?.expenseByCategory.length ? <p className="text-sm text-slate-500">No expenses recorded in this period.</p> : (
                <ul className="space-y-3">
                  {d.expenseByCategory.map(e => <li key={e.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-medium text-slate-700"><Receipt className="h-3.5 w-3.5 text-slate-400" />{e.name}</span><span className="font-bold tabular-nums text-rose-600">{money(e.total)}</span></li>)}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}

      <div>
        <h4 className="mb-3 text-lg font-bold tracking-tight text-slate-900">Cash drawer shifts</h4>
        <DataTable columns={shiftCols} rows={shifts.data ?? []} rowKey={r => r.shift.id} loading={shifts.isLoading} pageSize={6}
          empty={{ icon: Banknote, title: "No shifts yet", hint: "Open a shift from the POS terminal to start tracking your cash drawer." }} />
      </div>
    </div>
  );
}
