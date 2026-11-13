import { IonIcon } from "@ionic/react";
import { lockClosedOutline, lockOpenOutline, timeOutline } from "ionicons/icons";
import { useState } from "react";
import { Async, Card, Empty, Field, Pill, Row, Screen, Sheet, useNotify } from "~/components/ui";
import { dateTime, money, num } from "~/lib/format";
import { useAct, useList } from "~/lib/queries";
import { api } from "~/lib/rest";
import { useSession } from "~/lib/session";
import type { ShiftCurrent, ShiftRow } from "~/lib/types";

const Line = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => <div className="row between small"><span className="muted">{k}</span><span className={`mono ${strong ? "black" : "bold"}`}>{v}</span></div>;

export default function Shifts() {
  const s = useSession(); const n = useNotify();
  const cur = s.tenant?.currency;
  const current = useList<ShiftCurrent | null>(["shifts", "current"], "/shifts/current");
  const history = useList<ShiftRow[]>(["shifts", "list"], "/shifts");
  const [opening, setOpening] = useState(false); const [closing, setClosing] = useState(false);
  const [cash, setCash] = useState(""); const [notes, setNotes] = useState(""); const [err, setErr] = useState("");
  const [result, setResult] = useState<{ expected: number; counted: number; variance: number } | null>(null);
  const open = useAct((b: object) => api.post("/shifts/open", b), ["shifts"]);
  const close = useAct((b: object) => api.post<{ expected: number; counted: number; variance: number }>("/shifts/close", b), ["shifts"]);
  const reset = () => { setCash(""); setNotes(""); setErr(""); };
  const parse = () => { const v = Number(cash); if (cash.trim() === "" || !Number.isFinite(v) || v < 0) { setErr("Enter an amount of 0 or more."); return null; } setErr(""); return v; };
  const doOpen = async () => { const v = parse(); if (v === null) return; try { await open.mutateAsync({ openingCash: v }); n.ok("Shift opened"); reset(); setOpening(false); } catch (e) { n.fail(e); } };
  const doClose = async () => { const v = parse(); if (v === null) return; try { setResult(await close.mutateAsync({ countedCash: v, notes: notes.trim() || null })); n.ok("Shift closed"); reset(); } catch (e) { n.fail(e); } };
  return (
    <Screen title="Shifts" subtitle="Open and close the register" back="/more" onRefresh={() => Promise.all([current.refetch(), history.refetch()])}>
      <Async q={current}>
        {c => c ? (
          <Card>
            <div className="row between"><div className="h2">Shift in progress</div><Pill tone="ok">Open</Pill></div>
            <p className="small muted" style={{ margin: "2px 0 12px" }}>Opened {dateTime(c.shift.openedAt)}</p>
            <div className="stack" style={{ gap: 8 }}>
              <Line k="Opening cash" v={money(c.shift.openingCash, cur)} />
              <Line k="Cash sales" v={money(c.cashSales, cur)} />
              {(c.repayments ?? 0) > 0 && <Line k="Udhaar repayments (cash)" v={money(c.repayments ?? 0, cur)} />}
              <Line k="Expected cash in drawer" v={money(c.expectedCash, cur)} strong />
              <Line k="Total sales (all methods)" v={money(c.totalSales, cur)} />
              <Line k="Orders" v={String(c.orders)} />
            </div>
            {s.can.sell && <button className="btn btn-dark btn-block" style={{ marginTop: 14 }} onClick={() => { reset(); setResult(null); setClosing(true); }}><IonIcon icon={lockClosedOutline} />Close shift</button>}
          </Card>
        ) : (
          <Card><Empty icon={lockOpenOutline} title="No open shift" hint="Open a shift with your starting cash to track the drawer and reconcile at close."
            action={s.can.sell ? <button className="btn btn-primary" onClick={() => { reset(); setOpening(true); }}>Open shift</button> : <span className="small">Only cashiers and owners can open a shift.</span>} /></Card>
        )}
      </Async>
      <div className="section-title">History</div>
      <Async q={history} empty={d => d.length ? null : <Empty icon={timeOutline} title="No shifts yet" />}>
        {d => <Card pad={false} className="divide">{d.map(({ shift, opener }) => {
          const v = shift.variance == null ? null : num(shift.variance);
          return <Row key={shift.id} icon={timeOutline} tone={shift.status === "open" ? "green" : "navy"} title={dateTime(shift.openedAt)} sub={`${opener?.name ?? "Unknown"} · opened with ${money(shift.openingCash, cur)}`}
            right={shift.status === "open" ? <Pill tone="ok">Open</Pill> : <div className="right"><div className="tiny muted">Variance</div><div className={`bold mono small`} style={{ color: !v ? "var(--c-green)" : "var(--c-red)" }}>{v == null ? "—" : `${v > 0 ? "+" : ""}${money(v, cur)}`}</div></div>} />;
        })}</Card>}
      </Async>

      <Sheet open={opening} onClose={() => setOpening(false)} title="Open shift">
        <Field label="Opening cash in drawer" error={err}><input className="input" value={cash} onChange={e => setCash(e.target.value)} inputMode="decimal" placeholder="0.00" autoFocus /></Field>
        <button className="btn btn-primary btn-block" disabled={open.isPending} onClick={doOpen}>{open.isPending ? "Opening…" : "Open shift"}</button>
      </Sheet>
      <Sheet open={closing} onClose={() => setClosing(false)} title={result ? "Shift closed" : "Close shift"}>
        {result ? <>
          <div className="card card-pad stack" style={{ gap: 8 }}>
            <Line k="Expected" v={money(result.expected, cur)} /><Line k="Counted" v={money(result.counted, cur)} />
            <Line k="Variance" v={`${result.variance > 0 ? "+" : ""}${money(result.variance, cur)}`} strong />
          </div>
          <div className={`banner ${Math.abs(result.variance) < 0.005 ? "ok" : "warn"}`}>{Math.abs(result.variance) < 0.005 ? "Drawer matches — no variance." : result.variance > 0 ? "The drawer has more cash than expected." : "The drawer is short compared with expected cash."}</div>
          <button className="btn btn-primary btn-block" onClick={() => { setClosing(false); setResult(null); }}>Done</button>
        </> : <>
          <p className="muted small" style={{ margin: 0 }}>Count the cash in the drawer and enter the total. We'll compare it with the expected amount.</p>
          <Field label="Counted cash" error={err}><input className="input" value={cash} onChange={e => setCash(e.target.value)} inputMode="decimal" placeholder="0.00" autoFocus /></Field>
          <Field label="Notes (optional)"><textarea className="textarea" value={notes} onChange={e => setNotes(e.target.value)} maxLength={300} placeholder="Anything to flag about this shift?" /></Field>
          <button className="btn btn-dark btn-block" disabled={close.isPending} onClick={doClose}>{close.isPending ? "Closing…" : "Close shift"}</button>
        </>}
      </Sheet>
    </Screen>
  );
}
