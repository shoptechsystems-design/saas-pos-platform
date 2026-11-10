import { useState } from "react";
import { Loader2, MessageCircle, Printer, RotateCcw, User } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { moneyWhole } from "@/lib/format";
import { printReceipt, receiptText, whatsappLink, type ReceiptData } from "@/lib/receipt";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill, fmtDate, fmtTime } from "@/components/data/kit";

export default function SaleDrawer({ saleId, onClose }: { saleId: number | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const q = trpc.salesHistory.detail.useQuery({ id: saleId! }, { enabled: !!saleId });
  const { data: settings } = trpc.tenant.settings.useQuery();
  const { data: ctx } = trpc.tenant.context.useQuery();
  const [refundOpen, setRefundOpen] = useState(false);
  const [reason, setReason] = useState("");

  const refund = trpc.salesHistory.refund.useMutation({
    onSuccess: async r => {
      toast.success(`${r.saleNumber} refunded. Stock has been returned to inventory.`);
      setRefundOpen(false); setReason("");
      await Promise.all([utils.salesHistory.invalidate(), utils.dashboard.invalidate(), utils.catalog.products.invalidate(), utils.customers.list.invalidate(), utils.inventory.invalidate()]);
    },
    onError: e => toast.error(e.message),
  });

  const d = q.data;
  const canRefund = ctx?.membership.role === "tenant_admin" && d?.sale.status === "completed";
  const receipt: ReceiptData | null = d ? {
    business: { name: settings?.name ?? "OmniPOS", footer: settings?.receiptFooter }, saleNumber: d.sale.saleNumber, date: d.sale.createdAt, cashier: d.cashier?.name, customer: d.customer?.name,
    paymentMethod: d.sale.paymentMethod, status: d.sale.status, subtotal: d.sale.subtotal, discount: d.sale.discount, tax: d.sale.tax, total: d.sale.total, received: d.sale.amountReceived, change: d.sale.changeAmount,
    items: d.items.map(i => ({ name: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
  } : null;

  return (
    <>
      <Sheet open={!!saleId} onOpenChange={o => !o && onClose()}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto border-slate-200 bg-white p-0 text-slate-900 sm:max-w-md">
          <SheetHeader className="border-b border-slate-100 p-6 pb-5">
            <SheetTitle className="flex items-center gap-3 text-lg font-bold">
              {d ? <span className="font-mono">{d.sale.saleNumber}</span> : "Sale"}
              {d && <Pill tone={d.sale.status === "refunded" ? "rose" : "emerald"} dot>{d.sale.status === "refunded" ? "Refunded" : "Completed"}</Pill>}
            </SheetTitle>
            {d && <p className="text-xs text-slate-500">{fmtDate(d.sale.createdAt)} · {fmtTime(d.sale.createdAt)} · served by {d.cashier?.name ?? "—"}</p>}
          </SheetHeader>

          {q.isLoading || !d ? <div className="flex flex-1 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div> : (
            <div className="flex-1 space-y-6 p-6">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-slate-200"><User className="h-4 w-4 text-slate-500" /></span>
                <div className="min-w-0 text-sm"><p className="truncate font-semibold">{d.customer?.name ?? "Walk-in customer"}</p><p className="truncate text-xs text-slate-500">{d.customer?.phone || d.customer?.email || "No contact on file"}</p></div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Items</p>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {d.items.map(i => (
                    <li key={i.id} className="flex items-start justify-between gap-3 px-3.5 py-3 text-sm">
                      <div className="min-w-0"><p className="font-medium">{i.productName}</p><p className="text-xs text-slate-500">{i.quantity} × {moneyWhole(i.unitPrice)} · <span className="font-mono">{i.sku}</span></p></div>
                      <span className="shrink-0 font-semibold tabular-nums">{moneyWhole(i.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600"><dt>Subtotal</dt><dd className="tabular-nums">{moneyWhole(d.sale.subtotal)}</dd></div>
                {Number(d.sale.discount) > 0 && <div className="flex justify-between text-slate-600"><dt>Discount</dt><dd className="tabular-nums text-rose-600">−{moneyWhole(d.sale.discount)}</dd></div>}
                <div className="flex justify-between text-slate-600"><dt>Tax</dt><dd className="tabular-nums">{moneyWhole(d.sale.tax)}</dd></div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold"><dt>Total</dt><dd className="tabular-nums">{moneyWhole(d.sale.total)}</dd></div>
                <div className="flex justify-between pt-1 text-xs text-slate-500"><dt>Paid by <span className="font-semibold capitalize text-slate-700">{d.sale.paymentMethod}</span></dt>{Number(d.sale.amountReceived) > 0 && <dd>received {moneyWhole(d.sale.amountReceived)} · change {moneyWhole(d.sale.changeAmount)}</dd>}</div>
              </dl>
            </div>
          )}

          {d && receipt && (
            <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-slate-100 bg-white p-4">
              <Button variant="outline" onClick={() => printReceipt(receipt) || toast.error("Allow pop-ups to print receipts.")} className="h-10 rounded-xl border-slate-200"><Printer className="mr-2 h-4 w-4" /> Print</Button>
              <Button variant="outline" onClick={() => window.open(whatsappLink(d.customer?.phone, receiptText(receipt)), "_blank")} className="h-10 rounded-xl border-slate-200 text-emerald-700 hover:bg-emerald-50"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</Button>
              {canRefund && <Button onClick={() => setRefundOpen(true)} className="col-span-2 h-10 rounded-xl bg-rose-600 text-white hover:bg-rose-700"><RotateCcw className="mr-2 h-4 w-4" /> Refund this sale</Button>}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="rounded-2xl border-slate-200 bg-white p-6 text-slate-900">
          <DialogHeader><DialogTitle className="text-xl font-bold">Refund {d?.sale.saleNumber}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">This marks the sale as refunded, returns all items to stock, and reduces the customer's lifetime spend by <b>{d && moneyWhole(d.sale.total)}</b>. This can't be undone.</p>
          <div><label className="text-xs font-semibold text-slate-600">Reason</label><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Customer returned damaged item" className="mt-1.5 h-11 rounded-xl border-slate-200 bg-slate-50" /></div>
          <Button onClick={() => saleId && refund.mutate({ id: saleId, reason })} disabled={refund.isPending || reason.trim().length < 3} className="h-11 w-full rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700">
            {refund.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm refund
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
