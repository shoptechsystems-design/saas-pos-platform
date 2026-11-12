import { IonIcon } from "@ionic/react";
import { add, callOutline, mailOutline, storefrontOutline } from "ionicons/icons";
import { useState } from "react";
import { Async, Card, Empty, Field, Row, Screen, SearchBox, Sheet, useNotify } from "~/components/ui";
import { initials } from "~/lib/format";
import { useAct, useList } from "~/lib/queries";
import { api } from "~/lib/rest";
import type { Supplier } from "~/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SupplierForm({ onClose }: { onClose: () => void }) {
  const n = useNotify();
  const [f, setF] = useState({ name: "", email: "", phone: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAct((b: object) => api.post("/suppliers", b), ["suppliers"]);
  const set = (k: keyof typeof f) => (v: string) => { setF(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };
  const submit = async () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Enter the supplier's name.";
    if (f.email.trim() && !EMAIL.test(f.email.trim())) e.email = "Enter a valid email address.";
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await save.mutateAsync({ name: f.name.trim(), email: f.email.trim() || null, phone: f.phone.trim() || null, notes: f.notes.trim() || null });
      n.ok("Supplier added"); onClose();
    } catch (err) { n.fail(err); }
  };
  return (
    <>
      <Field label="Name" error={errors.name}><input className="input" value={f.name} onChange={e => set("name")(e.target.value)} placeholder="Supplier or company" autoFocus /></Field>
      <div className="grid2">
        <Field label="Phone"><input className="input" value={f.phone} onChange={e => set("phone")(e.target.value)} inputMode="tel" placeholder="03xx xxxxxxx" /></Field>
        <Field label="Email" error={errors.email}><input className="input" value={f.email} onChange={e => set("email")(e.target.value)} inputMode="email" autoCapitalize="none" placeholder="optional" /></Field>
      </div>
      <Field label="Notes"><textarea className="textarea" value={f.notes} maxLength={500} onChange={e => set("notes")(e.target.value)} placeholder="Payment terms, delivery days…" /></Field>
      <button className="btn btn-primary btn-block" disabled={save.isPending} onClick={submit}>{save.isPending ? "Saving…" : "Add supplier"}</button>
    </>
  );
}

export default function Suppliers() {
  const q = useList<Supplier[]>(["suppliers"], "/suppliers");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Supplier | null>(null);
  const filter = (rows: Supplier[]) => rows.filter(s => !search.trim() || [s.name, s.email, s.phone].some(v => v?.toLowerCase().includes(search.trim().toLowerCase())));

  return (
    <Screen title="Suppliers" subtitle="Vendors you buy from" back="/more" onRefresh={() => q.refetch()} right={<button className="icon-btn" aria-label="Add supplier" onClick={() => setOpen(true)}><IonIcon icon={add} /></button>}>
      <SearchBox value={search} onChange={setSearch} placeholder="Search suppliers" />
      <Async q={q} empty={rows => rows.length === 0 ? <Empty icon={storefrontOutline} title="No suppliers yet" hint="Add the people you buy stock from, then raise purchase orders against them." action={<button className="btn btn-primary" onClick={() => setOpen(true)}>Add supplier</button>} /> : filter(rows).length === 0 ? <Empty icon={storefrontOutline} title="No matches" hint="Try a different name, phone or email." /> : null}>
        {rows => (
          <Card pad={false}>
            <div className="divide">
              {filter(rows).map(s => (
                <button className="list-row" key={s.id} onClick={() => setView(s)}>
                  <div className="avatar">{initials(s.name)}</div>
                  <div className="grow"><div className="bold ellipsis" style={{ color: "var(--c-navy)" }}>{s.name}</div><div className="small muted ellipsis">{[s.phone, s.email].filter(Boolean).join(" · ") || "No contact details"}</div></div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </Async>

      <Sheet open={open} onClose={() => setOpen(false)} title="New supplier">{open && <SupplierForm onClose={() => setOpen(false)} />}</Sheet>
      <Sheet open={view !== null} onClose={() => setView(null)} title={view?.name ?? ""}>
        {view && (
          <Card pad={false}><div className="divide">
            <Row icon={callOutline} tone="blue" title={view.phone ?? "—"} sub="Phone" />
            <Row icon={mailOutline} tone="amber" title={view.email ?? "—"} sub="Email" />
            <Row icon={storefrontOutline} title={view.notes || "—"} sub="Notes" />
          </div></Card>
        )}
      </Sheet>
    </Screen>
  );
}
