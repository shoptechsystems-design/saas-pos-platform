import { moneyWhole } from "./format";

export type ReceiptData = {
  business: { name: string; footer?: string | null };
  saleNumber: string;
  date: Date | string;
  cashier?: string | null;
  customer?: string | null;
  paymentMethod: string;
  status?: string;
  items: { name: string; quantity: number; unitPrice: number | string; lineTotal: number | string }[];
  subtotal: number | string; discount: number | string; tax: number | string; total: number | string;
  received?: number | string; change?: number | string;
};

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Opens a thermal-style (80mm) receipt in a print dialog. */
export function printReceipt(r: ReceiptData) {
  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) return false;
  const rows = r.items.map(i => `<tr><td>${esc(i.name)}<br><small>${i.quantity} × ${moneyWhole(i.unitPrice)}</small></td><td class="r">${moneyWhole(i.lineTotal)}</td></tr>`).join("");
  const line = (a: string, b: string, bold = false) => `<tr class="${bold ? "b" : ""}"><td>${a}</td><td class="r">${b}</td></tr>`;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.saleNumber)}</title><style>
    @page{size:80mm auto;margin:4mm} body{font:12px/1.45 ui-monospace,Menlo,monospace;width:72mm;margin:0 auto;color:#000}
    h1{font-size:16px;text-align:center;margin:0 0 2px} .c{text-align:center} small{color:#444} table{width:100%;border-collapse:collapse}
    td{padding:2px 0;vertical-align:top} .r{text-align:right;white-space:nowrap} .b td{font-weight:700;font-size:14px;border-top:1px dashed #000;padding-top:5px}
    hr{border:0;border-top:1px dashed #000;margin:8px 0} .void{border:2px solid #000;text-align:center;font-weight:700;padding:3px;margin:6px 0}
  </style></head><body>
    <h1>${esc(r.business.name)}</h1><div class="c"><small>${esc(r.saleNumber)}<br>${new Date(r.date).toLocaleString("en-GB")}</small></div>
    ${r.status === "refunded" ? '<div class="void">REFUNDED</div>' : ""}<hr>
    <table>${rows}</table><hr>
    <table>${line("Subtotal", moneyWhole(r.subtotal))}${Number(r.discount) > 0 ? line("Discount", "−" + moneyWhole(r.discount)) : ""}${line("Tax", moneyWhole(r.tax))}${line("TOTAL", moneyWhole(r.total), true)}
    ${line("Paid by", esc(r.paymentMethod.toUpperCase()))}${r.received != null && Number(r.received) > 0 ? line("Received", moneyWhole(r.received)) : ""}${r.change != null && Number(r.change) > 0 ? line("Change", moneyWhole(r.change)) : ""}</table><hr>
    <div class="c"><small>${r.customer ? "Customer: " + esc(r.customer) + "<br>" : ""}${r.cashier ? "Served by " + esc(r.cashier) + "<br>" : ""}</small>${esc(r.business.footer || "Thank you for shopping with us!")}</div>
    <script>window.onload=function(){window.focus();window.print();}</script></body></html>`);
  w.document.close();
  return true;
}

/** Plain-text receipt, used for WhatsApp / copy. */
export function receiptText(r: ReceiptData) {
  const lines = [`*${r.business.name}*`, `Receipt ${r.saleNumber}`, new Date(r.date).toLocaleString("en-GB"), "", ...r.items.map(i => `${i.quantity} × ${i.name} — ${moneyWhole(i.lineTotal)}`), "",
    ...(Number(r.discount) > 0 ? [`Discount: −${moneyWhole(r.discount)}`] : []), `Tax: ${moneyWhole(r.tax)}`, `*Total: ${moneyWhole(r.total)}*`, `Paid by ${r.paymentMethod}`, "", r.business.footer || "Thank you for shopping with us!"];
  return lines.join("\n");
}

/** wa.me link. Pakistani numbers starting with 0 are converted to +92. */
export function whatsappLink(phone: string | null | undefined, text: string) {
  let d = (phone ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "92" + d.slice(1);
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}
