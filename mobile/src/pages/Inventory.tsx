import { IonIcon } from "@ionic/react";
import { add, cameraOutline, createOutline, cubeOutline, removeOutline, swapVerticalOutline, trashOutline, warningOutline } from "ionicons/icons";
import { useRef, useState } from "react";
import { Async, Card, Empty, Field, Loading, Pill, Screen, SearchBox, Sheet, useNotify } from "~/components/ui";
import { dateTime, money, num } from "~/lib/format";
import { useAct, useCategories, useList, useProducts } from "~/lib/queries";
import { api } from "~/lib/rest";
import { useSession } from "~/lib/session";
import type { Movement, Product, Variant } from "~/lib/types";

const ROOTS = ["products", "inventory", "lowStock", "stats", "movements"];
const stockState = (p: Product) => (p.stockQuantity <= 0 ? { tone: "bad" as const, label: "Out of stock" } : p.stockQuantity <= p.minStockLevel ? { tone: "warn" as const, label: "Low stock" } : { tone: "ok" as const, label: "In stock" });
const digits = (v: string) => v.replace(/\D/g, "");
const decimal = (v: string) => v.replace(/[^\d.]/g, "");

// ---------------- product form (create + edit) ----------------
function ProductForm({ product, currency, onClose }: { product: Product | null; currency: string; onClose: () => void }) {
  const n = useNotify();
  const cats = useCategories();
  const edit = Boolean(product);
  const [f, setF] = useState({
    name: product?.name ?? "", sku: product?.sku ?? "", barcode: product?.barcode ?? "", categoryId: product?.categoryId ? String(product.categoryId) : "",
    costPrice: product ? String(num(product.costPrice)) : "", sellingPrice: product ? String(num(product.sellingPrice)) : "",
    discountPrice: product?.discountPrice ? String(num(product.discountPrice)) : "", taxRate: product?.taxRate ? String(num(product.taxRate)) : "",
    stockQuantity: product ? String(product.stockQuantity) : "0", minStockLevel: product ? String(product.minStockLevel) : "5", unit: product?.unit ?? "each",
    imageUrl: product?.imageUrl ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f) => (v: string) => { setF(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };
  const save = useAct((b: object) => (product ? api.put(`/products/${product.id}`, b) : api.post("/products", b)), ROOTS);

  const upload = async (picked?: File) => {
    if (!picked) return;
    if (!picked.type.startsWith("image/")) return n.fail(new Error("Choose an image file."));
    if (picked.size > 5 * 1024 * 1024) return n.fail(new Error("Image must be under 5 MB."));
    setUploading(true);
    try {
      const base64Data = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("Could not read the image.")); r.readAsDataURL(picked); });
      const r = await api.post<{ url: string }>("/products/image", { filename: picked.name, base64Data, contentType: picked.type });
      set("imageUrl")(r.url);
    } catch (e) { n.fail(e); } finally { setUploading(false); if (file.current) file.current.value = ""; }
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Enter a product name.";
    if (edit && !f.sku.trim()) e.sku = "SKU is required.";
    if (f.sellingPrice.trim() === "" || num(f.sellingPrice) < 0) e.sellingPrice = "Enter a selling price.";
    if (f.stockQuantity.trim() === "") e.stockQuantity = "Enter the stock quantity.";
    if (!edit && f.taxRate && num(f.taxRate) > 100) e.taxRate = "Tax can't exceed 100%.";
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      if (product) {
        await save.mutateAsync({ name: f.name.trim(), sku: f.sku.trim(), sellingPrice: num(f.sellingPrice), stockQuantity: Math.trunc(num(f.stockQuantity)), categoryId: f.categoryId ? Number(f.categoryId) : null, imageUrl: f.imageUrl || null });
      } else {
        await save.mutateAsync({
          name: f.name.trim(), sku: f.sku.trim() || undefined, barcode: f.barcode.trim() || null, categoryId: f.categoryId ? Number(f.categoryId) : null,
          costPrice: num(f.costPrice), sellingPrice: num(f.sellingPrice), discountPrice: f.discountPrice ? num(f.discountPrice) : null, taxRate: f.taxRate ? num(f.taxRate) : null,
          stockQuantity: Math.trunc(num(f.stockQuantity)), minStockLevel: Math.trunc(num(f.minStockLevel)), unit: f.unit.trim() || "each", imageUrl: f.imageUrl || null,
        });
      }
      n.ok(edit ? "Product updated" : "Product added"); onClose();
    } catch (err) { n.fail(err); }
  };

  return (
    <>
      <div className="row" style={{ gap: 14 }}>
        <div className="avatar" style={{ width: 72, height: 72, borderRadius: 18, overflow: "hidden", fontSize: 26 }}>
          {f.imageUrl ? <img src={f.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IonIcon icon={cubeOutline} />}
        </div>
        <div className="stack grow" style={{ gap: 6 }}>
          <button className="btn btn-sm" disabled={uploading} onClick={() => file.current?.click()}><IonIcon icon={cameraOutline} /> {uploading ? "Uploading…" : f.imageUrl ? "Change photo" : "Add photo"}</button>
          {f.imageUrl && <button className="btn btn-sm btn-ghost" onClick={() => set("imageUrl")("")}>Remove photo</button>}
        </div>
        <input ref={file} type="file" accept="image/*" hidden onChange={e => upload(e.target.files?.[0])} />
      </div>
      <Field label="Product name" error={errors.name}><input className="input" value={f.name} onChange={e => set("name")(e.target.value)} maxLength={180} placeholder="e.g. Basmati Rice 5kg" /></Field>
      <div className="grid2">
        <Field label={edit ? "SKU" : "SKU (auto if empty)"} error={errors.sku}><input className="input" value={f.sku} onChange={e => set("sku")(e.target.value)} autoCapitalize="characters" maxLength={80} /></Field>
        {!edit && <Field label="Barcode"><input className="input" value={f.barcode} onChange={e => set("barcode")(e.target.value)} inputMode="numeric" maxLength={80} placeholder="Scan or type" /></Field>}
      </div>
      <Field label="Category">
        <select className="select" value={f.categoryId} onChange={e => set("categoryId")(e.target.value)}>
          <option value="">Uncategorised</option>
          {(cats.data ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div className="grid2">
        {!edit && <Field label={`Cost price (${currency})`}><input className="input" inputMode="decimal" value={f.costPrice} onChange={e => set("costPrice")(decimal(e.target.value))} placeholder="0.00" /></Field>}
        <Field label={`Selling price (${currency})`} error={errors.sellingPrice}><input className="input" inputMode="decimal" value={f.sellingPrice} onChange={e => set("sellingPrice")(decimal(e.target.value))} placeholder="0.00" /></Field>
        {!edit && <Field label="Discount price" hint="Used at the till if set."><input className="input" inputMode="decimal" value={f.discountPrice} onChange={e => set("discountPrice")(decimal(e.target.value))} placeholder="optional" /></Field>}
        {!edit && <Field label="Tax rate %" error={errors.taxRate}><input className="input" inputMode="decimal" value={f.taxRate} onChange={e => set("taxRate")(decimal(e.target.value))} placeholder="optional" /></Field>}
        <Field label={edit ? "Stock quantity" : "Opening stock"} error={errors.stockQuantity}><input className="input" inputMode="numeric" value={f.stockQuantity} onChange={e => set("stockQuantity")(digits(e.target.value))} /></Field>
        {!edit && <Field label="Low-stock alert at"><input className="input" inputMode="numeric" value={f.minStockLevel} onChange={e => set("minStockLevel")(digits(e.target.value))} /></Field>}
        {!edit && <Field label="Unit"><input className="input" value={f.unit} onChange={e => set("unit")(e.target.value)} maxLength={32} placeholder="each, kg, box…" /></Field>}
      </div>
      {edit && <p className="hint" style={{ margin: 0 }}>Cost, tax, barcode and alert level are set when a product is created. Use stock adjustments to track changes properly.</p>}
      <button className="btn btn-primary btn-block" disabled={save.isPending || uploading} onClick={submit}>{save.isPending ? "Saving…" : edit ? "Save changes" : "Add product"}</button>
    </>
  );
}

// ---------------- product detail ----------------
function Detail({ product, currency, canEdit, canHistory, onEdit, onClose }: { product: Product; currency: string; canEdit: boolean; canHistory: boolean; onEdit: () => void; onClose: () => void }) {
  const n = useNotify();
  const st = stockState(product);
  const [adjOpen, setAdjOpen] = useState(false);
  const [delta, setDelta] = useState("");
  const [sign, setSign] = useState<1 | -1>(1);
  const [reason, setReason] = useState("");
  const [vOpen, setVOpen] = useState(false);
  const [v, setV] = useState({ name: "", sku: "", additionalPrice: "", stockQuantity: "" });
  const variants = useList<Variant[]>(["variants", product.id], `/products/${product.id}/variants`);
  const moves = useList<Movement[]>(["movements", product.id], `/inventory/movements?productId=${product.id}`, canHistory);
  const adjust = useAct((b: object) => api.post("/inventory/adjust", b), ROOTS);
  const del = useAct(() => api.delete(`/products/${product.id}`), ROOTS);
  const addVar = useAct((b: object) => api.post(`/products/${product.id}/variants`, b), ["variants"]);
  const delVar = useAct((id: number) => api.delete(`/variants/${id}`), ["variants"]);

  const doAdjust = async () => {
    const qty = Math.trunc(num(delta));
    if (!qty) return n.fail(new Error("Enter how many units to add or remove."));
    if (reason.trim().length < 2) return n.fail(new Error("Add a short reason (at least 2 characters)."));
    if (sign * qty + product.stockQuantity < 0) return n.fail(new Error("Stock can't go below zero."));
    try { await adjust.mutateAsync({ productId: product.id, quantity: sign * qty, reason: reason.trim() }); n.ok("Stock updated"); setDelta(""); setReason(""); setAdjOpen(false); } catch (e) { n.fail(e); }
  };
  const doAddVariant = async () => {
    if (!v.name.trim() || !v.sku.trim()) return n.fail(new Error("Variant name and SKU are required."));
    try { await addVar.mutateAsync({ name: v.name.trim(), sku: v.sku.trim(), additionalPrice: num(v.additionalPrice), stockQuantity: Math.trunc(num(v.stockQuantity)) }); n.ok("Variant added"); setV({ name: "", sku: "", additionalPrice: "", stockQuantity: "" }); setVOpen(false); } catch (e) { n.fail(e); }
  };
  const doDelete = () => n.confirm("Delete product?", `"${product.name}" will be permanently removed.`, "Delete", async () => { try { await del.mutateAsync(undefined); n.ok("Product deleted"); onClose(); } catch (e) { n.fail(e); } }, true);

  return (
    <>
      <div className="row" style={{ gap: 14 }}>
        <div className="avatar" style={{ width: 72, height: 72, borderRadius: 18, overflow: "hidden", fontSize: 26 }}>{product.imageUrl ? <img src={product.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IonIcon icon={cubeOutline} />}</div>
        <div className="grow"><div className="h2">{product.name}</div><div className="small muted">SKU {product.sku}{product.barcode ? ` · ${product.barcode}` : ""}</div><div style={{ marginTop: 6 }}><Pill tone={st.tone}>{st.label}</Pill></div></div>
      </div>
      <div className="grid2">
        <div className="card kpi"><div className="l">Selling price</div><div className="v">{money(product.discountPrice ?? product.sellingPrice, currency)}</div>{product.discountPrice && <div className="tiny muted" style={{ textDecoration: "line-through" }}>{money(product.sellingPrice, currency)}</div>}</div>
        <div className="card kpi"><div className="l">In stock</div><div className="v" style={{ color: `var(--c-${st.tone === "ok" ? "navy" : st.tone === "warn" ? "amber" : "red"})` }}>{product.stockQuantity} <span className="small muted">{product.unit}</span></div><div className="tiny muted">Alert at {product.minStockLevel}</div></div>
        {canEdit && <div className="card kpi"><div className="l">Cost price</div><div className="v">{money(product.costPrice, currency)}</div></div>}
        {canEdit && <div className="card kpi"><div className="l">Margin</div><div className="v">{num(product.sellingPrice) > 0 ? `${Math.round(((num(product.sellingPrice) - num(product.costPrice)) / num(product.sellingPrice)) * 100)}%` : "—"}</div></div>}
      </div>

      {canEdit && (
        <>
          <div className="grid2">
            <button className="btn" onClick={() => setAdjOpen(o => !o)}><IonIcon icon={swapVerticalOutline} /> Adjust stock</button>
            <button className="btn" onClick={onEdit}><IonIcon icon={createOutline} /> Edit</button>
          </div>
          {adjOpen && (
            <Card className="stack">
              <div className="seg"><button className={sign === 1 ? "on" : ""} onClick={() => setSign(1)}>Add stock</button><button className={sign === -1 ? "on" : ""} onClick={() => setSign(-1)}>Remove stock</button></div>
              <div className="grid2">
                <Field label="Units"><input className="input" inputMode="numeric" value={delta} onChange={e => setDelta(digits(e.target.value))} placeholder="0" /></Field>
                <Field label="New total"><input className="input" readOnly value={String(product.stockQuantity + sign * Math.trunc(num(delta)))} /></Field>
              </div>
              <Field label="Reason"><input className="input" value={reason} onChange={e => setReason(e.target.value)} maxLength={220} placeholder="e.g. Damaged, recount, new delivery" /></Field>
              <button className="btn btn-primary" disabled={adjust.isPending} onClick={doAdjust}>{adjust.isPending ? "Saving…" : "Apply adjustment"}</button>
            </Card>
          )}
        </>
      )}

      <div className="row between"><span className="section-title" style={{ margin: 0 }}>Variants</span>{canEdit && <button className="btn btn-sm btn-ghost" onClick={() => setVOpen(o => !o)}><IonIcon icon={add} /> Add</button>}</div>
      {vOpen && (
        <Card className="stack">
          <div className="grid2"><Field label="Name"><input className="input" value={v.name} onChange={e => setV({ ...v, name: e.target.value })} placeholder="Red / Large" /></Field><Field label="SKU"><input className="input" value={v.sku} onChange={e => setV({ ...v, sku: e.target.value })} autoCapitalize="characters" /></Field>
            <Field label="Extra price"><input className="input" inputMode="decimal" value={v.additionalPrice} onChange={e => setV({ ...v, additionalPrice: decimal(e.target.value) })} placeholder="0.00" /></Field><Field label="Stock"><input className="input" inputMode="numeric" value={v.stockQuantity} onChange={e => setV({ ...v, stockQuantity: digits(e.target.value) })} placeholder="0" /></Field></div>
          <button className="btn btn-primary" disabled={addVar.isPending} onClick={doAddVariant}>{addVar.isPending ? "Saving…" : "Add variant"}</button>
        </Card>
      )}
      <Async q={variants} empty={rows => (rows.length === 0 ? <div className="banner info">No variants for this product.</div> : null)}>
        {rows => <Card pad={false}><div className="divide">{rows.map(x => (
          <div className="list-row" key={x.id}><div className="grow"><div className="bold" style={{ color: "var(--c-navy)" }}>{x.name}</div><div className="small muted">{x.sku} · {x.stockQuantity} in stock</div></div>
            <span className="small mono">{num(x.additionalPrice) ? `+${money(x.additionalPrice, currency)}` : "—"}</span>
            {canEdit && <button className="icon-btn" aria-label="Delete variant" style={{ color: "var(--c-red)" }} onClick={() => n.confirm("Delete variant?", x.name, "Delete", async () => { try { await delVar.mutateAsync(x.id); n.ok("Variant deleted"); } catch (e) { n.fail(e); } }, true)}><IonIcon icon={removeOutline} /></button>}
          </div>))}</div></Card>}
      </Async>

      {canHistory && (
        <>
          <span className="section-title" style={{ margin: 0 }}>Stock history</span>
          <Async q={moves} empty={rows => (rows.length === 0 ? <div className="banner info">No stock movements yet.</div> : null)}>
            {rows => <Card pad={false}><div className="divide">{rows.slice(0, 20).map(m => (
              <div className="list-row" key={m.id}><div className="grow"><div className="bold" style={{ textTransform: "capitalize", color: "var(--c-navy)" }}>{m.type.replace(/_/g, " ")}</div><div className="small muted ellipsis">{m.reason ?? "—"} · {dateTime(m.createdAt)}</div></div>
                <b className="mono" style={{ color: m.quantity < 0 ? "var(--c-red)" : "var(--c-green)" }}>{m.quantity > 0 ? "+" : ""}{m.quantity}</b></div>))}</div></Card>}
          </Async>
        </>
      )}
      {canEdit && <button className="btn btn-danger btn-block" disabled={del.isPending} onClick={doDelete}><IonIcon icon={trashOutline} /> Delete product</button>}
    </>
  );
}

// ---------------- screen ----------------
export default function Inventory() {
  const { can, tenant } = useSession();
  const currency = tenant?.currency ?? "PKR";
  const n = useNotify();
  void n;
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState<number | undefined>();
  const [lowOnly, setLowOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<Product | "new" | null>(null);
  const cats = useCategories();
  const q = useProducts(term.trim() || undefined, cat);
  const selected = q.data?.find(p => p.id === selectedId) ?? null;
  const catName = (id: number | null) => cats.data?.find(c => c.id === id);
  const rows = (q.data ?? []).filter(p => !lowOnly || p.stockQuantity <= p.minStockLevel);
  const lowCount = (q.data ?? []).filter(p => p.stockQuantity <= p.minStockLevel).length;

  return (
    <Screen title="Inventory" onRefresh={() => q.refetch()} right={can.catalog ? <button className="icon-btn" aria-label="Add product" onClick={() => setForm("new")}><IonIcon icon={add} /></button> : undefined}>
      <SearchBox value={term} onChange={setTerm} placeholder="Search name, SKU or barcode" />
      <div className="chips">
        <button className={`chip ${!cat && !lowOnly ? "on" : ""}`} onClick={() => { setCat(undefined); setLowOnly(false); }}>All</button>
        <button className={`chip ${lowOnly ? "on" : ""}`} onClick={() => setLowOnly(o => !o)}>Low stock{lowCount ? ` (${lowCount})` : ""}</button>
        {(cats.data ?? []).map(c => <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} onClick={() => setCat(cat === c.id ? undefined : c.id)}>{c.name}</button>)}
      </div>
      {q.isError && q.data && <div className="banner warn"><IonIcon icon={warningOutline} />Showing saved data. Pull down to refresh when you're online.</div>}
      <Async q={q} empty={() => rows.length === 0 ? <Empty icon={cubeOutline} title={term || cat || lowOnly ? "No matching products" : "No products yet"} hint={can.catalog && !term && !cat && !lowOnly ? "Add your first product to start selling." : "Try a different search or filter."} action={can.catalog && !term && !cat && !lowOnly ? <button className="btn btn-primary" onClick={() => setForm("new")}>Add product</button> : undefined} /> : null}>
        {() => (
          <Card pad={false}><div className="divide">
            {rows.map(p => { const st = stockState(p); const c = catName(p.categoryId); return (
              <button className="list-row" key={p.id} onClick={() => setSelectedId(p.id)}>
                <div className="avatar" style={{ overflow: "hidden" }}>{p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IonIcon icon={cubeOutline} />}</div>
                <div className="grow">
                  <div className="bold ellipsis" style={{ color: "var(--c-navy)" }}>{p.name}</div>
                  <div className="small muted ellipsis">{p.sku}{c ? ` · ${c.name}` : ""}</div>
                </div>
                <div className="right"><div className="bold mono">{money(p.discountPrice ?? p.sellingPrice, currency)}</div><Pill tone={st.tone}>{p.stockQuantity} {p.unit}</Pill></div>
              </button>); })}
          </div></Card>
        )}
      </Async>
      {q.isFetching && q.data && <Loading />}

      <Sheet open={selected !== null && form === null} onClose={() => setSelectedId(null)} title="Product">
        {selected && <Detail product={selected} currency={currency} canEdit={can.catalog} canHistory={can.catalog} onEdit={() => setForm(selected)} onClose={() => setSelectedId(null)} />}
      </Sheet>
      <Sheet open={form !== null} onClose={() => setForm(null)} title={form && form !== "new" ? "Edit product" : "New product"}>
        {form !== null && <ProductForm product={form === "new" ? null : form} currency={currency} onClose={() => setForm(null)} />}
      </Sheet>
    </Screen>
  );
}
