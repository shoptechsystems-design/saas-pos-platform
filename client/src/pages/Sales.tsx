import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Download, FileText, Landmark, Receipt, ShoppingBag, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { moneyWhole } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, Initials, PageHeader, Pill, SearchBox, Segmented, StatTile, fmtDate, fmtTime, type Column } from "@/components/data/kit";

type Row = RouterOutputs["salesHistory"]["list"]["rows"][number];
type Range = "all" | "today" | "7d" | "30d" | "custom";
type Method = "all" | "cash" | "card" | "transfer";

const METHOD: Record<string, { label: string; icon: LucideIcon; tone: "teal" | "indigo" | "amber" }> = {
  cash: { label: "Cash", icon: Banknote, tone: "teal" },
  card: { label: "Card", icon: CreditCard, tone: "indigo" },
  transfer: { label: "Transfer", icon: Landmark, tone: "amber" },
};

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function SalesView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<Range>("30d");
  const [method, setMethod] = useState<Method>("all");
  const [customer, setCustomer] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const debounced = useDebounced(search);

  const { data: customers = [] } = trpc.customers.list.useQuery();

  const bounds = useMemo(() => {
    const d = new Date();
    const today = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (range === "today") return { from: today, to: undefined };
    if (range === "7d") return { from: today - 6 * 86400000, to: undefined };
    if (range === "30d") return { from: today - 29 * 86400000, to: undefined };
    if (range === "custom") return { from: start ? new Date(start).getTime() : undefined, to: end ? new Date(end).getTime() + 86400000 - 1 : undefined };
    return { from: undefined, to: undefined };
  }, [range, start, end]);

  useEffect(() => setPage(1), [debounced, range, method, customer, start, end]);

  const q = trpc.salesHistory.list.useQuery(
    { page, pageSize: 12, search: debounced || undefined, paymentMethod: method === "all" ? undefined : method, customerId: customer === "all" ? undefined : Number(customer), from: bounds.from, to: bounds.to },
    { placeholderData: prev => prev },
  );

  const recon = trpc.reports.reconciliationPdf.useQuery({ from: bounds.from, to: bounds.to }, { enabled: false });
  const statement = trpc.reports.customerStatementPdf.useQuery({ customerId: Number(customer) || 1 }, { enabled: false });

  const download = (p: { filename: string; mimeType: string; base64: string }) => {
    const bytes = Uint8Array.from(window.atob(p.base64), c => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: p.mimeType }));
    const a = document.createElement("a");
    a.href = url; a.download = p.filename; a.click();
    URL.revokeObjectURL(url);
  };
  const getRecon = async () => { const r = await recon.refetch(); r.data ? download(r.data) : toast.error("Could not generate the reconciliation report."); };
  const getStatement = async () => {
    if (customer === "all") return toast.error("Choose a customer to create a statement.");
    const r = await statement.refetch(); r.data ? download(r.data) : toast.error("Could not generate the customer statement.");
  };

  const data = q.data;
  const reset = () => { setSearch(""); setRange("30d"); setMethod("all"); setCustomer("all"); setStart(""); setEnd(""); };
  const filtered = !!search || method !== "all" || customer !== "all" || range !== "30d";

  const columns: Column<Row>[] = [
    { key: "order", header: "Order", cell: r => <span className="font-mono text-xs font-semibold text-slate-900">{r.sale.saleNumber}</span> },
    { key: "customer", header: "Customer", cell: r => r.customer?.name
      ? <div className="flex items-center gap-2.5"><Initials name={r.customer.name} size="sm" /><span className="font-medium text-slate-800">{r.customer.name}</span></div>
      : <div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400"><ShoppingBag className="h-3.5 w-3.5" /></span><span className="text-slate-500">Walk-in</span></div> },
    { key: "items", header: "Items", align: "right", hideBelow: "md", cell: r => <span className="tabular-nums text-slate-600">{r.itemCount}</span> },
    { key: "payment", header: "Payment", cell: r => { const m = METHOD[r.sale.paymentMethod]; const I = m?.icon ?? CreditCard; return <Pill tone={m?.tone ?? "slate"}><I className="h-3 w-3" />{m?.label ?? r.sale.paymentMethod}</Pill>; } },
    { key: "total", header: "Total", align: "right", cell: r => <div><p className="font-bold tabular-nums text-slate-900">{moneyWhole(r.sale.total)}</p>{Number(r.sale.tax) > 0 && <p className="text-[11px] text-slate-400">incl. {moneyWhole(r.sale.tax)} tax</p>}</div> },
    { key: "date", header: "Date", align: "right", hideBelow: "sm", cell: r => <div><p className="text-sm text-slate-700">{fmtDate(r.sale.createdAt)}</p><p className="text-[11px] text-slate-400">{fmtTime(r.sale.createdAt)}</p></div> },
  ];

  const sel = "h-10 rounded-xl border-slate-200 bg-white text-sm text-slate-900";

  return (
    <div className="space-y-6">
      <PageHeader title="Sales history" description="Every completed transaction, filterable and exportable." actions={<>
        <Button variant="outline" onClick={getStatement} disabled={statement.isFetching || customer === "all"} className="h-10 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"><FileText className="mr-2 h-4 w-4" />{statement.isFetching ? "Preparing…" : "Customer statement"}</Button>
        <Button onClick={getRecon} disabled={recon.isFetching} className="h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-700"><Download className="mr-2 h-4 w-4" />{recon.isFetching ? "Preparing…" : "Reconciliation PDF"}</Button>
      </>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Revenue" value={data ? moneyWhole(data.revenue) : "…"} hint={filtered ? "for the current filters" : "last 30 days"} icon={Wallet} />
        <StatTile label="Orders" value={data ? data.total.toLocaleString("en-PK") : "…"} hint="completed sales" icon={Receipt} tone="bg-indigo-50 text-indigo-600" />
        <StatTile label="Avg. order value" value={data ? moneyWhole(data.avgOrder) : "…"} hint="revenue ÷ orders" icon={TrendingUp} tone="bg-orange-50 text-orange-600" />
      </div>

      <DataTable
        columns={columns} rows={data?.rows ?? []} rowKey={r => r.sale.id} loading={q.isLoading}
        server={{ page, pageSize: 12, total: data?.total ?? 0, onPageChange: setPage }}
        toolbar={<>
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <SearchBox value={search} onChange={setSearch} placeholder="Search order # or customer…" />
            <Segmented value={range} onChange={setRange} options={[{ value: "today", label: "Today" }, { value: "7d", label: "7D" }, { value: "30d", label: "30D" }, { value: "all", label: "All" }, { value: "custom", label: "Custom" }]} />
            <Segmented value={method} onChange={setMethod} options={[{ value: "all", label: "Any payment" }, { value: "cash", label: "Cash" }, { value: "card", label: "Card" }, { value: "transfer", label: "Transfer" }]} />
            <Select value={customer} onValueChange={setCustomer}>
              <SelectTrigger className={`${sel} w-full lg:w-56`}><SelectValue placeholder="All customers" /></SelectTrigger>
              <SelectContent className="border-slate-200 bg-white text-slate-900"><SelectItem value="all">All customers</SelectItem>{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {range === "custom" && <div className="flex items-center gap-2"><Input type="date" value={start} onChange={e => setStart(e.target.value)} className={`${sel} w-40`} /><span className="text-xs text-slate-400">to</span><Input type="date" value={end} onChange={e => setEnd(e.target.value)} className={`${sel} w-40`} /></div>}
            {filtered && <button onClick={reset} className="text-xs font-semibold text-teal-700 hover:underline lg:ml-auto">Reset filters</button>}
          </div>
        </>}
        empty={{ icon: Receipt, title: "No sales match these filters", hint: "Try widening the date range or clearing the search." }}
      />
    </div>
  );
}
