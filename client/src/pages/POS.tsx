import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, BookOpen, Check, Clock, CreditCard, Landmark, Loader2, MessageCircle, Minus, PackageX, Percent, Plus, Printer, Search, ShoppingBag, Tag, Trash2, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { moneyWhole as money } from "@/lib/format";
import { printReceipt, receiptText, whatsappLink, type ReceiptData } from "@/lib/receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtTime } from "@/components/data/kit";

type Product = any;
type CartLine = { product: Product; quantity: number };
type Held = { id: string; lines: CartLine[]; customerId: number | null; time: string };
type Method = "cash" | "card" | "transfer" | "other" | "credit";

const METHODS: { id: Method; label: string; icon: typeof Banknote }[] = [
  { id: "cash", label: "Cash", icon: Banknote }, { id: "card", label: "Card", icon: CreditCard }, { id: "transfer", label: "Transfer", icon: Landmark }, { id: "other", label: "Other", icon: Wallet }, { id: "credit", label: "Udhaar", icon: BookOpen },
];
const unitPrice = (p: Product) => Number(p.discountPrice ?? p.sellingPrice);

/* ───────── cash-drawer shift bar + dialogs ───────── */
function ShiftBar() {
  const utils = trpc.useUtils();
  const cur = trpc.shifts.current.useQuery(undefined, { refetchInterval: 30000 });
  const [openDlg, setOpenDlg] = useState(false);
  const [closeDlg, setCloseDlg] = useState(false);
  const [float, setFloat] = useState("");
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");

  const open = trpc.shifts.open.useMutation({ onSuccess: async () => { toast.success("Shift opened."); setOpenDlg(false); setFloat(""); await utils.shifts.invalidate(); }, onError: e => toast.error(e.message) });
  const close = trpc.shifts.close.useMutation({
    onSuccess: async r => { toast.success(r.variance === 0 ? "Shift closed. Drawer balanced." : `Shift closed. Variance ${r.variance > 0 ? "+" : "−"}${money(Math.abs(r.variance))}.`); setCloseDlg(false); setCounted(""); setNotes(""); await utils.shifts.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const d = cur.data;
  const variance = d ? Number(counted || 0) - d.expectedCash : 0;
  const inputCls = "mt-1.5 h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900";

  return (
    <>
      {cur.isLoading ? null : d ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" /></span>
            <p className="text-sm font-semibold text-teal-900">Shift open since {fmtTime(d.shift.openedAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-teal-900/80">
            <span>Sales <b className="text-teal-950">{money(d.totalSales)}</b> · {d.orders} orders</span>
            <span>Cash in drawer should be <b className="text-teal-950">{money(d.expectedCash)}</b></span>
            <Button size="sm" onClick={() => setCloseDlg(true)} className="h-8 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800">Close shift</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900"><b>No open shift.</b> Open one to track your cash drawer and reconcile at close.</p>
          <Button size="sm" onClick={() => setOpenDlg(true)} className="h-8 w-fit rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white hover:bg-amber-700">Open shift</Button>
        </div>
      )}

      <Dialog open={openDlg} onOpenChange={setOpenDlg}>
        <DialogContent className="rounded-2xl border-slate-200 bg-white p-6 text-slate-900">
          <DialogHeader><DialogTitle className="text-xl font-bold">Open shift</DialogTitle></DialogHeader>
          <div><label className="text-xs font-semibold text-slate-600">Opening cash in drawer (PKR)</label><Input type="number" min="0" inputMode="decimal" value={float} onChange={e => setFloat(e.target.value)} placeholder="e.g. 10000" className={inputCls} autoFocus /></div>
          <Button onClick={() => open.mutate({ openingCash: Number(float) || 0 })} disabled={open.isPending || float === ""} className="h-11 w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-700">{open.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Start shift</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDlg} onOpenChange={setCloseDlg}>
        <DialogContent className="rounded-2xl border-slate-200 bg-white p-6 text-slate-900">
          <DialogHeader><DialogTitle className="text-xl font-bold">Close shift</DialogTitle></DialogHeader>
          {d && <div className="space-y-4">
            <dl className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Opening cash</dt><dd className="tabular-nums">{money(d.shift.openingCash)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Cash sales</dt><dd className="tabular-nums">{money(d.cashSales)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><dt>Expected in drawer</dt><dd className="tabular-nums">{money(d.expectedCash)}</dd></div>
            </dl>
            <div><label className="text-xs font-semibold text-slate-600">Counted cash (PKR)</label><Input type="number" min="0" inputMode="decimal" value={counted} onChange={e => setCounted(e.target.value)} className={inputCls} autoFocus /></div>
            {counted !== "" && <p className={`rounded-xl px-3 py-2 text-sm font-semibold ${variance === 0 ? "bg-emerald-50 text-emerald-700" : variance < 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{variance === 0 ? "Drawer is balanced." : `${variance < 0 ? "Short" : "Over"} by ${money(Math.abs(variance))}`}</p>}
            <div><label className="text-xs font-semibold text-slate-600">Notes (optional)</label><Input value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} /></div>
            <Button onClick={() => close.mutate({ countedCash: Number(counted), notes: notes || null })} disabled={close.isPending || counted === ""} className="h-11 w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-700">{close.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Close shift</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ───────── main terminal ───────── */
export default function POSView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const utils = trpc.useUtils();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<number | undefined>();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [discountInput, setDiscountInput] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<Method>("cash");
  const [received, setReceived] = useState("");
  const [payNow, setPayNow] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ data: ReceiptData; phone: string | null } | null>(null);
  const requestId = useRef<string>("");

  const { data: categories = [] } = trpc.catalog.categories.useQuery();
  const { data: products = [], isLoading: loadingProducts } = trpc.catalog.products.useQuery({ query: search, categoryId: category });
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: settings } = trpc.tenant.settings.useQuery();
  const { data: ctx } = trpc.tenant.context.useQuery();

  /* held orders persist per workspace */
  const holdKey = `karyano:held:${ctx?.tenant?.id ?? "x"}`;
  const [held, setHeld] = useState<Held[]>([]);
  useEffect(() => { try { setHeld(JSON.parse(localStorage.getItem(holdKey) || "[]")); } catch { setHeld([]); } }, [holdKey]);
  const saveHeld = (next: Held[]) => { setHeld(next); try { localStorage.setItem(holdKey, JSON.stringify(next)); } catch { /* storage unavailable */ } };

  /* "/" focuses search */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const taxRate = Number(settings?.taxRate ?? 18);
  const subtotal = useMemo(() => cart.reduce((s, l) => s + unitPrice(l.product) * l.quantity, 0), [cart]);
  const discountRaw = Number(discountInput) || 0;
  const discount = Math.min(subtotal, Math.max(0, discountMode === "percent" ? (subtotal * Math.min(discountRaw, 100)) / 100 : discountRaw));
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * taxRate) / 100;
  const total = taxable + tax;
  const itemCount = cart.reduce((n, l) => n + l.quantity, 0);
  const receivedNum = Number(received) || 0;
  const change = Math.max(0, receivedNum - total);
  const customer = customers.find(c => c.id === customerId);
  // Udhaar: what is paid now vs put on the customer's account, and whether it stays inside their limit.
  const payNowNum = Math.min(Math.max(0, Number(payNow) || 0), total);
  const creditAmt = Math.max(0, total - payNowNum);
  const owed = Number(customer?.balance ?? 0);
  const creditLimit = customer?.creditLimit != null ? Number(customer.creditLimit) : null;
  const overLimit = creditLimit !== null && owed + creditAmt > creditLimit;

  const add = (p: Product) => {
    if (p.stockQuantity <= 0) return toast.error(`${p.name} is out of stock.`);
    setCart(prev => {
      const ex = prev.find(l => l.product.id === p.id);
      if (ex) { if (ex.quantity >= p.stockQuantity) { toast.error(`Only ${p.stockQuantity} of ${p.name} in stock.`); return prev; } return prev.map(l => (l.product.id === p.id ? { ...l, quantity: l.quantity + 1 } : l)); }
      return [...prev, { product: p, quantity: 1 }];
    });
  };
  const setQty = (id: number, delta: number) => setCart(prev => prev.flatMap(l => {
    if (l.product.id !== id) return [l];
    const n = l.quantity + delta;
    if (n <= 0) return [];
    if (n > l.product.stockQuantity) { toast.error("Exceeds available stock."); return [l]; }
    return [{ ...l, quantity: n }];
  }));
  const clear = () => { setCart([]); setDiscountInput(""); setCustomerId(null); };

  const onSearchEnter = () => {
    const q = search.trim().toLowerCase();
    if (!q) return;
    const exact = products.find(p => (p.barcode ?? "").toLowerCase() === q || p.sku.toLowerCase() === q) ?? (products.length === 1 ? products[0] : undefined);
    if (exact) { add(exact); setSearch(""); } else toast.error(products.length ? "Several matches. Tap the product to add it." : `No product found for “${search}”.`);
  };

  const hold = () => {
    if (!cart.length) return;
    saveHeld([...held, { id: `H${(held.length + 1).toString().padStart(2, "0")}-${Date.now().toString(36).slice(-3).toUpperCase()}`, lines: cart, customerId, time: new Date().toISOString() }]);
    clear(); setCartOpen(false); toast.success("Order held. Resume it from the chips above the cart.");
  };
  const resume = (h: Held) => {
    if (cart.length && !window.confirm("Replace the current order with the held one?")) return;
    setCart(h.lines); setCustomerId(h.customerId); saveHeld(held.filter(x => x.id !== h.id));
  };

  const checkout = trpc.pos.checkout.useMutation({
    onSuccess: res => {
      const snapshot = cart;
      setReceipt({
        phone: customer?.phone ?? null,
        data: { business: { name: settings?.name ?? "Karyano", footer: settings?.receiptFooter }, saleNumber: res.saleNumber, date: new Date(), cashier: ctx ? undefined : undefined, customer: customer?.name, paymentMethod: method === "credit" ? "udhaar" : method,
          credit: Number(res.creditAmount) > 0 ? { amount: res.creditAmount, balance: res.balance } : undefined,
          items: snapshot.map(l => ({ name: l.product.name, quantity: l.quantity, unitPrice: unitPrice(l.product), lineTotal: unitPrice(l.product) * l.quantity })),
          subtotal: res.subtotal, discount: res.discount, tax: res.tax, total: res.total, received: method === "cash" ? received : method === "credit" ? String(payNowNum) : res.total, change: res.change },
      });
      setPayOpen(false); setCartOpen(false); clear(); setReceived(""); requestId.current = "";
      toast.success(`Sale ${res.saleNumber} completed.`);
      utils.catalog.products.invalidate(); utils.dashboard.invalidate(); utils.customers.list.invalidate(); utils.salesHistory.invalidate(); utils.shifts.invalidate(); utils.inventory.invalidate();
    },
    onError: e => toast.error(e.message),
  });
  const startPayment = () => { requestId.current = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/-/g, "").slice(0, 32); setMethod("cash"); setReceived(""); setPayNow(""); setPayOpen(true); };
  const canPay = method === "credit" ? !!customer && creditAmt > 0 && !overLimit : method !== "cash" || receivedNum >= total;
  const quick = useMemo(() => { const step = total > 5000 ? 1000 : total > 1000 ? 500 : 100; const r = Math.ceil(total / step) * step; return Array.from(new Set([Math.ceil(total), r, r + step, r + step * 2, Math.ceil((r + step * 3) / 1000) * 1000])).filter(v => v >= total).slice(0, 5); }, [total]);

  /* ── cart panel (shared by desktop aside and mobile sheet) ── */
  const CartBody = (
    <div className="flex h-full min-h-0 flex-col">
      {held.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-2.5">
          {held.map(h => <button key={h.id} onClick={() => resume(h)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"><Clock className="h-3 w-3" />{h.id} · {h.lines.reduce((n, l) => n + l.quantity, 0)} items · {fmtTime(h.time)}</button>)}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"><ShoppingBag className="h-6 w-6 text-slate-400" /></span><p className="mt-4 text-sm font-semibold text-slate-700">Cart is empty</p><p className="mt-1 text-xs text-slate-500">Tap a product or scan a barcode to add it.</p></div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cart.map(l => (
              <li key={l.product.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{l.product.name}</p><p className="text-xs text-slate-500">{money(unitPrice(l.product))} each</p></div>
                <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                  <button onClick={() => setQty(l.product.id, -1)} aria-label={`Decrease ${l.product.name}`} className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums">{l.quantity}</span>
                  <button onClick={() => setQty(l.product.id, 1)} aria-label={`Increase ${l.product.name}`} className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <p className="w-20 text-right text-sm font-bold tabular-nums">{money(unitPrice(l.product) * l.quantity)}</p>
                <button onClick={() => setCart(c => c.filter(x => x.product.id !== l.product.id))} aria-label={`Remove ${l.product.name}`} className="text-slate-300 transition hover:text-rose-500"><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Select value={customerId ? String(customerId) : "walk"} onValueChange={v => setCustomerId(v === "walk" ? null : Number(v))}>
            <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-64 border-slate-200 bg-white text-slate-900"><SelectItem value="walk">Walk-in customer</SelectItem>{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}{Number(c.balance) > 0 ? ` · owes ${money(Number(c.balance))}` : ""}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button onClick={() => setDiscountMode(m => (m === "amount" ? "percent" : "amount"))} aria-label="Toggle discount type" title="Toggle ₨ / %" className="flex w-9 items-center justify-center border-r border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-slate-100">{discountMode === "percent" ? <Percent className="h-3.5 w-3.5" /> : "₨"}</button>
            <input value={discountInput} onChange={e => setDiscountInput(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="Discount" aria-label="Discount" className="h-10 w-20 bg-white px-2 text-sm outline-none placeholder:text-slate-400" />
          </div>
        </div>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600"><dt>Subtotal</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-slate-600"><dt>Discount{discountMode === "percent" ? ` (${Math.min(discountRaw, 100)}%)` : ""}</dt><dd className="tabular-nums text-rose-600">−{money(discount)}</dd></div>}
          <div className="flex justify-between text-slate-600"><dt>Tax ({taxRate}%)</dt><dd className="tabular-nums">{money(tax)}</dd></div>
          <div className="flex items-baseline justify-between border-t border-slate-200 pt-2.5"><dt className="text-base font-bold">Total</dt><dd className="text-2xl font-extrabold tabular-nums text-slate-900">{money(total)}</dd></div>
        </dl>
        <div className="grid grid-cols-[auto_auto_1fr] gap-2">
          <Button variant="outline" onClick={hold} disabled={!cart.length} className="h-12 rounded-xl border-slate-200 bg-white px-4 font-semibold"><Clock className="mr-1.5 h-4 w-4" />Hold</Button>
          <Button variant="outline" onClick={clear} disabled={!cart.length} aria-label="Clear cart" className="h-12 rounded-xl border-slate-200 bg-white px-3.5 text-slate-500 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button>
          <Button onClick={startPayment} disabled={!cart.length} className="h-12 rounded-xl bg-gradient-to-b from-teal-400 to-teal-500 text-base font-extrabold text-teal-950 shadow-[0_10px_24px_-10px_rgba(20,184,166,0.8)] hover:from-teal-300 hover:to-teal-400 disabled:opacity-50">Charge {money(total)}</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <ShiftBar />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_330px] lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* catalogue */}
        <div className="min-w-0 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && onSearchEnter()} placeholder="Search or scan barcode…" aria-label="Search products" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-10 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
            {!search && <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 lg:block">/</kbd>}
            {search && <button onClick={() => { setSearch(""); searchRef.current?.focus(); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {[{ id: undefined as number | undefined, name: "All" }, ...categories].map(c => (
              <button key={c.id ?? "all"} onClick={() => setCategory(c.id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${category === c.id ? "bg-slate-900 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{c.name}</button>
            ))}
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center"><PackageX className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No products found</p><p className="mt-1 text-xs text-slate-500">Try another search or category.</p>{!search && <Button onClick={() => setActiveTab("products")} className="mt-4 rounded-xl bg-slate-900 text-white hover:bg-slate-700">Add products</Button>}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-24 sm:grid-cols-3 md:grid-cols-2 md:pb-0 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {products.map(p => {
                const out = p.stockQuantity <= 0, low = !out && p.stockQuantity <= p.minStockLevel;
                const inCart = cart.find(l => l.product.id === p.id)?.quantity ?? 0;
                return (
                  <button key={p.id} onClick={() => add(p)} disabled={out} className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition active:scale-[0.98] ${out ? "cursor-not-allowed opacity-50" : "hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"} ${inCart ? "border-teal-400 ring-2 ring-teal-400/30" : "border-slate-200"}`}>
                    <div className="relative aspect-[5/3] w-full overflow-hidden bg-slate-100">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : (() => { const c = categories.find(x => x.id === p.categoryId)?.color ?? "#64748b"; return <div className="flex h-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${c}26, ${c}0d)` }}><span className="text-3xl font-extrabold tracking-tight" style={{ color: c }}>{p.name.split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}</span></div>; })()}
                      {inCart > 0 && <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-teal-500 px-1.5 text-xs font-bold text-white shadow">{inCart}</span>}
                      {(out || low) && <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${out ? "bg-rose-600 text-white" : "bg-amber-400 text-amber-950"}`}>{out ? "Out of stock" : `Only ${p.stockQuantity} left`}</span>}
                    </div>
                    <div className="flex flex-1 flex-col p-3"><p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-slate-900">{p.name}</p><p className="mt-1.5 text-base font-extrabold tabular-nums text-teal-700">{money(unitPrice(p))}</p></div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* desktop cart */}
        <aside className="hidden md:block">
          <div className="sticky top-0 flex max-h-[calc(100dvh-10rem)] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-12px_rgba(15,23,42,0.1)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5"><h3 className="flex items-center gap-2 text-base font-bold"><ShoppingBag className="h-4 w-4 text-teal-600" /> Current order</h3><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{itemCount} items</span></div>
            {CartBody}
          </div>
        </aside>
      </div>

      {/* mobile / tablet cart bar + sheet */}
      <div className="fixed inset-x-0 bottom-0 z-30 p-3 md:hidden">
        <button onClick={() => setCartOpen(true)} className="flex h-14 w-full items-center justify-between rounded-2xl bg-slate-900 px-5 text-white shadow-2xl shadow-slate-900/30 active:scale-[0.99]">
          <span className="flex items-center gap-3"><span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><ShoppingBag className="h-4 w-4" />{itemCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-400 px-1 text-[11px] font-bold text-teal-950">{itemCount}</span>}</span><span className="text-sm font-semibold">{itemCount ? "View order" : "Cart is empty"}</span></span>
          <span className="text-lg font-extrabold tabular-nums">{money(total)}</span>
        </button>
      </div>
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="flex h-[88dvh] flex-col gap-0 rounded-t-3xl border-slate-200 bg-white p-0 text-slate-900">
          <SheetHeader className="border-b border-slate-100 px-4 py-4 text-left"><SheetTitle className="flex items-center gap-2 text-base font-bold"><ShoppingBag className="h-4 w-4 text-teal-600" /> Current order · {itemCount} items</SheetTitle></SheetHeader>
          <div className="min-h-0 flex-1">{CartBody}</div>
        </SheetContent>
      </Sheet>

      {/* payment */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto rounded-2xl border-slate-200 bg-white p-5 text-slate-900 sm:p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold">Take payment</DialogTitle></DialogHeader>
          <div className="rounded-2xl bg-slate-900 p-5 text-center text-white"><p className="text-xs font-medium text-slate-400">Amount due</p><p className="mt-1 text-4xl font-extrabold tabular-nums">{money(total)}</p></div>
          <div className="grid grid-cols-5 gap-1.5">
            {METHODS.map(m => <button key={m.id} onClick={() => setMethod(m.id)} className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[11px] font-semibold transition ${method === m.id ? "border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><m.icon className="h-5 w-5" />{m.label}</button>)}
          </div>
          {method === "cash" && (
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-slate-600">Cash received</label><Input type="number" inputMode="decimal" value={received} onChange={e => setReceived(e.target.value)} autoFocus placeholder={String(Math.ceil(total))} className="mt-1.5 h-12 rounded-xl border-slate-200 bg-slate-50 text-lg font-bold" /></div>
              <div className="flex flex-wrap gap-2">{quick.map(v => <button key={v} onClick={() => setReceived(String(v))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{v === Math.ceil(total) ? "Exact" : money(v)}</button>)}</div>
              <div className="flex justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm"><span className="font-medium text-emerald-800">Change due</span><span className="text-lg font-extrabold tabular-nums text-emerald-700">{money(change)}</span></div>
            </div>
          )}
          {method === "credit" && (
            <div className="space-y-3">
              {!customer ? (
                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <p className="text-sm font-semibold text-amber-900">Choose who this credit is for</p>
                  <Select onValueChange={v => setCustomerId(Number(v))}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-amber-200 bg-white text-sm"><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent className="max-h-64 border-slate-200 bg-white text-slate-900">{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}{Number(c.balance) > 0 ? ` · owes ${money(Number(c.balance))}` : ""}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="text-xs text-amber-800/80">Udhaar needs a customer so the amount is added to their account.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <div><p className="font-semibold">{customer.name}</p><p className="text-xs text-slate-500">{owed > 0 ? `Already owes ${money(owed)}` : "No outstanding balance"}{creditLimit !== null ? ` · limit ${money(creditLimit)}` : ""}</p></div>
                    <button onClick={() => setCustomerId(null)} className="text-xs font-semibold text-teal-700 hover:underline">Change</button>
                  </div>
                  <div><label className="text-xs font-semibold text-slate-600">Pay now (optional, cash)</label>
                    <Input type="number" inputMode="decimal" min="0" value={payNow} onChange={e => setPayNow(e.target.value)} placeholder="0" className="mt-1.5 h-12 rounded-xl border-slate-200 bg-slate-50 text-lg font-bold" /></div>
                  <div className="space-y-1.5 rounded-xl bg-rose-50 px-4 py-3 text-sm">
                    <div className="flex justify-between"><span className="text-rose-800">Goes on credit</span><span className="font-extrabold tabular-nums text-rose-700">{money(creditAmt)}</span></div>
                    <div className="flex justify-between text-xs text-rose-800/80"><span>New balance owed</span><span className="font-bold tabular-nums">{money(owed + creditAmt)}</span></div>
                  </div>
                  {overLimit && <p className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">This goes over {customer.name}'s credit limit of {money(creditLimit!)}. Take part payment now or raise the limit.</p>}
                </>
              )}
            </div>
          )}
          <Button onClick={() => checkout.mutate({ items: cart.map(l => ({ productId: l.product.id, quantity: l.quantity })), discount: Math.round(discount * 100) / 100, paymentMethod: method, amountReceived: method === "cash" ? receivedNum : method === "credit" ? Math.round(payNowNum * 100) / 100 : Math.round(total * 100) / 100, customerId, clientRequestId: requestId.current })} disabled={!canPay || checkout.isPending} className="h-12 w-full rounded-xl bg-slate-900 text-base font-bold text-white hover:bg-slate-700">
            {checkout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}{checkout.isPending ? "Processing…" : method === "credit" ? `Put ${money(creditAmt)} on credit` : `Confirm ${money(total)}`}
          </Button>
        </DialogContent>
      </Dialog>

      {/* receipt */}
      <Dialog open={!!receipt} onOpenChange={o => !o && setReceipt(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-sm rounded-2xl border-slate-200 bg-white p-6 text-slate-900">
          <div className="flex flex-col items-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"><Check className="h-7 w-7 text-emerald-600" /></span><DialogTitle className="mt-3 text-xl font-bold">Payment complete</DialogTitle><p className="mt-1 font-mono text-xs text-slate-500">{receipt?.data.saleNumber}</p></div>
          {receipt && <dl className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Total</dt><dd className="font-extrabold tabular-nums">{money(receipt.data.total)}</dd></div>
            {receipt.data.credit && <div className="flex justify-between"><dt className="text-slate-500">On credit (udhaar)</dt><dd className="font-bold tabular-nums text-rose-600">{money(receipt.data.credit.amount)}</dd></div>}
            {receipt.data.credit?.balance != null && <div className="flex justify-between"><dt className="text-slate-500">Total balance owed</dt><dd className="font-bold tabular-nums">{money(receipt.data.credit.balance)}</dd></div>}
            {Number(receipt.data.change) > 0 && <div className="flex justify-between"><dt className="text-slate-500">Change</dt><dd className="font-bold tabular-nums text-emerald-600">{money(receipt.data.change!)}</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-500">Paid by</dt><dd className="font-semibold capitalize">{receipt.data.paymentMethod}</dd></div>
          </dl>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => receipt && (printReceipt(receipt.data) || toast.error("Allow pop-ups to print receipts."))} className="h-11 rounded-xl border-slate-200"><Printer className="mr-2 h-4 w-4" />Print</Button>
            <Button variant="outline" onClick={() => receipt && window.open(whatsappLink(receipt.phone, receiptText(receipt.data)), "_blank")} className="h-11 rounded-xl border-slate-200 text-emerald-700 hover:bg-emerald-50"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</Button>
          </div>
          <Button onClick={() => { setReceipt(null); searchRef.current?.focus(); }} className="h-11 w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-700">New sale</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
