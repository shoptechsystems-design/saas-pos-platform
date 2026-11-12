import { IonIcon } from "@ionic/react";
import { useQueryClient } from "@tanstack/react-query";
import { addOutline, cartOutline, checkmarkCircleOutline, cloudOfflineOutline, personOutline, removeOutline, shareOutline, trashOutline } from "ionicons/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import QueueBanner from "~/components/QueueBanner";
import { Async, Empty, Field, Screen, SearchBox, Seg, Sheet, useNotify } from "~/components/ui";
import { CartLine, cashSuggestions, computeTotals, unitCents } from "~/lib/cart";
import { dateTime, money } from "~/lib/format";
import { success, receiptText, shareText, tap, warn } from "~/lib/native";
import { enqueue, newRequestId } from "~/lib/offline";
import { keys, useCategories, useCustomers, useProducts } from "~/lib/queries";
import { api, ApiError } from "~/lib/rest";
import { useSession } from "~/lib/session";
import type { CheckoutResult, PaymentMethod, Product } from "~/lib/types";

type Outcome = { kind: "online"; r: CheckoutResult; lines: CartLine[]; change: string } | { kind: "offline"; total: number; items: number };

function useDebounced<X>(v: X, ms = 250) { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; }

export default function Sell() {
  const s = useSession(); const qc = useQueryClient(); const { fail, ok } = useNotify();
  const cur = s.tenant?.currency; const taxRate = Number(s.tenant?.taxRate ?? 0);
  const [search, setSearch] = useState(""); const q = useDebounced(search.trim());
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null);
  const [open, setOpen] = useState(false); const [outcome, setOutcome] = useState<Outcome | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const products = useProducts(q || undefined, categoryId); const categories = useCategories(); const all = useProducts();
  const totalsNow = useMemo(() => computeTotals(cart, 0, taxRate), [cart, taxRate]);
  const inCart = (id: number) => cart.find(l => l.product.id === id)?.qty ?? 0;

  const add = (p: Product, by = 1) => {
    const have = inCart(p.id);
    if (p.stockQuantity <= 0) { warn(); return fail(new Error(`${p.name} is out of stock.`)); }
    if (have + by > p.stockQuantity) { warn(); return fail(new Error(`Only ${p.stockQuantity} of ${p.name} in stock.`)); }
    tap();
    setCart(c => have ? c.map(l => (l.product.id === p.id ? { ...l, qty: l.qty + by } : l)) : [...c, { product: p, qty: by }]);
  };
  const setQty = (id: number, qty: number) => setCart(c => qty <= 0 ? c.filter(l => l.product.id !== id) : c.map(l => (l.product.id === id ? { ...l, qty: Math.min(qty, l.product.stockQuantity) } : l)));

  /** Bluetooth HID scanners type the code then press Enter: exact barcode/SKU match goes straight to the cart. */
  const scan = async () => {
    const code = search.trim(); if (!code) return;
    const eq = (p: Product) => p.barcode?.toLowerCase() === code.toLowerCase() || p.sku.toLowerCase() === code.toLowerCase();
    let list: Product[] = products.data ?? [];
    try { list = await qc.fetchQuery({ queryKey: keys.products(code), queryFn: () => api.get<Product[]>(`/products?query=${encodeURIComponent(code)}`), staleTime: 0 }); }
    catch { list = all.data ?? list; }
    const hit = list.find(eq);
    if (hit) { add(hit); setSearch(""); searchRef.current?.focus(); } else { warn(); fail(new Error(`No product with barcode or SKU "${code}".`)); }
  };

  const reset = () => { setCart([]); setCustomer(null); setOpen(false); };

  return (
    <Screen title="Sell" onRefresh={() => qc.invalidateQueries({ queryKey: ["products"] })} right={cart.length ? <button className="btn btn-sm" onClick={() => { tap(); setCart([]); }}>Clear</button> : undefined}>
      <QueueBanner currency={cur} />
      <SearchBox value={search} onChange={setSearch} onEnter={scan} placeholder="Search or scan barcode" />
      <div className="chips">
        <button className={`chip ${!categoryId ? "on" : ""}`} onClick={() => setCategoryId(undefined)}>All</button>
        {categories.data?.map(c => <button key={c.id} className={`chip ${categoryId === c.id ? "on" : ""}`} onClick={() => setCategoryId(categoryId === c.id ? undefined : c.id)}>{c.name}</button>)}
      </div>
      <Async q={products} empty={d => d.length ? null : <Empty icon={cartOutline} title="No products found" hint={q ? `Nothing matches "${q}".` : "Add products in the Inventory tab."} />}>
        {d => (
          <div className="product-grid">
            {d.map(p => (
              <button key={p.id} className={`product ${p.stockQuantity <= 0 ? "out" : ""}`} onClick={() => add(p)}>
                {inCart(p.id) > 0 && <span className="qty-badge">{inCart(p.id)}</span>}
                <div className="img">{p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" /> : p.name.slice(0, 1).toUpperCase()}</div>
                <div className="name">{p.name}</div>
                <div className="row between"><b className="mono" style={{ color: "var(--c-teal)" }}>{money(unitCents(p) / 100, cur)}</b><span className={`tiny ${p.stockQuantity <= p.minStockLevel ? "" : "muted"}`} style={p.stockQuantity <= p.minStockLevel ? { color: "var(--c-amber)", fontWeight: 700 } : undefined}>{p.stockQuantity <= 0 ? "Out" : `${p.stockQuantity} left`}</span></div>
              </button>
            ))}
          </div>
        )}
      </Async>
      {cart.length > 0 && (
        <div className="cartbar"><button className="btn btn-primary btn-block" style={{ justifyContent: "space-between" }} onClick={() => { tap(); setOpen(true); }}>
          <span className="row"><IonIcon icon={cartOutline} /> {totalsNow.items} item{totalsNow.items > 1 ? "s" : ""}</span><span className="mono">{money(totalsNow.total, cur)} · Review</span></button></div>
      )}

      <CheckoutSheet open={open} onClose={() => setOpen(false)} cart={cart} setQty={setQty} customer={customer} setCustomer={setCustomer} cur={cur} taxRate={taxRate}
        business={s.tenant?.name ?? "Karyano"} footer={s.tenant?.receiptFooter}
        onDone={o => { setOutcome(o); reset(); if (o.kind === "online") success(); }} onError={fail} />
      <ResultSheet outcome={outcome} onClose={() => { setOutcome(null); setTimeout(() => searchRef.current?.focus(), 200); }} cur={cur} business={s.tenant?.name ?? "Karyano"} footer={s.tenant?.receiptFooter} onShared={() => ok("Receipt shared")} />
    </Screen>
  );
}

function CustomerPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (c: { id: number; name: string } | null) => void }) {
  const [q, setQ] = useState(""); const d = useDebounced(q); const list = useCustomers(d || undefined);
  return (
    <Sheet open={open} onClose={onClose} title="Select customer">
      <SearchBox value={q} onChange={setQ} placeholder="Search name, phone or email" />
      <button className="btn btn-block" onClick={() => { onPick(null); onClose(); }}><IonIcon icon={personOutline} /> Walk-in customer</button>
      <Async q={list} empty={x => x.length ? null : <div className="muted small center">No customers match.</div>}>
        {x => <div className="card divide">{x.slice(0, 40).map(c => <button key={c.id} className="list-row" onClick={() => { onPick({ id: c.id, name: c.name }); onClose(); }}><div className="avatar round">{c.name.slice(0, 1).toUpperCase()}</div><div className="grow"><div className="bold">{c.name}</div><div className="small muted">{c.phone ?? c.email ?? "No contact"}</div></div></button>)}</div>}
      </Async>
    </Sheet>
  );
}

function CheckoutSheet(p: { open: boolean; onClose: () => void; cart: CartLine[]; setQty: (id: number, q: number) => void; customer: { id: number; name: string } | null; setCustomer: (c: { id: number; name: string } | null) => void; cur?: string; taxRate: number; business: string; footer?: string | null; onDone: (o: Outcome) => void; onError: (e: unknown) => void }) {
  const qc = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>("cash"); const [discount, setDiscount] = useState(""); const [received, setReceived] = useState(""); const [busy, setBusy] = useState(false); const [pick, setPick] = useState(false);
  const reqId = useRef(newRequestId());
  const t = computeTotals(p.cart, Number(discount) || 0, p.taxRate);
  const recv = received === "" ? t.total : Number(received);
  const short = method === "cash" && recv + 0.0001 < t.total;
  useEffect(() => { if (p.open) { setReceived(""); } }, [p.open]);

  const pay = async () => {
    if (busy || !p.cart.length) return;
    if (short) { warn(); return p.onError(new Error("Amount received is less than the total.")); }
    setBusy(true);
    const payload = { items: p.cart.map(l => ({ productId: l.product.id, quantity: l.qty })), customerId: p.customer?.id ?? null, paymentMethod: method, amountReceived: method === "cash" ? recv : t.total, discount: t.discount, clientRequestId: reqId.current };
    const lines = p.cart;
    try {
      const r = await api.post<CheckoutResult>("/pos/checkout", payload);
      ["products", "sales", "stats", "recent", "customers", "lowStock", "trend", "top", "mix", "shift"].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
      reqId.current = newRequestId(); setDiscount(""); setReceived(""); setMethod("cash");
      p.onDone({ kind: "online", r, lines, change: r.change });
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork) {
        // No connection (or server trouble): keep the sale safely on this phone; it syncs automatically, and the stable id prevents duplicates.
        enqueue({ payload, summary: { total: t.total, itemCount: t.items, customerName: p.customer?.name } });
        reqId.current = newRequestId(); setDiscount(""); setReceived(""); setMethod("cash");
        p.onDone({ kind: "offline", total: t.total, items: t.items });
      } else { warn(); p.onError(e); }
    } finally { setBusy(false); }
  };

  return (
    <Sheet open={p.open} onClose={p.onClose} title="Checkout">
      <div className="card divide">
        {p.cart.map(l => (
          <div className="list-row" key={l.product.id}>
            <div className="grow"><div className="bold" style={{ lineHeight: 1.25, overflowWrap: "anywhere" }}>{l.product.name}</div><div className="small muted mono">{money(unitCents(l.product) / 100, p.cur)} each</div></div>
            <div className="stepper"><button aria-label="Less" onClick={() => p.setQty(l.product.id, l.qty - 1)}><IonIcon icon={l.qty === 1 ? trashOutline : removeOutline} /></button><span>{l.qty}</span><button aria-label="More" onClick={() => p.setQty(l.product.id, l.qty + 1)}><IonIcon icon={addOutline} /></button></div>
            <b className="mono" style={{ minWidth: 76, textAlign: "right" }}>{money((unitCents(l.product) * l.qty) / 100, p.cur)}</b>
          </div>
        ))}
      </div>
      <button className="btn btn-block" style={{ justifyContent: "space-between" }} onClick={() => setPick(true)}><span className="row"><IonIcon icon={personOutline} /> {p.customer ? p.customer.name : "Walk-in customer"}</span><span className="muted small">Change</span></button>
      <CustomerPicker open={pick} onClose={() => setPick(false)} onPick={p.setCustomer} />
      <Field label={`Discount (${p.cur ?? "PKR"})`}><input className="input" inputMode="decimal" placeholder="0" value={discount} onChange={e => setDiscount(e.target.value.replace(/[^\d.]/g, ""))} /></Field>
      <Seg value={method} onChange={setMethod} options={[{ value: "cash", label: "Cash" }, { value: "card", label: "Card" }, { value: "transfer", label: "Transfer" }, { value: "other", label: "Other" }]} />
      {method === "cash" && (
        <Field label="Amount received" error={short ? "Less than the total." : undefined}>
          <input className={`input ${short ? "invalid" : ""}`} inputMode="decimal" placeholder={String(t.total)} value={received} onChange={e => setReceived(e.target.value.replace(/[^\d.]/g, ""))} />
          <div className="row wrap" style={{ gap: 6 }}>{cashSuggestions(t.total).map(v => <button key={v} className="chip" onClick={() => setReceived(String(v))}>{money(v, p.cur)}</button>)}</div>
        </Field>
      )}
      <div className="card card-pad stack" style={{ gap: 6 }}>
        <div className="row between small"><span className="muted">Subtotal</span><span className="mono">{money(t.subtotal, p.cur)}</span></div>
        {t.discount > 0 && <div className="row between small"><span className="muted">Discount</span><span className="mono">-{money(t.discount, p.cur)}</span></div>}
        <div className="row between small"><span className="muted">Tax ({p.taxRate}%)</span><span className="mono">{money(t.tax, p.cur)}</span></div>
        <div className="row between" style={{ fontSize: 20, fontWeight: 800, color: "var(--c-navy)" }}><span>Total</span><span className="mono">{money(t.total, p.cur)}</span></div>
        {method === "cash" && !short && recv > t.total && <div className="row between small" style={{ color: "var(--c-green)", fontWeight: 700 }}><span>Change due</span><span className="mono">{money(recv - t.total, p.cur)}</span></div>}
      </div>
      <button className="btn btn-primary btn-block" disabled={busy || !p.cart.length} onClick={pay}>{busy ? "Processing…" : `Charge ${money(t.total, p.cur)}`}</button>
    </Sheet>
  );
}

function ResultSheet({ outcome, onClose, cur, business, footer, onShared }: { outcome: Outcome | null; onClose: () => void; cur?: string; business: string; footer?: string | null; onShared: () => void }) {
  return (
    <Sheet open={Boolean(outcome)} onClose={onClose} title={outcome?.kind === "offline" ? "Saved offline" : "Payment complete"}>
      {outcome?.kind === "online" && (() => {
        const { r, lines } = outcome; const text = receiptText({ business, saleNumber: r.saleNumber, when: dateTime(new Date()), lines: lines.map(l => ({ name: l.product.name, qty: l.qty, total: money((unitCents(l.product) * l.qty) / 100, cur) })), subtotal: money(r.subtotal, cur), discount: money(r.discount, cur), tax: money(r.tax, cur), total: money(r.total, cur), change: Number(r.change) > 0 ? money(r.change, cur) : undefined, footer: r.footer ?? footer });
        return <>
          <div className="success-ring"><IonIcon icon={checkmarkCircleOutline} /></div>
          <div className="center"><div className="h1 mono">{money(r.total, cur)}</div><div className="muted">{r.saleNumber}{r.replayed ? " · already recorded" : ""}</div></div>
          {Number(r.change) > 0 && <div className="banner ok center" style={{ justifyContent: "center", fontSize: 16 }}>Change due: <b className="mono">{money(r.change, cur)}</b></div>}
          <div className="receipt">
            {lines.map(l => <div className="ln" key={l.product.id}><span>{l.qty} × {l.product.name}</span><span className="mono">{money((unitCents(l.product) * l.qty) / 100, cur)}</span></div>)}
            <div className="ln tot"><span>Total</span><span className="mono">{money(r.total, cur)}</span></div>
          </div>
          <button className="btn btn-block" onClick={async () => { await shareText(`Receipt ${r.saleNumber}`, text); onShared(); }}><IonIcon icon={shareOutline} /> Share receipt</button>
        </>;
      })()}
      {outcome?.kind === "offline" && <>
        <div className="success-ring" style={{ background: "var(--c-amber-soft)", color: "var(--c-amber)" }}><IonIcon icon={cloudOfflineOutline} /></div>
        <div className="center"><div className="h1 mono">{money(outcome.total, cur)}</div><div className="muted">{outcome.items} item{outcome.items > 1 ? "s" : ""}</div></div>
        <div className="banner warn">No connection right now. This sale is saved on your phone and will be sent automatically when you're back online — it can't be duplicated.</div>
      </>}
      <button className="btn btn-primary btn-block" onClick={onClose}>New sale</button>
    </Sheet>
  );
}
