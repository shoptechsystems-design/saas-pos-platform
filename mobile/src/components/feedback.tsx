import { IonIcon } from "@ionic/react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { cloudDoneOutline, cloudOfflineOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";

/** Slim progress bar at the very top while any request is in flight. Waits 200 ms so quick loads don't flicker. */
export function GlobalProgress() {
  const busy = useIsFetching() + useIsMutating() > 0;
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (busy) { const t = setTimeout(() => setShow(true), 200); return () => clearTimeout(t); }
    const t = setTimeout(() => setShow(false), 250); return () => clearTimeout(t);
  }, [busy]);
  return <div className={`gprogress ${show ? "on" : ""}`} role="progressbar" aria-hidden={!show} aria-label="Loading"><i /></div>;
}

/** Pill above the tab bar: "You're offline" while disconnected, then a brief "Back online" confirmation. */
export function NetworkStatus() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [back, setBack] = useState(false);
  useEffect(() => {
    let prev = online;
    const update = (c: boolean) => { if (c && !prev) { setBack(true); setTimeout(() => setBack(false), 2600); } prev = c; setOnline(c); };
    Network.getStatus().then(s => update(s.connected)).catch(() => undefined);
    const h = Network.addListener("networkStatusChange", s => update(s.connected));
    const on = () => update(true), off = () => update(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { void h.then(x => x.remove()); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (online && !back) return null;
  return (
    <div className={`netpill ${online ? "ok" : "off"}`} role="status" aria-live="polite">
      <IonIcon icon={online ? cloudDoneOutline : cloudOfflineOutline} />
      <span>{online ? "Back online" : "You're offline · sales are saved and will sync"}</span>
    </div>
  );
}

/**
 * Adds a spinner to any disabled .btn whose label ends with "…" ("Saving…", "Processing…").
 * Convention for new buttons: show "Doing something…" while pending and the spinner appears automatically.
 */
export function BusyButtons() {
  useEffect(() => {
    const sync = () => document.querySelectorAll<HTMLButtonElement>("button.btn, button.cartpill").forEach(b => {
      const busy = b.disabled && /…\s*$/.test(b.textContent ?? "");
      b.classList.toggle("is-loading", busy); b.setAttribute("aria-busy", busy ? "true" : "false");
    });
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["disabled"] });
    return () => mo.disconnect();
  }, []);
  return null;
}
