import { IonIcon } from "@ionic/react";
import { cardOutline, cashOutline, returnDownBackOutline, swapHorizontalOutline, walletOutline } from "ionicons/icons";
import { tap } from "~/lib/native";
import { money } from "~/lib/format";
import type { Sale } from "~/lib/types";

export const PAY_META: Record<string, { icon: string; cls: string; label: string }> = {
  cash: { icon: cashOutline, cls: "cash", label: "Cash" }, card: { icon: cardOutline, cls: "card", label: "Card" },
  transfer: { icon: swapHorizontalOutline, cls: "transfer", label: "Transfer" }, other: { icon: walletOutline, cls: "other", label: "Other" },
};

/** One sale in a list: payment-method icon, who/when, amount and status. */
export function SaleRow({ sale, customer, items, cur, when, onClick }: { sale: Sale; customer: { name: string } | null; items?: number; cur?: string; when: string; onClick?: () => void }) {
  const refunded = sale.status === "refunded";
  const pay = PAY_META[sale.paymentMethod] ?? PAY_META.other;
  const inner = (
    <>
      <div className={`paychip ${refunded ? "refunded" : pay.cls}`}><IonIcon icon={refunded ? returnDownBackOutline : pay.icon} /></div>
      <div className="grow">
        <div className="bold ellipsis" style={{ color: "var(--c-navy)" }}>{customer?.name ?? "Walk-in customer"}</div>
        <div className="small muted ellipsis">{sale.saleNumber.replace("SALE-", "#")} · {when}{items ? ` · ${items} item${items > 1 ? "s" : ""}` : ""}</div>
      </div>
      <div className="right"><div className={`amt mono ${refunded ? "void" : ""}`}>{money(sale.total, cur)}</div><div className="tiny" style={{ color: refunded ? "var(--c-red)" : "var(--c-faint)", fontWeight: 700 }}>{refunded ? "Refunded" : pay.label}</div></div>
    </>
  );
  return onClick ? <button className="list-row" onClick={() => { tap(); onClick(); }}>{inner}</button> : <div className="list-row">{inner}</div>;
}
