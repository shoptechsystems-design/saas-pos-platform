import { IonIcon } from "@ionic/react";
import { addOutline, callOutline, downloadOutline, mailOutline, peopleOutline, pricetagsOutline, trashOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { Async, Empty, Field, Pill, Row, Screen, SearchBox, Seg, Sheet, Card, useNotify } from "~/components/ui";
import { dateOnly, initials, money } from "~/lib/format";
import { savePdf, tap } from "~/lib/native";
import { useCustomers, useGroups, useAct } from "~/lib/queries";
import { api, qs } from "~/lib/rest";
import { useSession } from "~/lib/session";
import type { Customer, CustomerGroup, PdfResult } from "~/lib/types";

const dayStart = (v: string) => (v ? new Date(`${v}T00:00:00`).getTime() : undefined);
const dayEnd = (v: string) => (v ? new Date(`${v}T23:59:59`).getTime() : undefined);

function AddCustomer({ open, onClose, groups }: { open: boolean; onClose: () => void; groups: CustomerGroup[] }) {
  const n = useNotify();
  const [f, setF] = useState({ name: "", email: "", phone: "", groupId: "" });
  const [err, setErr] = useState("");
  const create = useAct((b: object) => api.post("/customers", b), ["customers"]);
  const submit = async () => {
    if (f.name.trim().length < 2) return setErr("Enter the customer's name.");
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setErr("Enter a valid email or leave it empty.");
    setErr("");
    try {
      await create.mutateAsync({ name: f.name.trim(), email: f.email.trim() || null, phone: f.phone.trim() || null, groupId: f.groupId ? Number(f.groupId) : null });
      n.ok("Customer added"); setF({ name: "", email: "", phone: "", groupId: "" }); onClose();
    } catch (e) { n.fail(e); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="New customer">
      <Field label="Name" error={err}><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Full name" autoComplete="off" /></Field>
      <Field label="Phone"><input className="input" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} inputMode="tel" placeholder="03xx xxxxxxx" /></Field>
      <Field label="Email (optional)"><input className="input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} inputMode="email" autoCapitalize="none" placeholder="name@email.com" /></Field>
      {groups.length > 0 && <Field label="Group (optional)"><select className="select" value={f.groupId} onChange={e => setF({ ...f, groupId: e.target.value })}><option value="">No group</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name} ({Number(g.discountPercent)}% off)</option>)}</select></Field>}
      <button className="btn btn-primary btn-block" disabled={create.isPending} onClick={submit}>{create.isPending ? "Saving…" : "Add customer"}</button>
    </Sheet>
  );
}

function CustomerDetail({ c, onClose, groups, currency }: { c: Customer | null; onClose: () => void; groups: CustomerGroup[]; currency?: string }) {
  const n = useNotify();
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { setFrom(""); setTo(""); }, [c?.id]);
  const download = async () => {
    if (!c) return;
    setBusy(true);
    try { await savePdf(await api.get<PdfResult>(`/customers/${c.id}/statement${qs({ from: dayStart(from), to: dayEnd(to) })}`)); }
    catch (e) { n.fail(e); } finally { setBusy(false); }
  };
  const group = groups.find(g => g.id === c?.groupId);
  return (
    <Sheet open={!!c} onClose={onClose} title={c?.name ?? ""}>
      {c && <>
        <div className="row"><div className="avatar round" style={{ width: 52, height: 52, fontSize: 16 }}>{initials(c.name)}</div>
          <div className="grow stack" style={{ gap: 2 }}>{group ? <Pill tone="teal">{group.name} · {Number(group.discountPercent)}% off</Pill> : <Pill>No group</Pill>}</div></div>
        <div className="kpis">
          <div className="card kpi"><div className="l">Total spent</div><div className="v">{money(c.totalSpent, currency)}</div></div>
          <div className="card kpi"><div className="l">Orders</div><div className="v">{c.orderCount}</div></div>
        </div>
        <Card pad={false} className="divide">
          <Row icon={callOutline} title={c.phone || "No phone"} sub="Phone" />
          <Row icon={mailOutline} tone="blue" title={c.email || "No email"} sub="Email" />
          <Row icon={peopleOutline} tone="navy" title={c.lastPurchaseAt ? dateOnly(c.lastPurchaseAt) : "No purchases yet"} sub="Last purchase" />
        </Card>
        <div className="section-title">Statement PDF</div>
        <div className="grid2">
          <Field label="From"><input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} /></Field>
          <Field label="To"><input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} /></Field>
        </div>
        <button className="btn btn-dark btn-block" disabled={busy} onClick={download}><IonIcon icon={downloadOutline} />{busy ? "Preparing…" : "Download statement"}</button>
        <p className="tiny muted center" style={{ margin: 0 }}>Leave the dates empty for the full history.</p>
      </>}
    </Sheet>
  );
}

function Groups({ groups, isAdmin }: { groups: ReturnType<typeof useGroups>; isAdmin: boolean }) {
  const n = useNotify();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [pct, setPct] = useState("0"); const [err, setErr] = useState("");
  const create = useAct((b: object) => api.post("/customer-groups", b), ["groups"]);
  const del = useAct((id: number) => api.delete(`/customer-groups/${id}`), ["groups", "customers"]);
  const submit = async () => {
    const p = Number(pct);
    if (name.trim().length < 2) return setErr("Enter a group name.");
    if (!Number.isFinite(p) || p < 0 || p > 100) return setErr("Discount must be between 0 and 100.");
    setErr("");
    try { await create.mutateAsync({ name: name.trim(), discountPercent: p }); n.ok("Group created"); setName(""); setPct("0"); setOpen(false); } catch (e) { n.fail(e); }
  };
  return (
    <>
      {isAdmin && <button className="btn btn-primary btn-block" onClick={() => setOpen(true)}><IonIcon icon={addOutline} />New group</button>}
      <Async q={groups} empty={d => d.length ? null : <Empty icon={pricetagsOutline} title="No customer groups" hint="Groups like Wholesale or VIP carry a standard discount." />}>
        {d => <Card pad={false} className="divide">{d.map(g => (
          <Row key={g.id} icon={pricetagsOutline} title={g.name} sub={`${Number(g.discountPercent)}% discount`}
            right={isAdmin ? <button className="icon-btn" aria-label={`Delete ${g.name}`} onClick={() => n.confirm("Delete group?", `"${g.name}" will be removed. Customers keep their records.`, "Delete", async () => { try { await del.mutateAsync(g.id); n.ok("Group deleted"); } catch (e) { n.fail(e); } }, true)}><IonIcon icon={trashOutline} /></button> : undefined} />
        ))}</Card>}
      </Async>
      <Sheet open={open} onClose={() => setOpen(false)} title="New customer group">
        <Field label="Group name" error={err}><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wholesale" /></Field>
        <Field label="Discount %"><input className="input" value={pct} onChange={e => setPct(e.target.value)} inputMode="decimal" /></Field>
        <button className="btn btn-primary btn-block" disabled={create.isPending} onClick={submit}>{create.isPending ? "Saving…" : "Create group"}</button>
      </Sheet>
    </>
  );
}

export default function Customers() {
  const s = useSession();
  const [tab, setTab] = useState<"customers" | "groups">("customers");
  const [search, setSearch] = useState(""); const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false); const [selected, setSelected] = useState<Customer | null>(null);
  useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 300); return () => clearTimeout(t); }, [search]);
  const customers = useCustomers(q || undefined);
  const groups = useGroups();
  const canAdd = s.can.sell;
  return (
    <Screen title="Customers" back="/more" onRefresh={() => Promise.all([customers.refetch(), groups.refetch()])}
      right={canAdd && tab === "customers" ? <button className="icon-btn" aria-label="Add customer" onClick={() => { tap(); setAdding(true); }}><IonIcon icon={addOutline} /></button> : undefined}>
      <Seg value={tab} onChange={setTab} options={[{ value: "customers", label: "Customers" }, { value: "groups", label: "Groups" }]} />
      {tab === "groups" ? <Groups groups={groups} isAdmin={s.can.admin} /> : <>
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, phone or email" />
        <Async q={customers} empty={d => d.length ? null : <Empty icon={peopleOutline} title={q ? "No matches" : "No customers yet"} hint={q ? "Try a different name or phone number." : "Add customers to track their purchases and print statements."} action={canAdd && !q ? <button className="btn btn-primary" onClick={() => setAdding(true)}>Add customer</button> : undefined} />}>
          {d => <Card pad={false} className="divide">{d.map(c => (
            <Row key={c.id} onClick={() => setSelected(c)} title={c.name} sub={`${c.phone || "No phone"} · ${c.orderCount} order${c.orderCount === 1 ? "" : "s"}`}
              right={<div className="right"><div className="bold mono small">{money(c.totalSpent, s.tenant?.currency)}</div></div>} icon={undefined} />
          ))}</Card>}
        </Async>
      </>}
      <AddCustomer open={adding} onClose={() => setAdding(false)} groups={groups.data ?? []} />
      <CustomerDetail c={selected} onClose={() => setSelected(null)} groups={groups.data ?? []} currency={s.tenant?.currency} />
    </Screen>
  );
}
