import { IonIcon } from "@ionic/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { documentTextOutline, receiptOutline, shareOutline, returnDownBackOutline } from "ionicons/icons";
import { useState } from "react";
import { Async, Empty, ErrorBox, Loading, Pill, Row, Screen, SearchBox, Sheet, Stat, useNotify } from "~/components/ui";
import { dateTime, daysAgo, money, startOfDay, titleCase } from "~/lib/format";
import { receiptText, savePdf, shareText } from "~/lib/native";
import { api, qs } from "~/lib/rest";
import { keys, useAct } from "~/lib/queries";
import { useToken } from "~/lib/platform";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "~/lib/session";
import type { PdfResult, SaleDetail, SalesPage } from "~/lib/types";

const RANGES = [{ id: "today", label: "Today", from: () => startOfDay() }, { id: "7", label: "7 days", from: () => daysAgo(6) }, { id: "30", label: "30 days", from: () => daysAgo(29) }, { id: "all", label: "All", from: () => undefined }] as const;
const PAY = ["cash", "card", "transfer"] as const;
const tone = (s: string) => (s === "completed" ? "ok" : s === "refunded" ? "bad" : "warn");

export default function Orders() {
  const s = useSession(); const token = useToken(); const qc = useQueryClient(); const cur = s.tenant?.currency;
  const [search, setSearch] = useState(""); const [status, setStatus] = useState<"completed" | "refunded" | "all">("completed");
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("7"); const [pay, setPay] = useState<string | undefined>(); const [openId, setOpenId] = useState<number | null>(null);
  const from = RANGES.find(r => r.id === range)!.from();
  const params = { search: search.trim() || undefined, status, from, paymentMethod: pay };
  const list = useInfiniteQuery({
    queryKey: keys.sales(params), enabled: Boolean(token), initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<SalesPage>(`/sales${qs({ ...params, page: pageParam, pageSize: 20 })}`),
    getNextPageParam: (last, pages) => (pages.flatMap(p => p.rows).length < last.total ? pages.length + 1 : undefined),
  });
  const first = list.data?.pages[0]; const rows = list.data?.pages.flatMap(p => p.rows) ?? [];

  return (
    <Screen title="Orders" onRefresh={() => qc.invalidateQueries({ queryKey: ["sales"] })}>
      <SearchBox value={search} onChange={setSearch} placeholder="Search sale number or customer" />
      <div className="chips">{RANGES.map(r => <button key={r.id} className={`chip ${range === r.id ? "on" : ""}`} onClick={() => setRange(r.id)}>{r.label}</button>)}
        <span style={{ width: 8, flex: "none" }} />{PAY.map(m => <button key={m} className={`chip ${pay === m ? "on" : ""}`} style={{ textTransform: "capitalize" }} onClick={() => setPay(pay === m ? undefined : m)}>{m}</button>)}</div>
      <div className="seg">{(["completed", "refunded", "all"] as const).map(v => <button key={v} className={status === v ? "on" : ""} onClick={() => setStatus(v)}>{v}</button>)}</div>
      {first && <div className="kpis"><Stat label="Revenue" value={money(first.revenue, cur)} sub={`${first.total} order${first.total === 1 ? "" : "s"}`} /><Stat label="Average order" value={money(first.avgOrder, cur)} sub={first.refundedCount ? `${first.refundedCount} refunded` : undefined} /></div>}
      {list.isLoading ? <Loading /> : list.isError ? <ErrorBox error={list.error} retry={() => list.refetch()} /> :
        !rows.length ? <Empty icon={receiptOutline} title="No orders found" hint="Try a different date range or filter." /> : (
          <>
            <div className="card divide">{rows.map(r => <Row key={r.sale.id} icon={receiptOutline} tone={r.sale.status === "refunded" ? "red" : "blue"} onClick={() => setOpenId(r.sale.id)} title={r.sale.saleNumber} sub={`${r.customer?.name ?? "Walk-in"} · ${dateTime(r.sale.createdAt)} · ${r.itemCount} item${r.itemCount === 1 ? "" : "s"}`} right={<div className="right"><b className="mono">{money(r.sale.total, cur)}</b><div><Pill tone={tone(r.sale.status)}>{titleCase(r.sale.status)}</Pill></div></div>} />)}</div>
            {list.hasNextPage && <button className="btn btn-block" disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>{list.isFetchingNextPage ? "Loading…" : "Load more"}</button>}
          </>
        )}
      <SaleSheet id={openId} onClose={() => setOpenId(null)} />
    </Screen>
  );
}

function SaleSheet({ id, onClose }: { id: number | null; onClose: () => void }) {
  const s = useSession(); const cur = s.tenant?.currency; const { ok, fail, confirm } = useNotify();
  const q = useQuery({ queryKey: keys.sale(id ?? 0), queryFn: () => api.get<SaleDetail>(`/sales/${id}`), enabled: id !== null });
  const [reason, setReason] = useState(""); const [refunding, setRefunding] = useState(false);
  const refund = useAct((v: { id: number; reason: string }) => api.post(`/sales/${v.id}/refund`, { reason: v.reason }), ["sales", "sale", "products", "stats", "recent", "customers"]);
  const statement = async (customerId: number) => { try { await savePdf(await api.get<PdfResult>(`/customers/${customerId}/statement`)); } catch (e) { fail(e); } };
  return (
    <Sheet open={id !== null} onClose={() => { setRefunding(false); setReason(""); onClose(); }} title="Order details">
      <Async q={q}>
        {d => {
          const sale = d.sale; const text = receiptText({ business: s.tenant?.name ?? "OmniPOS", saleNumber: sale.saleNumber, when: dateTime(sale.createdAt), lines: d.items.map(i => ({ name: i.productName, qty: i.quantity, total: money(i.lineTotal, cur) })), subtotal: money(sale.subtotal, cur), discount: money(sale.discount, cur), tax: money(sale.tax, cur), total: money(sale.total, cur), change: Number(sale.changeAmount) > 0 ? money(sale.changeAmount, cur) : undefined, footer: s.tenant?.receiptFooter });
          return <>
            <div className="row between"><div><div className="h2 mono">{sale.saleNumber}</div><div className="small muted">{dateTime(sale.createdAt)}</div></div><Pill tone={tone(sale.status)}>{titleCase(sale.status)}</Pill></div>
            <div className="card card-pad stack small" style={{ gap: 6 }}>
              <div className="row between"><span className="muted">Customer</span><b>{d.customer?.name ?? "Walk-in"}</b></div>
              <div className="row between"><span className="muted">Cashier</span><b>{d.cashier?.name ?? "—"}</b></div>
              <div className="row between"><span className="muted">Payment</span><b style={{ textTransform: "capitalize" }}>{sale.paymentMethod}</b></div>
            </div>
            <div className="receipt">
              {d.items.map(i => <div className="ln" key={i.id}><span>{i.quantity} × {i.productName}<br /><span className="tiny muted mono">{money(i.unitPrice, cur)} · {i.sku}</span></span><span className="mono">{money(i.lineTotal, cur)}</span></div>)}
              <div className="ln" style={{ borderTop: "1px dashed #cbd5e1", marginTop: 6, paddingTop: 8 }}><span className="muted">Subtotal</span><span className="mono">{money(sale.subtotal, cur)}</span></div>
              {Number(sale.discount) > 0 && <div className="ln"><span className="muted">Discount</span><span className="mono">-{money(sale.discount, cur)}</span></div>}
              <div className="ln"><span className="muted">Tax</span><span className="mono">{money(sale.tax, cur)}</span></div>
              <div className="ln tot"><span>Total</span><span className="mono">{money(sale.total, cur)}</span></div>
              {Number(sale.changeAmount) > 0 && <div className="ln small"><span className="muted">Change given</span><span className="mono">{money(sale.changeAmount, cur)}</span></div>}
            </div>
            <button className="btn btn-block" onClick={() => shareText(`Receipt ${sale.saleNumber}`, text)}><IonIcon icon={shareOutline} /> Share receipt</button>
            {d.customer && <button className="btn btn-block" onClick={() => statement(d.customer!.id)}><IonIcon icon={documentTextOutline} /> Customer statement (PDF)</button>}
            {s.can.admin && sale.status === "completed" && (refunding ? (
              <div className="stack">
                <input className="input" placeholder="Reason for refund (min 3 characters)" value={reason} onChange={e => setReason(e.target.value)} />
                <button className="btn btn-danger btn-block" disabled={reason.trim().length < 3 || refund.isPending} onClick={() => confirm("Refund this sale?", "Stock is returned to inventory and the customer's totals are reduced. This can't be undone.", "Refund", async () => { try { await refund.mutateAsync({ id: sale.id, reason: reason.trim() }); ok("Sale refunded"); setRefunding(false); setReason(""); } catch (e) { fail(e); } }, true)}>{refund.isPending ? "Refunding…" : "Confirm refund"}</button>
              </div>
            ) : <button className="btn btn-danger btn-block" onClick={() => setRefunding(true)}><IonIcon icon={returnDownBackOutline} /> Refund sale</button>)}
          </>;
        }}
      </Async>
    </Sheet>
  );
}
