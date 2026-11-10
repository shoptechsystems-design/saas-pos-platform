import { useMemo, useState } from "react";
import { CalendarDays, Download, Layers, Loader2, Plus, Receipt, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { moneyWhole } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, PageHeader, Pill, SearchBox, StatTile, fmtDate, type Column } from "@/components/data/kit";

type Row = RouterOutputs["expenses"]["list"][number];
const DEFAULTS = ["Rent", "Salaries", "Utilities", "Supplies", "Marketing", "Maintenance", "Internet & Phone", "Transport", "Other"];
const TONES = ["teal", "indigo", "rose", "amber", "sky", "violet", "emerald"] as const;
const toneFor = (c: string) => { let h = 0; for (const ch of c) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return TONES[h % TONES.length]; };

export default function ExpensesView() {
  const q = trpc.expenses.list.useQuery();
  const utils = trpc.useUtils();
  const expenses = q.data ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "Supplies", amount: "", notes: "", date: new Date().toISOString().slice(0, 10) });
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  const create = trpc.expenses.create.useMutation({
    onSuccess: async () => {
      toast.success("Expense recorded.");
      setOpen(false);
      setForm(f => ({ ...f, amount: "", notes: "" }));
      await utils.expenses.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const categories = useMemo(() => Array.from(new Set([...DEFAULTS, ...expenses.map(e => e.category)])).sort(), [expenses]);

  const stats = useMemo(() => {
    const now = new Date();
    const ms = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lms = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    let month = 0, last = 0; const by = new Map<string, number>();
    for (const e of expenses) {
      const t = new Date(e.expenseDate).getTime(), a = Number(e.amount);
      if (t >= ms) { month += a; by.set(e.category, (by.get(e.category) ?? 0) + a); } else if (t >= lms) last += a;
    }
    const top = Array.from(by.entries()).sort((a, b) => b[1] - a[1])[0];
    return { month, last, top };
  }, [expenses]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return expenses.filter(e => (cat === "all" || e.category === cat) && (!s || e.category.toLowerCase().includes(s) || (e.notes ?? "").toLowerCase().includes(s)));
  }, [expenses, search, cat]);
  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const delta = stats.last ? ((stats.month - stats.last) / stats.last) * 100 : null;

  const columns: Column<Row>[] = [
    { key: "date", header: "Date", sortValue: e => new Date(e.expenseDate).getTime(), cell: e => <span className="text-sm text-slate-700">{fmtDate(e.expenseDate)}</span> },
    { key: "category", header: "Category", sortValue: e => e.category, cell: e => <Pill tone={toneFor(e.category)}>{e.category}</Pill> },
    { key: "notes", header: "Notes", hideBelow: "md", cell: e => <span className="text-slate-600">{e.notes || <span className="text-slate-300">—</span>}</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: e => Number(e.amount), cell: e => <span className="font-bold tabular-nums text-rose-600">−{moneyWhole(e.amount)}</span> },
  ];

  const inputCls = "mt-1.5 h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900";
  const amount = Number(form.amount);

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Track operating costs and see where the money goes." actions={<>
        <Button variant="outline" onClick={() => downloadCsv("expenses", ["Date", "Category", "Notes", "Amount"], filtered.map(e => [e.expenseDate, e.category, e.notes, e.amount]))} className="h-10 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="h-10 rounded-xl bg-slate-900 px-4 font-semibold text-white hover:bg-slate-700"><Plus className="mr-2 h-4 w-4" /> Add expense</Button></DialogTrigger>
          <DialogContent className="rounded-2xl border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
            <DialogHeader><DialogTitle className="text-xl font-bold">Record expense</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><label className="text-xs font-semibold text-slate-600">Category</label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className={`${inputCls} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900">{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs font-semibold text-slate-600">Amount (PKR)</label><Input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="25,000" className={inputCls} /></div>
                <div><label className="text-xs font-semibold text-slate-600">Date</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} /></div>
              </div>
              <div><label className="text-xs font-semibold text-slate-600">Notes</label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Monthly electricity bill" className={inputCls} /></div>
              <Button onClick={() => create.mutate({ category: form.category, amount, notes: form.notes || null, expenseDate: new Date(form.date + "T12:00:00") })} disabled={create.isPending || !(amount > 0)} className="mt-2 h-11 w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-700">
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{create.isPending ? "Saving…" : "Save expense"}
              </Button>
            </div>
          </DialogContent>
        </Dialog></>} />

      <div className="stat-grid">
        <StatTile label="This month" value={moneyWhole(stats.month)} hint={delta === null ? "no prior month to compare" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(0)}% vs last month`} icon={Wallet} tone="bg-rose-50 text-rose-600" />
        <StatTile label="Last month" value={moneyWhole(stats.last)} hint="total spend" icon={CalendarDays} tone="bg-indigo-50 text-indigo-600" />
        <StatTile label="Top category" value={stats.top ? stats.top[0] : "—"} hint={stats.top ? `${moneyWhole(stats.top[1])} this month` : "no spend this month"} icon={Layers} tone="bg-orange-50 text-orange-600" />
        <StatTile label="Entries" value={expenses.length} hint="most recent 500 shown" icon={TrendingDown} tone="bg-sky-50 text-sky-600" />
      </div>

      <DataTable columns={columns} rows={filtered} rowKey={e => e.id} loading={q.isLoading} pageSize={12}
        toolbar={<><div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"><SearchBox value={search} onChange={setSearch} placeholder="Search category or notes…" />
          <Select value={cat} onValueChange={setCat}><SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent className="border-slate-200 bg-white text-slate-900"><SelectItem value="all">All categories</SelectItem>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <span className="text-xs text-slate-500 sm:ml-auto">Filtered total <span className="font-bold text-slate-900">{moneyWhole(filteredTotal)}</span></span></div></>}
        empty={{ icon: Receipt, title: expenses.length ? "No expenses match" : "No expenses recorded", hint: expenses.length ? "Try another category or search." : "Record rent, salaries and supplies to see your spending trends." }} />
    </div>
  );
}
