import { IonIcon } from "@ionic/react";
import { arrowDownOutline, arrowUpOutline, bookOutline, checkmarkCircleOutline, chatbubbleEllipsesOutline, pencilOutline, returnDownBackOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { Async, Card, Field, Sheet, Seg, useNotify } from "~/components/ui";
import { dateTime, money } from "~/lib/format";
import { shareText, tap } from "~/lib/native";
import { useAct, useLedger } from "~/lib/queries";
import { api } from "~/lib/rest";
import type { Customer } from "~/lib/types";

const METHODS = [{ value: "cash", label: "Cash" }, { value: "card", label: "Card" }, { value: "transfer", label: "Transfer" }, { value: "other", label: "Other" }] as const;
const REFRESH = ["customers", "ledger", "credit", "stats", "shift", "mix"];

/** A customer's udhaar account: what they owe, receive a repayment, credit limit, reminder and history. */
export function UdhaarSection({ customer, currency, isAdmin, business }: { customer: Customer; currency?: string; isAdmin: boolean; business?: string }) {
  const n = useNotify();
  const ledger = useLedger(customer.id);
  const owed = Number(customer.balance);
  const limit = customer.creditLimit != null ? Number(customer.creditLimit) : null;
  const [payOpen, setPayOpen] = useState(false);
  const [editLimit, setEditLimit] = useState(false);
  const [limitInput, setLimitInput] = useState("");

  const setLimit = useAct((creditLimit: number | null) => api.put(`/customers/${customer.id}/credit-limit`, { creditLimit }), REFRESH);
  const saveLimit = async () => {
    try { await setLimit.mutateAsync(limitInput === "" ? null : Number(limitInput)); n.ok("Credit limit updated"); setEditLimit(false); } catch (e) { n.fail(e); }
  };
  const remind = () => shareText("Payment reminder", `Assalam o Alaikum ${customer.name},\nYour outstanding balance at ${business ?? "our shop"} is ${money(owed, currency)}.\nPlease pay at your earliest convenience. Thank you!`);

  return (
    <>
      <div className={`owe-card ${owed > 0 ? "" : "clear"}`}>
        <div className="lbl"><IonIcon icon={owed > 0 ? bookOutline : checkmarkCircleOutline} />{owed > 0 ? "UDHAAR OWED" : "ALL SETTLED"}</div>
        <div className="amt-big mono">{money(owed, currency)}</div>
        <div className="row between small" style={{ marginTop: 6, color: "var(--c-muted)" }}>
          <span>Credit limit: <b style={{ color: "var(--c-navy)" }}>{limit === null ? "None" : money(limit, currency)}</b></span>
          {isAdmin && !editLimit && <button className="link" style={{ padding: 0 }} onClick={() => { tap(); setLimitInput(limit === null ? "" : String(limit)); setEditLimit(true); }}><IonIcon icon={pencilOutline} /> Edit</button>}
        </div>
        {editLimit && (
          <div className="row" style={{ marginTop: 10 }}>
            <input className="input" inputMode="decimal" placeholder="No limit" value={limitInput} onChange={e => setLimitInput(e.target.value.replace(/[^\d.]/g, ""))} />
            <button className="btn btn-dark btn-sm" disabled={setLimit.isPending} onClick={saveLimit}>{setLimit.isPending ? "Saving…" : "Save"}</button>
          </div>
        )}
      </div>

      <div className="grid2">
        <button className="btn btn-primary" style={{ gridColumn: "1 / -1" }} disabled={owed <= 0} onClick={() => { tap(); setPayOpen(true); }}>Receive payment</button>
        <button className="btn" disabled={owed <= 0} onClick={() => { tap(); void remind(); }}><IonIcon icon={chatbubbleEllipsesOutline} /> Remind</button>
        <span />
      </div>

      <div className="section-title">Account history</div>
      <Async q={ledger} empty={d => d.rows.length ? null : <Card><div className="muted small center">No credit activity yet. Sell with “Udhaar” to start an account.</div></Card>}>
        {d => (
          <Card pad={false}>
            <div className="divide">
              {d.rows.map(({ entry, saleNumber, by }) => {
                const up = Number(entry.amount) > 0;
                const label = entry.type === "credit_sale" ? "Credit sale" : entry.type === "payment" ? `Payment received${entry.method ? ` · ${entry.method}` : ""}` : entry.type === "refund" ? "Sale refunded" : "Adjustment";
                return (
                  <div className="list-row" key={entry.id}>
                    <div className={`ledger-ico ${up ? "up" : "down"}`}><IonIcon icon={entry.type === "refund" ? returnDownBackOutline : up ? arrowUpOutline : arrowDownOutline} /></div>
                    <div className="grow">
                      <div className="bold" style={{ color: "var(--c-navy)", fontSize: 14 }}>{label}{saleNumber && <span className="tiny muted"> {saleNumber.replace("SALE-", "#")}</span>}</div>
                      <div className="tiny muted ellipsis">{dateTime(entry.createdAt)}{by?.name ? ` · ${by.name}` : ""}{entry.note ? ` · ${entry.note}` : ""}</div>
                    </div>
                    <div className="right"><div className="bold mono" style={{ color: up ? "var(--c-red)" : "var(--c-green)" }}>{up ? "+" : "−"}{money(Math.abs(Number(entry.amount)), currency)}</div><div className="tiny faint mono">bal {money(entry.balanceAfter, currency)}</div></div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </Async>

      <PaymentSheet open={payOpen} onClose={() => setPayOpen(false)} customer={customer} owed={owed} currency={currency} />
    </>
  );
}

function PaymentSheet({ open, onClose, customer, owed, currency }: { open: boolean; onClose: () => void; customer: Customer; owed: number; currency?: string }) {
  const n = useNotify();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("cash");
  const [note, setNote] = useState("");
  useEffect(() => { if (open) { setAmount(String(owed)); setMethod("cash"); setNote(""); } }, [open, owed]);
  const receive = useAct((b: object) => api.post<{ balance: string; paid: string; customerName: string }>(`/customers/${customer.id}/payments`, b), REFRESH);
  const value = Number(amount);
  const invalid = !(value > 0) || value > owed + 0.0001;
  const submit = async () => {
    try {
      const r = await receive.mutateAsync({ amount: value, method, note: note.trim() || null });
      n.ok(`Received ${money(r.paid, currency)} from ${r.customerName}. ${Number(r.balance) > 0 ? `${money(r.balance, currency)} still owed.` : "All settled."}`);
      onClose();
    } catch (e) { n.fail(e); }
  };
  return (
    <Sheet open={open} onClose={onClose} title={`Payment from ${customer.name}`}>
      <p className="muted small" style={{ margin: 0 }}>Currently owes <b style={{ color: "var(--c-navy)" }}>{money(owed, currency)}</b>.</p>
      <Field label={`Amount (${currency ?? "PKR"})`} error={value > owed + 0.0001 ? "More than they owe." : undefined}>
        <input className={`input ${value > owed + 0.0001 ? "invalid" : ""}`} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        <div className="row" style={{ gap: 6 }}>
          <button className="chip" onClick={() => setAmount(String(owed))}>Full {money(owed, currency)}</button>
          {owed > 1 && <button className="chip" onClick={() => setAmount(String(Math.round(owed / 2)))}>Half</button>}
        </div>
      </Field>
      <Field label="Received by"><Seg value={method} onChange={setMethod} options={[...METHODS]} /></Field>
      <Field label="Note (optional)"><input className="input" value={note} maxLength={300} onChange={e => setNote(e.target.value)} placeholder="e.g. weekly payment" /></Field>
      {!invalid && <div className="banner ok">Balance after this payment: <b className="mono">{money(owed - value, currency)}</b></div>}
      <button className="btn btn-primary btn-block" disabled={invalid || receive.isPending} onClick={submit}>{receive.isPending ? "Saving…" : "Confirm payment"}</button>
    </Sheet>
  );
}
