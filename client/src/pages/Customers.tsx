import { useMemo, useState } from "react";
import { BookOpen, Download, Loader2, Mail, Phone, Plus, UserPlus, Users, Wallet, Repeat } from "lucide-react";
import { toast } from "sonner";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { moneyWhole } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerDrawer from "@/components/CustomerDrawer";
import { DataTable, Initials, PageHeader, Pill, SearchBox, Segmented, StatTile, fmtDate, relativeTime, type Column } from "@/components/data/kit";

type Row = RouterOutputs["customers"]["list"][number];

export default function CustomersView() {
  const customersQ = trpc.customers.list.useQuery();
  const { data: groups = [] } = trpc.customerGroups.list.useQuery();
  const utils = trpc.useUtils();
  const customers = customersQ.data ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", groupId: null as number | null });
  const [search, setSearch] = useState("");
  const [seg, setSeg] = useState<"all" | "active" | "inactive" | "owes">("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const create = trpc.customers.create.useMutation({
    onSuccess: async () => {
      toast.success("Customer added.");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", groupId: null });
      await utils.customers.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const now = Date.now();
  const isActive = (c: Row) => !!c.lastPurchaseAt && now - new Date(c.lastPurchaseAt).getTime() < 30 * 86400000;

  const stats = useMemo(() => {
    const spend = customers.reduce((s, c) => s + Number(c.totalSpent), 0);
    const orders = customers.reduce((s, c) => s + (c.orderCount ?? 0), 0);
    const owedTotal = customers.reduce((s, c) => s + Math.max(0, Number(c.balance)), 0);
    const debtors = customers.filter(c => Number(c.balance) > 0).length;
    return { spend, owedTotal, debtors, avg: customers.length ? spend / customers.length : 0, active: customers.filter(isActive).length, repeat: customers.filter(c => (c.orderCount ?? 0) > 1).length, orders };
  }, [customers]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxSpend = Math.max(...customers.map(c => Number(c.totalSpent)), 1);
  const groupName = (id: number | null) => groups.find(g => g.id === id)?.name;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(c => {
      if (seg === "owes" && Number(c.balance) <= 0) return false;
      if (seg === "active" && !isActive(c)) return false;
      if (seg === "inactive" && isActive(c)) return false;
      return !q || c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q) || (c.phone ?? "").includes(q);
    });
  }, [customers, search, seg]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns: Column<Row>[] = [
    { key: "name", header: "Customer", sortValue: c => c.name.toLowerCase(), cell: c => (
      <div className="flex items-center gap-3"><Initials name={c.name} />
        <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{c.name}</p><p className="text-[11px] text-slate-400">Joined {fmtDate(c.createdAt)}</p></div>
        {groupName(c.groupId) && <Pill tone="violet">{groupName(c.groupId)}</Pill>}
      </div>) },
    { key: "contact", header: "Contact", hideBelow: "md", cell: c => (
      <div className="space-y-0.5 text-xs text-slate-600">
        <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" />{c.email || "—"}</p>
        <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" />{c.phone || "—"}</p>
      </div>) },
    { key: "orders", header: "Orders", align: "right", hideBelow: "sm", sortValue: c => c.orderCount ?? 0, cell: c => <span className="font-semibold tabular-nums text-slate-700">{c.orderCount ?? 0}</span> },
    { key: "last", header: "Last purchase", hideBelow: "lg", sortValue: c => (c.lastPurchaseAt ? new Date(c.lastPurchaseAt).getTime() : 0), cell: c => (
      c.lastPurchaseAt ? <div><p className="text-sm text-slate-700">{relativeTime(c.lastPurchaseAt)}</p><Pill tone={isActive(c) ? "emerald" : "slate"} dot>{isActive(c) ? "Active" : "Inactive"}</Pill></div> : <span className="text-xs text-slate-400">No purchases</span>) },
    { key: "udhaar", header: "Udhaar", align: "right", sortValue: c => Number(c.balance), cell: c => Number(c.balance) > 0
      ? <div className="text-right"><p className="font-bold tabular-nums text-rose-600">{moneyWhole(c.balance)}</p>{c.creditLimit != null && <p className="text-[11px] text-slate-400">limit {moneyWhole(c.creditLimit)}</p>}</div>
      : <span className="text-xs text-slate-300">—</span> },
    { key: "spend", header: "Lifetime spend", align: "right", sortValue: c => Number(c.totalSpent), cell: c => (
      <div className="ml-auto w-36 text-right"><p className="font-bold tabular-nums text-slate-900">{moneyWhole(c.totalSpent)}</p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: `${(Number(c.totalSpent) / maxSpend) * 100}%` }} /></div></div>) },
  ];

  const inputCls = "mt-1.5 h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className="space-y-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-6 lg:space-y-0">
      <PageHeader title="Customers" description="Your customer directory, lifetime value and buying activity." actions={<>
        <Button variant="outline" onClick={() => downloadCsv("customers", ["Name", "Email", "Phone", "Orders", "Lifetime spend", "Udhaar owed", "Credit limit", "Last purchase", "Joined"], filtered.map(c => [c.name, c.email, c.phone, c.orderCount, c.totalSpent, c.balance, c.creditLimit, c.lastPurchaseAt, c.createdAt]))} className="h-10 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="h-10 rounded-xl bg-slate-900 px-4 font-semibold text-white hover:bg-slate-700"><Plus className="mr-2 h-4 w-4" /> Add customer</Button></DialogTrigger>
          <DialogContent className="rounded-2xl border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
            <DialogHeader><DialogTitle className="text-xl font-bold">New customer</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><label className="text-xs font-semibold text-slate-600">Full name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ayesha Khan" className={inputCls} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs font-semibold text-slate-600">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ayesha@example.com" className={inputCls} /></div>
                <div><label className="text-xs font-semibold text-slate-600">Phone</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 1234567" className={inputCls} /></div>
              </div>
              <div><label className="text-xs font-semibold text-slate-600">Customer group</label>
                <Select value={form.groupId ? String(form.groupId) : "none"} onValueChange={v => setForm({ ...form, groupId: v === "none" ? null : Number(v) })}>
                  <SelectTrigger className={`${inputCls} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900"><SelectItem value="none">Standard</SelectItem>{groups.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name} ({g.discountPercent}% off)</SelectItem>)}</SelectContent>
                </Select></div>
              <Button onClick={() => create.mutate({ name: form.name, email: form.email, phone: form.phone, groupId: form.groupId })} disabled={create.isPending || form.name.trim().length < 2} className="mt-2 h-11 w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-700">
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{create.isPending ? "Saving…" : "Save customer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog></>} />

      <div className="stat-grid">
        <StatTile label="Total customers" value={customers.length.toLocaleString("en-PK")} hint={`${stats.active} bought in the last 30 days`} icon={Users} />
        <StatTile label="Lifetime revenue" value={moneyWhole(stats.spend)} hint={`${stats.orders.toLocaleString("en-PK")} orders from customers`} icon={Wallet} tone="bg-indigo-50 text-indigo-600" />
        <StatTile label="Udhaar owed" value={moneyWhole(stats.owedTotal)} hint={stats.debtors ? `${stats.debtors} customer${stats.debtors === 1 ? "" : "s"} owe you` : "nobody owes you"} icon={BookOpen} tone="bg-rose-50 text-rose-600" />
        <StatTile label="Repeat customers" value={stats.repeat} hint={customers.length ? `${Math.round((stats.repeat / customers.length) * 100)}% of your directory` : "—"} icon={Repeat} tone="bg-sky-50 text-sky-600" />
      </div>

      <DataTable
        columns={columns} rows={filtered} rowKey={c => c.id} loading={customersQ.isLoading} pageSize={10} onRowClick={c => setOpenId(c.id)}
        toolbar={<><SearchBox value={search} onChange={setSearch} placeholder="Search name, email or phone…" />
          <Segmented value={seg} onChange={setSeg} options={[{ value: "all", label: "All" }, { value: "owes", label: "Owes" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} /></>}
        empty={{ icon: UserPlus, title: customers.length ? "No customers match your search" : "No customers yet", hint: customers.length ? "Try a different search or filter." : "Add your first customer to start tracking purchases and lifetime value.", action: !customers.length ? <Button onClick={() => setOpen(true)} className="rounded-xl bg-slate-900 text-white hover:bg-slate-700">Add customer</Button> : undefined }}
      />
      <CustomerDrawer customerId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
