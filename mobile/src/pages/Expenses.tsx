import { IonIcon } from "@ionic/react";
import { addOutline, walletOutline } from "ionicons/icons";
import { useMemo, useState } from "react";
import { Async, Card, Empty, Field, Row, Screen, Sheet, useNotify } from "~/components/ui";
import { dateOnly, money, num } from "~/lib/format";
import { tap } from "~/lib/native";
import { useAct, useList } from "~/lib/queries";
import { api } from "~/lib/rest";
import { useSession } from "~/lib/session";
import type { Expense } from "~/lib/types";

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Transport", "Supplies", "Maintenance", "Marketing", "Other"];
const today = () => new Date().toISOString().slice(0, 10);

function AddExpense({ open, onClose }: { open: boolean; onClose: () => void }) {
  const n = useNotify();
  const [f, setF] = useState({ category: "", amount: "", notes: "", date: today() });
  const [err, setErr] = useState("");
  const create = useAct((b: object) => api.post("/expenses", b), ["expenses"]);
  const submit = async () => {
    const amount = Number(f.amount);
    if (f.category.trim().length < 2) return setErr("Choose or type a category.");
    if (!Number.isFinite(amount) || amount <= 0) return setErr("Enter an amount greater than zero.");
    setErr("");
    try {
      await create.mutateAsync({ category: f.category.trim(), amount, notes: f.notes.trim() || null, expenseDate: new Date(`${f.date || today()}T12:00:00`).toISOString() });
      n.ok("Expense recorded"); setF({ category: "", amount: "", notes: "", date: today() }); onClose();
    } catch (e) { n.fail(e); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add expense">
      <div className="chips">{CATEGORIES.map(c => <button key={c} className={`chip ${f.category === c ? "on" : ""}`} onClick={() => { tap(); setF({ ...f, category: c }); }}>{c}</button>)}</div>
      <Field label="Category"><input className="input" value={f.category} onChange={e => setF({ ...f, category: e.target.value })} placeholder="e.g. Rent" /></Field>
      <div className="grid2">
        <Field label="Amount"><input className="input" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} inputMode="decimal" placeholder="0.00" /></Field>
        <Field label="Date"><input className="input" type="date" value={f.date} max={today()} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
      </div>
      <Field label="Notes (optional)" error={err}><textarea className="textarea" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="What was this for?" maxLength={500} /></Field>
      <button className="btn btn-primary btn-block" disabled={create.isPending} onClick={submit}>{create.isPending ? "Saving…" : "Save expense"}</button>
    </Sheet>
  );
}

export default function Expenses() {
  const s = useSession();
  const q = useList<Expense[]>(["expenses"], "/expenses");
  const [adding, setAdding] = useState(false);
  const cur = s.tenant?.currency;
  const totals = useMemo(() => {
    const by = new Map<string, number>(); let all = 0;
    for (const e of q.data ?? []) { by.set(e.category, (by.get(e.category) ?? 0) + num(e.amount)); all += num(e.amount); }
    return { all, cats: [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5) };
  }, [q.data]);
  return (
    <Screen title="Expenses" subtitle="Track business spending" back="/more" onRefresh={() => q.refetch()} strip={q.data?.length ? (
      <div><div className="strip-top"><span className="strip-label">Total recorded</span><span className="strip-chip">{q.data.length} expense{q.data.length === 1 ? "" : "s"}</span></div>
        <div className="strip-big mono">{money(totals.all, cur)}</div><div className="strip-meta">Latest 500 entries</div></div>) : undefined}
      right={s.can.admin ? <button className="icon-btn" aria-label="Add expense" onClick={() => { tap(); setAdding(true); }}><IonIcon icon={addOutline} /></button> : undefined}>
      <Async q={q} empty={d => d.length ? null : <Empty icon={walletOutline} title="No expenses yet" hint="Record rent, utilities and other costs to see true profit in reports." action={s.can.admin ? <button className="btn btn-primary" onClick={() => setAdding(true)}>Add expense</button> : undefined} />}>
        {d => <>
          {totals.cats.length > 0 && <Card><div className="h2" style={{ marginBottom: 10 }}>Top categories</div><div className="stack" style={{ gap: 12 }}>{totals.cats.map(([name, total]) => (
            <div key={name}><div className="row between small"><b>{name}</b><span className="mono">{money(total, cur)}</span></div><div className="meter" style={{ marginTop: 5 }}><i style={{ width: `${totals.all ? (total / totals.all) * 100 : 0}%` }} /></div></div>
          ))}</div></Card>}
          <div className="section-title">All expenses</div>
          <Card pad={false} className="divide">{d.map(e => <Row key={e.id} icon={walletOutline} tone="amber" title={e.category} sub={`${dateOnly(e.expenseDate)}${e.notes ? ` · ${e.notes}` : ""}`} right={<b className="mono small">{money(e.amount, cur)}</b>} />)}</Card>
        </>}
      </Async>
      <AddExpense open={adding} onClose={() => setAdding(false)} />
    </Screen>
  );
}
