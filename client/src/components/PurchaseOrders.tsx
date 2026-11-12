import { useState } from "react";
import { Check, Loader2, Plus, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { moneyWhole } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, Pill, fmtDate, type Column } from "@/components/data/kit";

type Row = RouterOutputs["purchases"]["list"][number];
const TONE = { draft: "slate", ordered: "amber", received: "emerald", cancelled: "rose" } as const;
type Line = { productId: number | null; quantity: string; unitCost: string };

export default function PurchaseOrders() {
  const utils = trpc.useUtils();
  const list = trpc.purchases.list.useQuery();
  const { data: suppliers = [] } = trpc.suppliers.list.useQuery();
  const { data: products = [] } = trpc.catalog.products.useQuery();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("none");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: null, quantity: "10", unitCost: "" }]);

  const refresh = () => Promise.all([utils.purchases.invalidate(), utils.catalog.products.invalidate(), utils.inventory.invalidate(), utils.dashboard.invalidate()]);
  const create = trpc.purchases.create.useMutation({
    onSuccess: async r => { toast.success(`${r.purchaseNumber} created.`); setOpen(false); setLines([{ productId: null, quantity: "10", unitCost: "" }]); setNotes(""); setSupplierId("none"); await refresh(); },
    onError: e => toast.error(e.message),
  });
  const receive = trpc.purchases.receive.useMutation({ onSuccess: async r => { toast.success(`Received ${r.units} units into stock.`); await refresh(); }, onError: e => toast.error(e.message) });
  const cancel = trpc.purchases.cancel.useMutation({ onSuccess: async () => { toast.success("Order cancelled."); await refresh(); }, onError: e => toast.error(e.message) });

  const valid = lines.length > 0 && lines.every(l => l.productId && Number(l.quantity) > 0 && Number(l.unitCost) >= 0 && l.unitCost !== "");
  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);
  const setLine = (i: number, patch: Partial<Line>) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const cols: Column<Row>[] = [
    { key: "po", header: "Order", cell: r => <div><p className="font-mono text-xs font-semibold text-slate-900">{r.purchase.purchaseNumber}</p><p className="text-[11px] text-slate-400">{fmtDate(r.purchase.createdAt)}</p></div> },
    { key: "supplier", header: "Supplier", hideBelow: "sm", cell: r => <span className="text-slate-700">{r.supplier?.name ?? <span className="text-slate-400">No supplier</span>}</span> },
    { key: "units", header: "Units", align: "right", hideBelow: "md", cell: r => <span className="tabular-nums text-slate-600">{r.itemCount}</span> },
    { key: "total", header: "Total", align: "right", cell: r => <span className="font-bold tabular-nums text-slate-900">{moneyWhole(r.purchase.total)}</span> },
    { key: "status", header: "Status", cell: r => <Pill tone={TONE[r.purchase.status]} dot><span className="capitalize">{r.purchase.status}</span></Pill> },
    { key: "act", header: "", align: "right", cell: r => (r.purchase.status === "ordered" || r.purchase.status === "draft") ? (
      <div className="flex justify-end gap-1.5">
        <Button size="sm" onClick={() => receive.mutate({ id: r.purchase.id })} disabled={receive.isPending} className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"><Check className="mr-1 h-3.5 w-3.5" />Receive</Button>
        <button onClick={() => window.confirm("Cancel this order?") && cancel.mutate({ id: r.purchase.id })} aria-label="Cancel order" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button>
      </div>) : null },
  ];

  const inputCls = "h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900";
  return (
    <>
      <DataTable columns={cols} rows={list.data ?? []} rowKey={r => r.purchase.id} loading={list.isLoading} pageSize={6} maxBodyHeight={440}
        toolbar={<><div><h4 className="text-base font-bold text-slate-900">Purchase orders</h4><p className="text-xs text-slate-500">Order from suppliers, then receive to add stock automatically.</p></div>
          <Button onClick={() => setOpen(true)} className="h-10 rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-700"><Plus className="mr-2 h-4 w-4" /> New order</Button></>}
        empty={{ icon: Truck, title: "No purchase orders yet", hint: "Create an order for low-stock items, then mark it received when the delivery arrives." }} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-slate-200 bg-white p-5 text-slate-900 sm:p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold">New purchase order</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-xs font-semibold text-slate-600">Supplier</label>
                <Select value={supplierId} onValueChange={setSupplierId}><SelectTrigger className={`${inputCls} mt-1.5 w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900"><SelectItem value="none">No supplier</SelectItem>{suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-xs font-semibold text-slate-600">Notes</label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className={`${inputCls} mt-1.5`} /></div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">Items</p>
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-slate-200 p-2.5 sm:grid-cols-[1fr_88px_110px_auto]">
                  <Select value={l.productId ? String(l.productId) : ""} onValueChange={v => { const p = products.find(x => x.id === Number(v)); setLine(i, { productId: Number(v), unitCost: l.unitCost || String(p?.costPrice ?? "") }); }}>
                    <SelectTrigger className={`${inputCls} w-full`}><SelectValue placeholder="Choose product" /></SelectTrigger>
                    <SelectContent className="max-h-64 border-slate-200 bg-white text-slate-900">{products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name} · {p.stockQuantity} in stock</SelectItem>)}</SelectContent>
                  </Select>
                  <button onClick={() => setLines(ls => ls.filter((_, j) => j !== i))} disabled={lines.length === 1} aria-label="Remove line" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 sm:order-last"><Trash2 className="h-4 w-4" /></button>
                  <Input type="number" min="1" value={l.quantity} onChange={e => setLine(i, { quantity: e.target.value })} placeholder="Qty" className={inputCls} />
                  <Input type="number" min="0" value={l.unitCost} onChange={e => setLine(i, { unitCost: e.target.value })} placeholder="Unit cost" className={inputCls} />
                </div>
              ))}
              <Button variant="outline" onClick={() => setLines(ls => [...ls, { productId: null, quantity: "10", unitCost: "" }])} className="h-9 rounded-xl border-dashed border-slate-300 text-xs font-semibold text-slate-600"><Plus className="mr-1.5 h-3.5 w-3.5" /> Add line</Button>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm text-slate-500">Order total</span><span className="text-xl font-extrabold">{moneyWhole(total)}</span></div>
            <Button onClick={() => create.mutate({ supplierId: supplierId === "none" ? null : Number(supplierId), notes: notes || null, items: lines.map(l => ({ productId: l.productId!, quantity: Number(l.quantity), unitCost: Number(l.unitCost) })) })} disabled={!valid || create.isPending} className="h-11 w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-700">
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create purchase order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
