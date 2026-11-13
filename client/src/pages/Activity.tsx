import { useState } from "react";
import { Activity as ActivityIcon, Banknote, BookOpen, Package, Receipt, RotateCcw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { moneyWhole } from "@/lib/format";
import { DataTable, Initials, PageHeader, Pill, Segmented, fmtDate, fmtTime, relativeTime, type Column } from "@/components/data/kit";

type Row = RouterOutputs["activity"]["list"]["rows"][number];
const ENTITY: Record<string, { label: string; icon: LucideIcon }> = {
  sale: { label: "Sale", icon: Receipt }, shift: { label: "Cash drawer", icon: Banknote }, purchase: { label: "Purchase order", icon: Truck },
  product: { label: "Product", icon: Package }, tenant_settings: { label: "Settings", icon: ShieldCheck }, credit: { label: "Udhaar", icon: BookOpen },
};
const TONE: Record<string, "emerald" | "rose" | "indigo" | "amber" | "teal" | "slate"> = { payment: "emerald", limit: "amber", completed: "emerald", refunded: "rose", received: "indigo", opened: "teal", closed: "slate", updated: "amber", created: "emerald", deleted: "rose" };

function describe(l: Row["log"]): string {
  let m: Record<string, any> = {};
  try { m = l.metadata ? JSON.parse(l.metadata) : {}; } catch { /* ignore */ }
  if (l.entity === "sale" && l.action === "completed") return `${m.saleNumber ?? "Sale"} · ${m.total ? moneyWhole(m.total) : ""}${m.credit ? ` · ${moneyWhole(m.credit)} on credit` : ""}`;
  if (l.entity === "sale" && l.action === "refunded") return `${m.saleNumber} · ${m.total ? moneyWhole(m.total) : ""} — “${m.reason ?? ""}”`;
  if (l.entity === "credit" && l.action === "payment") return `${m.customer} paid ${moneyWhole(m.amount ?? 0)} (${m.method}) · balance ${moneyWhole(m.balance ?? 0)}`;
  if (l.entity === "credit" && l.action === "limit") return `${m.customer} · credit limit ${m.creditLimit == null ? "removed" : moneyWhole(m.creditLimit)}`;
  if (l.entity === "shift" && l.action === "opened") return `Opening float ${moneyWhole(m.openingCash ?? 0)}`;
  if (l.entity === "shift" && l.action === "closed") return `Expected ${moneyWhole(m.expected ?? 0)}, counted ${moneyWhole(m.counted ?? 0)} (${(m.variance ?? 0) >= 0 ? "+" : "−"}${moneyWhole(Math.abs(m.variance ?? 0))})`;
  if (l.entity === "purchase") return `${m.purchaseNumber ?? ""}${m.items ? ` · ${m.items} lines` : ""}`;
  const keys = Object.keys(m).slice(0, 3);
  return keys.length ? keys.map(k => `${k}: ${typeof m[k] === "object" ? "…" : String(m[k])}`).join(" · ") : "—";
}

export default function ActivityView() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState("all");
  const q = trpc.activity.list.useQuery({ page, pageSize: 15, entity: entity === "all" ? undefined : entity }, { placeholderData: p => p });
  const cols: Column<Row>[] = [
    { key: "when", header: "When", cell: r => <div><p className="text-sm text-slate-800">{relativeTime(r.log.createdAt)}</p><p className="text-[11px] text-slate-400">{fmtDate(r.log.createdAt)} · {fmtTime(r.log.createdAt)}</p></div> },
    { key: "user", header: "User", cell: r => <div className="flex items-center gap-2.5"><Initials name={r.user?.name ?? "?"} size="sm" /><span className="text-sm font-medium text-slate-800">{r.user?.name ?? "System"}</span></div> },
    { key: "action", header: "Action", cell: r => { const e = ENTITY[r.log.entity]; const I = e?.icon ?? ActivityIcon; return <div className="flex items-center gap-2"><Pill tone={TONE[r.log.action] ?? "slate"}>{r.log.action === "refunded" ? <RotateCcw className="h-3 w-3" /> : <I className="h-3 w-3" />}<span className="capitalize">{r.log.action}</span></Pill><span className="text-sm text-slate-600">{e?.label ?? r.log.entity}</span></div>; } },
    { key: "detail", header: "Details", hideBelow: "md", cell: r => <span className="text-sm text-slate-600">{describe(r.log)}</span> },
  ];
  return (
    <div className="space-y-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-6 lg:space-y-0">
      <PageHeader title="Activity log" description="A tamper-evident trail of sales, refunds, shifts and stock changes." />
      <DataTable columns={cols} rows={q.data?.rows ?? []} rowKey={r => r.log.id} loading={q.isLoading} server={{ page, pageSize: 15, total: q.data?.total ?? 0, onPageChange: setPage }}
        toolbar={<Segmented value={entity} onChange={v => { setEntity(v); setPage(1); }} options={[{ value: "all", label: "All" }, { value: "sale", label: "Sales" }, { value: "shift", label: "Cash drawer" }, { value: "purchase", label: "Purchasing" }, { value: "credit", label: "Udhaar" }, { value: "product", label: "Products" }]} />}
        empty={{ icon: ActivityIcon, title: "No activity yet", hint: "Actions like sales, refunds and shift changes are recorded here automatically." }} />
    </div>
  );
}
