import { IonIcon } from "@ionic/react";
import { add, bagAddOutline, checkmarkCircleOutline, closeCircleOutline, trashOutline } from "ionicons/icons";
import { useState } from "react";
import { Async, Card, Empty, Field, Loading, Pill, Screen, SearchBox, Sheet, useNotify } from "~/components/ui";
import { dateTime, money, num } from "~/lib/format";
import { useAct, useList, useProducts } from "~/lib/queries";
import { api } from "~/lib/rest";
import { useSession } from "~/lib/session";
import type { Product, PurchaseItemRow, PurchaseRow, Supplier } from "~/lib/types";

const TONE = { draft: "", ordered: "info", received: "ok", cancelled: "bad" } as const;
const STOCK_ROOTS = ["purchases", "products", "inventory", "lowStock", "stats", "movements"];

interface Line { product: Product; quantity: string; unitCost: string }

function ProductPicker({ onPick }: { onPick: (p: Product) => void }) {
  const [term, setTerm] = useState("");
  const q = useProducts(term.trim() || undefined);
  return (
    <>
      <SearchBox value={term} onChange={setTerm} placeholder="Search product, SKU or barcode" autoFocus />
      <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
        {q.isLoading && !q.data ? <Loading /> : (q.data ?? []).length === 0 ? <Empty icon={bagAddOutline} title="No products found" /> : (
          <div className="divide card" style={{ overflow: "hidden" }}>
            {(q.data ?? []).map(p => (
              <button key={p.id} className="list-row" onClick={() => onPick(p)}>
                <div className="grow"><div className="bold ellipsis" style={{ color: "var(--c-navy)" }}>{p.name}</div><div className="small muted">{p.sku} · {p.stockQuantity} in stock</div></div>
                <span className="small muted mono">cost {num(p.costPrice).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function NewPurchase({ currency, onClose }: { currency: string; onClose: () => void }) {
  const n = useNotify();
  const suppliers = useList<Supplier[]>(["suppliers"], "/suppliers");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const create = useAct((b: object) => api.post<{ purchaseNumber: string }>("/purchases", b), STOCK_ROOTS);

  const total = lines.reduce((s, l) => s + num(l.quantity) * num(l.unitCost), 0);
  const patch = (id: number, p: Partial<Line>) => setLines(ls => ls.map(l => (l.product.id === id ? { ...l, ...p } : l)));
  const add_ = (p: Product) => {
    setLines(ls => (ls.some(l => l.product.id === p.id) ? ls : [...ls, { product: p, quantity: "1", unitCost: String(num(p.costPrice)) }]));
    setPicking(false); setError("");
  };
  const submit = async () => {
    if (!lines.length) return setError("Add at least one product.");
    for (const l of lines) {
      if (!Number.isInteger(num(l.quantity)) || num(l.quantity) < 1) return setError(`Quantity for ${l.product.name} must be a whole number of at least 1.`);
      if (l.unitCost.trim() === "" || num(l.unitCost) < 0) return setError(`Enter a unit cost for ${l.product.name}.`);
    }
    try {
      const r = await create.mutateAsync({ supplierId: supplierId ? Number(supplierId) : null, notes: notes.trim() || null, items: lines.map(l => ({ productId: l.product.id, quantity: Math.trunc(num(l.quantity)), unitCost: num(l.unitCost) })) });
      n.ok(`Purchase order ${r.purchaseNumber} created`); onClose();
    } catch (e) { n.fail(e); }
  };

  if (picking) return <><button className="btn btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setPicking(false)}>← Back to order</button><ProductPicker onPick={add_} /></>;
  return (
    <>
      <Field label="Supplier (optional)">
        <select className="select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
          <option value="">No supplier</option>
          {(suppliers.data ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="stack">
        <div className="row between"><span className="section-title" style={{ margin: 0 }}>Items</span><button className="btn btn-sm btn-ghost" onClick={() => setPicking(true)}><IonIcon icon={add} /> Add product</button></div>
        {lines.length === 0 ? <div className="banner info">No items yet. Tap “Add product” to start the order.</div> : lines.map(l => (
          <div className="card card-pad stack" key={l.product.id}>
            <div className="row"><div className="grow"><div className="bold ellipsis" style={{ color: "var(--c-navy)" }}>{l.product.name}</div><div className="tiny muted">{l.product.sku}</div></div>
              <button className="icon-btn" aria-label="Remove" style={{ color: "var(--c-red)" }} onClick={() => setLines(ls => ls.filter(x => x.product.id !== l.product.id))}><IonIcon icon={trashOutline} /></button></div>
            <div className="grid2">
              <Field label="Quantity"><input className="input" inputMode="numeric" value={l.quantity} onChange={e => patch(l.product.id, { quantity: e.target.value.replace(/\D/g, "") })} /></Field>
              <Field label="Unit cost"><input className="input" inputMode="decimal" value={l.unitCost} onChange={e => patch(l.product.id, { unitCost: e.target.value.replace(/[^\d.]/g, "") })} /></Field>
            </div>
            <div className="right small muted">Line total <b style={{ color: "var(--c-navy)" }}>{money(num(l.quantity) * num(l.unitCost), currency)}</b></div>
          </div>
        ))}
      </div>
      <Field label="Notes"><textarea className="textarea" maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, reference…" /></Field>
      <div className="row between"><span className="muted bold">Order total</span><span className="h2 mono">{money(total, currency)}</span></div>
      {error && <div className="banner bad">{error}</div>}
      <button className="btn btn-primary btn-block" disabled={create.isPending} onClick={submit}>{create.isPending ? "Creating…" : "Create purchase order"}</button>
    </>
  );
}

function PurchaseDetail({ row, currency, onClose }: { row: PurchaseRow; currency: string; onClose: () => void }) {
  const n = useNotify();
  const items = useList<PurchaseItemRow[]>(["purchaseItems", row.purchase.id], `/purchases/${row.purchase.id}/items`);
  const receive = useAct(() => api.post(`/purchases/${row.purchase.id}/receive`), STOCK_ROOTS);
  const cancel = useAct(() => api.post(`/purchases/${row.purchase.id}/cancel`), ["purchases"]);
  const open = row.purchase.status === "ordered" || row.purchase.status === "draft";
  const busy = receive.isPending || cancel.isPending;
  const doReceive = () => n.confirm("Receive this order?", "Stock for every item is added to inventory and product cost prices are updated.", "Receive stock", async () => { try { const r = await receive.mutateAsync(undefined) as { units: number }; n.ok(`Received ${r.units} units`); onClose(); } catch (e) { n.fail(e); } });
  const doCancel = () => n.confirm("Cancel this order?", "This can't be undone.", "Cancel order", async () => { try { await cancel.mutateAsync(undefined); n.ok("Order cancelled"); onClose(); } catch (e) { n.fail(e); } }, true);
  return (
    <>
      <div className="row between"><Pill tone={TONE[row.purchase.status] || ""}>{row.purchase.status}</Pill><span className="small muted">{dateTime(row.purchase.createdAt)}</span></div>
      <div className="grid2">
        <div className="card kpi"><div className="l">Supplier</div><div className="bold ellipsis" style={{ color: "var(--c-navy)" }}>{row.supplier?.name ?? "—"}</div></div>
        <div className="card kpi"><div className="l">Total</div><div className="v">{money(row.purchase.total, currency)}</div></div>
      </div>
      <Async q={items}>
        {rows => (
          <Card pad={false}><div className="divide">
            {rows.map(r => (
              <div className="list-row" key={r.item.id}>
                <div className="grow"><div className="bold ellipsis" style={{ color: "var(--c-navy)" }}>{r.product?.name ?? `Product #${r.item.productId}`}</div><div className="small muted">{r.item.quantity} × {money(r.item.unitCost, currency)}</div></div>
                <b className="mono">{money(r.item.lineTotal, currency)}</b>
              </div>
            ))}
          </div></Card>
        )}
      </Async>
      {row.purchase.notes && <div className="banner info">{row.purchase.notes}</div>}
      {open && (
        <div className="grid2">
          <button className="btn btn-danger" disabled={busy} onClick={doCancel}><IonIcon icon={closeCircleOutline} /> Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={doReceive}><IonIcon icon={checkmarkCircleOutline} /> Receive</button>
        </div>
      )}
    </>
  );
}

export default function Purchases() {
  const { tenant } = useSession();
  const currency = tenant?.currency ?? "PKR";
  const q = useList<PurchaseRow[]>(["purchases"], "/purchases");
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<PurchaseRow | null>(null);
  const [status, setStatus] = useState<"all" | "ordered" | "received" | "cancelled">("all");
  const shown = (rows: PurchaseRow[]) => rows.filter(r => status === "all" || r.purchase.status === status || (status === "ordered" && r.purchase.status === "draft"));

  return (
    <Screen title="Purchase orders" subtitle="Order and receive stock" back="/more" onRefresh={() => q.refetch()} right={<button className="icon-btn" aria-label="New purchase order" onClick={() => setCreating(true)}><IonIcon icon={add} /></button>}>
      <div className="chips">
        {(["all", "ordered", "received", "cancelled"] as const).map(s => <button key={s} className={`chip ${status === s ? "on" : ""}`} onClick={() => setStatus(s)} style={{ textTransform: "capitalize" }}>{s}</button>)}
      </div>
      <Async q={q} empty={rows => rows.length === 0 ? <Empty icon={bagAddOutline} title="No purchase orders" hint="Order stock from a supplier and receive it to update inventory." action={<button className="btn btn-primary" onClick={() => setCreating(true)}>New purchase order</button>} /> : shown(rows).length === 0 ? <Empty icon={bagAddOutline} title={`No ${status} orders`} /> : null}>
        {rows => (
          <Card pad={false}><div className="divide">
            {shown(rows).map(r => (
              <button className="list-row" key={r.purchase.id} onClick={() => setView(r)}>
                <div className="grow">
                  <div className="row"><b style={{ color: "var(--c-navy)" }}>{r.purchase.purchaseNumber}</b><Pill tone={TONE[r.purchase.status] || ""}>{r.purchase.status}</Pill></div>
                  <div className="small muted ellipsis">{r.supplier?.name ?? "No supplier"} · {r.itemCount} units · {dateTime(r.purchase.createdAt)}</div>
                </div>
                <b className="mono">{money(r.purchase.total, currency)}</b>
              </button>
            ))}
          </div></Card>
        )}
      </Async>
      <Sheet open={creating} onClose={() => setCreating(false)} title="New purchase order">{creating && <NewPurchase currency={currency} onClose={() => setCreating(false)} />}</Sheet>
      <Sheet open={view !== null} onClose={() => setView(null)} title={view?.purchase.purchaseNumber ?? ""}>{view && <PurchaseDetail row={view} currency={currency} onClose={() => setView(null)} />}</Sheet>
    </Screen>
  );
}
