import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, BookOpen, CheckCircle2, FileText, Loader2, MessageCircle, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { moneyWhole } from "@/lib/format";
import { whatsappLink } from "@/lib/receipt";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Initials, fmtDate, fmtTime } from "@/components/data/kit";

const METHODS = [["cash", "Cash"], ["card", "Card"], ["transfer", "Bank transfer"], ["other", "Other"]] as const;

/** One customer's udhaar account: what they owe, repayments, credit limit, reminders and history. */
export default function CustomerDrawer({ customerId, onClose }: { customerId: number | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const q = trpc.credit.ledger.useQuery({ customerId: customerId!, pageSize: 50 }, { enabled: !!customerId });
  const { data: settings } = trpc.tenant.settings.useQuery();
  const { data: ctx } = trpc.tenant.context.useQuery();
  const isAdmin = ctx?.membership.role === "tenant_admin";
  const statement = trpc.reports.customerStatementPdf.useQuery({ customerId: customerId! }, { enabled: false });

  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number][0]>("cash");
  const [note, setNote] = useState("");
  const [editLimit, setEditLimit] = useState(false);
  const [limitInput, setLimitInput] = useState("");

  const c = q.data?.customer;
  const owed = Number(c?.balance ?? 0);
  const limit = c?.creditLimit != null ? Number(c.creditLimit) : null;
  const refresh = () => Promise.all([utils.credit.invalidate(), utils.customers.list.invalidate(), utils.dashboard.invalidate(), utils.shifts.invalidate(), utils.reports.invalidate()]);

  const receive = trpc.credit.receive.useMutation({
    onSuccess: async r => { toast.success(`Received ${moneyWhole(r.paid)} from ${r.customerName}. ${Number(r.balance) > 0 ? `${moneyWhole(r.balance)} still owed.` : "All settled."}`); setPayOpen(false); setAmount(""); setNote(""); await refresh(); },
    onError: e => toast.error(e.message),
  });
  const setLimit = trpc.credit.setLimit.useMutation({
    onSuccess: async () => { toast.success("Credit limit updated."); setEditLimit(false); await refresh(); },
    onError: e => toast.error(e.message),
  });

  const downloadStatement = async () => {
    const r = await statement.refetch();
    if (!r.data) return toast.error("Could not generate the statement.");
    const bytes = Uint8Array.from(window.atob(r.data.base64), ch => ch.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: r.data.mimeType }));
    const a = document.createElement("a"); a.href = url; a.download = r.data.filename; a.click(); URL.revokeObjectURL(url);
  };
  const remind = () => {
    if (!c) return;
    const text = `Assalam o Alaikum ${c.name},\nYour outstanding balance at ${settings?.name ?? "our shop"} is ${moneyWhole(owed)}.\nPlease pay at your earliest convenience. Thank you!`;
    window.open(whatsappLink(c.phone, text), "_blank");
  };

  return (
    <>
      <Sheet open={!!customerId} onOpenChange={o => !o && onClose()}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto border-slate-200 bg-white p-0 text-slate-900 sm:max-w-md">
          <SheetHeader className="border-b border-slate-100 p-6 pb-5">
            <SheetTitle className="flex items-center gap-3 text-lg font-bold">
              {c ? <><Initials name={c.name} /><span className="min-w-0"><span className="block truncate">{c.name}</span><span className="block text-xs font-normal text-slate-500">{c.phone || "No phone on file"}</span></span></> : "Customer"}
            </SheetTitle>
          </SheetHeader>

          {q.isLoading || !c ? <div className="flex flex-1 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div> : (
            <div className="flex-1 space-y-5 p-6">
              <div className={`rounded-2xl p-5 ${owed > 0 ? "bg-gradient-to-br from-rose-50 to-amber-50 ring-1 ring-rose-100" : "bg-emerald-50 ring-1 ring-emerald-100"}`}>
                <p className={`flex items-center gap-1.5 text-xs font-semibold ${owed > 0 ? "text-rose-700" : "text-emerald-700"}`}>{owed > 0 ? <BookOpen className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{owed > 0 ? "Udhaar owed" : "All settled"}</p>
                <p className={`mt-1 text-3xl font-extrabold tabular-nums ${owed > 0 ? "text-rose-700" : "text-emerald-700"}`}>{moneyWhole(owed)}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span>Credit limit: <b className="text-slate-800">{limit === null ? "None" : moneyWhole(limit)}</b></span>
                  {isAdmin && !editLimit && <button onClick={() => { setLimitInput(limit === null ? "" : String(limit)); setEditLimit(true); }} className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline"><Pencil className="h-3 w-3" /> Edit</button>}
                </div>
                {editLimit && (
                  <div className="mt-3 flex gap-2">
                    <Input type="number" min="0" inputMode="decimal" value={limitInput} onChange={e => setLimitInput(e.target.value)} placeholder="No limit" className="h-10 rounded-xl border-slate-200 bg-white" />
                    <Button onClick={() => setLimit.mutate({ customerId: c.id, creditLimit: limitInput === "" ? null : Number(limitInput) })} disabled={setLimit.isPending} className="h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-700">{setLimit.isPending ? "Saving…" : "Save"}</Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => { setAmount(String(owed)); setPayOpen(true); }} disabled={owed <= 0} className="col-span-2 h-11 rounded-xl bg-gradient-to-b from-teal-400 to-teal-500 font-bold text-teal-950 hover:from-teal-300 hover:to-teal-400 disabled:opacity-50">Receive payment</Button>
                <Button variant="outline" onClick={remind} disabled={owed <= 0 || !c.phone} className="h-10 rounded-xl border-slate-200 text-emerald-700 hover:bg-emerald-50"><MessageCircle className="mr-2 h-4 w-4" /> Remind</Button>
                <Button variant="outline" onClick={downloadStatement} disabled={statement.isFetching} className="h-10 rounded-xl border-slate-200">{statement.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}Statement</Button>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Account history</p>
                {!q.data!.rows.length ? <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No credit activity yet. Sell with "Udhaar" at the POS to start an account.</p> : (
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {q.data!.rows.map(({ entry, saleNumber, by }) => {
                      const up = Number(entry.amount) > 0;
                      const Icon = entry.type === "refund" ? RotateCcw : up ? ArrowUpRight : ArrowDownLeft;
                      const label = entry.type === "credit_sale" ? "Credit sale" : entry.type === "payment" ? `Payment received${entry.method ? ` · ${entry.method}` : ""}` : entry.type === "refund" ? "Sale refunded" : "Adjustment";
                      return (
                        <li key={entry.id} className="flex items-start gap-3 px-3.5 py-3">
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${up ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}><Icon className="h-4 w-4" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">{label}{saleNumber && <span className="ml-1.5 font-mono text-[11px] font-medium text-slate-400">{saleNumber}</span>}</p>
                            <p className="text-[11px] text-slate-500">{fmtDate(entry.createdAt)} · {fmtTime(entry.createdAt)}{by?.name ? ` · ${by.name}` : ""}</p>
                            {entry.note && <p className="mt-0.5 text-[11px] italic text-slate-500">“{entry.note}”</p>}
                          </div>
                          <div className="text-right"><p className={`text-sm font-bold tabular-nums ${up ? "text-rose-600" : "text-emerald-600"}`}>{up ? "+" : "−"}{moneyWhole(Math.abs(Number(entry.amount)))}</p><p className="text-[11px] tabular-nums text-slate-400">bal {moneyWhole(entry.balanceAfter)}</p></div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {q.data!.total > q.data!.rows.length && <p className="mt-2 text-center text-xs text-slate-400">Showing the latest {q.data!.rows.length} of {q.data!.total} entries</p>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="rounded-2xl border-slate-200 bg-white p-6 text-slate-900">
          <DialogHeader><DialogTitle className="text-xl font-bold">Receive payment{c ? ` from ${c.name}` : ""}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Currently owes <b>{moneyWhole(owed)}</b>.</p>
          <div>
            <label className="text-xs font-semibold text-slate-600">Amount (PKR)</label>
            <Input type="number" min="0" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} autoFocus className="mt-1.5 h-12 rounded-xl border-slate-200 bg-slate-50 text-lg font-bold" />
            <div className="mt-2 flex gap-2">
              <button onClick={() => setAmount(String(owed))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Full {moneyWhole(owed)}</button>
              {owed > 1 && <button onClick={() => setAmount(String(Math.round(owed / 2)))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Half</button>}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="text-xs font-semibold text-slate-600">Received by</label>
              <Select value={method} onValueChange={v => setMethod(v as typeof method)}><SelectTrigger className="mt-1.5 h-11 w-full rounded-xl border-slate-200 bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900">{METHODS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-xs font-semibold text-slate-600">Note (optional)</label><Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. weekly payment" className="mt-1.5 h-11 rounded-xl border-slate-200 bg-slate-50" /></div>
          </div>
          {Number(amount) > 0 && Number(amount) <= owed && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Balance after this payment: {moneyWhole(owed - Number(amount))}</p>}
          <Button onClick={() => c && receive.mutate({ customerId: c.id, amount: Number(amount), method, note: note || null })} disabled={receive.isPending || !(Number(amount) > 0) || Number(amount) > owed} className="h-11 w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-700">
            {receive.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{receive.isPending ? "Saving…" : "Confirm payment"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

