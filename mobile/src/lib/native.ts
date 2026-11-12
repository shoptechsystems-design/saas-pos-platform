import { App } from "@capacitor/app";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNative } from "./platform";
import type { PdfResult } from "./types";

export const tap = () => { if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined); };
export const success = () => { if (isNative) Haptics.notification({ type: NotificationType.Success }).catch(() => undefined); };
export const warn = () => { if (isNative) Haptics.notification({ type: NotificationType.Error }).catch(() => undefined); };

/** One-time setup: status bar, hardware back button, splash hide. */
export async function initNative() {
  if (!isNative) return;
  document.documentElement.classList.add("native-app");
  try { await StatusBar.setStyle({ style: Style.Dark }); await StatusBar.setBackgroundColor({ color: "#0B1220" }); } catch { /* unsupported */ }
  App.addListener("backButton", ({ canGoBack }) => {
    const roots = ["/", "/home", "/sell", "/orders", "/inventory", "/more", "/login", "/welcome"];
    if (canGoBack && !roots.includes(window.location.pathname)) window.history.back(); else App.exitApp();
  });
  setTimeout(() => SplashScreen.hide().catch(() => undefined), 150);
}

/** Share plain text (receipts). Falls back to the clipboard in a browser. */
export async function shareText(title: string, text: string) {
  try {
    if (isNative || (navigator as any).share) { await Share.share({ title, text, dialogTitle: title }); return; }
    await navigator.clipboard.writeText(text);
  } catch { /* user cancelled */ }
}

/** Save a base64 PDF from the API and open the share sheet (native) or download it (browser). */
export async function savePdf(pdf: PdfResult) {
  if (!isNative) {
    const bytes = Uint8Array.from(atob(pdf.base64), c => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: pdf.mimeType }));
    Object.assign(document.createElement("a"), { href: url, download: pdf.filename }).click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return;
  }
  const file = await Filesystem.writeFile({ path: pdf.filename, data: pdf.base64, directory: Directory.Cache });
  await Share.share({ title: pdf.filename, url: file.uri, dialogTitle: "Share PDF" });
}

export function receiptText(input: { business: string; saleNumber: string; when: string; lines: { name: string; qty: number; total: string }[]; subtotal: string; discount: string; tax: string; total: string; change?: string; footer?: string | null }) {
  const rows = input.lines.map(l => `${l.qty} x ${l.name}  ${l.total}`).join("\n");
  return [`${input.business}`, `Receipt ${input.saleNumber}`, input.when, "", rows, "", `Subtotal: ${input.subtotal}`, Number(input.discount.replace(/[^\d.-]/g, "")) ? `Discount: ${input.discount}` : "", `Tax: ${input.tax}`, `TOTAL: ${input.total}`, input.change ? `Change: ${input.change}` : "", "", input.footer ?? "Thank you for shopping with us."].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
}
