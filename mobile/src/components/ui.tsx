import { IonContent, IonHeader, IonModal, IonPage, IonRefresher, IonRefresherContent, IonSpinner, IonToolbar, useIonAlert, useIonToast } from "@ionic/react";
import { alertCircleOutline, chevronBack, closeOutline, searchOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "~/lib/rest";
import { KaryanoMark } from "~/components/Logo";
import { success, tap, warn } from "~/lib/native";
import { initials, tint } from "~/lib/format";

export function Screen({ title, subtitle, brand, back, right, children, onRefresh, bare }: { title: string; subtitle?: string; brand?: boolean; back?: boolean | string; right?: ReactNode; children: ReactNode; onRefresh?: () => Promise<unknown> | unknown; bare?: boolean }) {
  const nav = useNavigate();
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <div className="hdr">
            {back ? <button className="icon-btn" aria-label="Back" onClick={() => (typeof back === "string" ? nav(back) : nav(-1))}><IonIcon icon={chevronBack} /></button> : brand ? <KaryanoMark size={36} /> : null}
            <div className="hdr-title"><h1 className="hdr-h1">{title}</h1>{subtitle && <div className="hdr-sub">{subtitle}</div>}</div>
            {right}
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {onRefresh && <IonRefresher slot="fixed" onIonRefresh={async e => { try { await onRefresh(); } finally { e.detail.complete(); } }}><IonRefresherContent /></IonRefresher>}
        {bare ? children : <div className="page">{children}</div>}
      </IonContent>
    </IonPage>
  );
}

/** Bottom sheet. Children render only while open, so forms start fresh each time. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  return (
    <IonModal isOpen={open} onDidDismiss={onClose} className="sheet-modal" keepContentsMounted={false}>
      <div className="ion-page">
        <div className="grab" />
        <div className="sheet-head">
          <h2 className="h2">{title}</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><IonIcon icon={closeOutline} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </IonModal>
  );
}

export const Card = ({ children, pad = true, className = "" }: { children: ReactNode; pad?: boolean; className?: string }) => <div className={`card ${pad ? "card-pad" : ""} ${className}`}>{children}</div>;
export const Pill = ({ tone = "", children }: { tone?: "ok" | "warn" | "bad" | "info" | "teal" | ""; children: ReactNode }) => <span className={`pill ${tone}`}>{children}</span>;
/** Shimmering placeholder rows. Feels faster than a spinner and keeps the layout from jumping. */
export function Skeleton({ rows = 5, cards = false }: { rows?: number; cards?: boolean }) {
  return cards
    ? <div className="skel-cards">{Array.from({ length: rows }).map((_, i) => <div key={i} className="skel skel-card" />)}</div>
    : <div className="card divide" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }).map((_, i) => (
        <div className="list-row" key={i}><div className="skel" style={{ width: 40, height: 40, borderRadius: 12 }} />
          <div className="grow"><div className="skel" style={{ height: 13, width: `${55 + ((i * 17) % 30)}%` }} /><div className="skel" style={{ height: 10, width: `${35 + ((i * 11) % 25)}%`, marginTop: 8 }} /></div>
          <div className="skel" style={{ height: 14, width: 54 }} /></div>))}</div>;
}
export const Loading = ({ label }: { label?: string }) => <div><Skeleton />{label && <p className="muted small center" style={{ marginTop: 10 }}>{label}</p>}</div>;

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="section-head"><span>{title}</span>{action && <button onClick={() => { tap(); onAction?.(); }}>{action} ›</button>}</div>;
}

export function Empty({ icon, title, hint, action }: { icon: string; title: string; hint?: string; action?: ReactNode }) {
  return <div className="empty"><div className="ico"><IonIcon icon={icon} /></div><h3>{title}</h3>{hint && <p style={{ margin: "0 0 14px" }}>{hint}</p>}{action}</div>;
}

export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  const msg = error instanceof ApiError || error instanceof Error ? error.message : "Something went wrong.";
  return <div className="empty"><div className="ico" style={{ background: "var(--c-red-soft)", color: "var(--c-red)" }}><IonIcon icon={alertCircleOutline} /></div><h3>Couldn't load</h3><p style={{ margin: "0 0 14px" }}>{msg}</p>{retry && <button className="btn btn-dark btn-sm" onClick={retry}>Try again</button>}</div>;
}

/** Render a query: spinner, error, empty, then data. */
export function Async<X>({ q, empty, loading, children }: { loading?: ReactNode; q: { isLoading: boolean; isError: boolean; error: unknown; data: X | undefined; refetch: () => unknown }; empty?: (data: X) => ReactNode | null; children: (data: X) => ReactNode }) {
  if (q.isLoading && q.data === undefined) return <>{loading ?? <Loading />}</>;
  if (q.isError && q.data === undefined) return <ErrorBox error={q.error} retry={() => q.refetch()} />;
  if (q.data === undefined) return null;
  return <>{empty?.(q.data) ?? children(q.data)}</>;
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return <div className="field"><label>{label}</label>{children}{error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}</div>;
}

export function SearchBox({ value, onChange, placeholder = "Search", onEnter, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; onEnter?: () => void; autoFocus?: boolean }) {
  return <div className="search"><IonIcon icon={searchOutline} /><input className="input" value={value} placeholder={placeholder} autoFocus={autoFocus} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter") onEnter?.(); }} enterKeyHint="search" autoCapitalize="none" autoCorrect="off" /></div>;
}

export function Seg<V extends string>({ value, onChange, options }: { value: V; onChange: (v: V) => void; options: { value: V; label: string }[] }) {
  return <div className="seg">{options.map(o => <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => { tap(); onChange(o.value); }}>{o.label}</button>)}</div>;
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return <div className="card kpi"><div className="l">{label}</div><div className="v" style={tone ? { color: tone } : undefined}>{value}</div>{sub && <div className="tiny muted">{sub}</div>}</div>;
}

/** Toast + confirm helpers shared by every screen. */
export function useNotify() {
  const [present] = useIonToast();
  const [alert] = useIonAlert();
  return {
    ok: (message: string) => { success(); present({ message, duration: 2000, color: "success", position: "top" }); },
    fail: (e: unknown) => { warn(); present({ message: e instanceof Error ? e.message : String(e), duration: 3500, color: "danger", position: "top" }); },
    confirm: (header: string, message: string, label: string, onConfirm: () => void, danger = false) =>
      alert({ header, message, buttons: [{ text: "Cancel", role: "cancel" }, { text: label, role: danger ? "destructive" : "confirm", handler: onConfirm }] }),
  };
}

export function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  const [bg, fg] = tint(name);
  return <div className="avatar round" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.34 }}>{initials(name)}</div>;
}

export function Row({ lead, icon, tone = "", title, sub, right, onClick, chevron }: { lead?: ReactNode; icon?: string; tone?: string; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; chevron?: boolean }) {
  const inner = (
    <>
      {lead ?? (icon && <div className={`icon-chip ${tone}`}><IonIcon icon={icon} /></div>)}
      <div className="grow"><div className="bold ellipsis" style={{ color: "var(--c-navy)" }}>{title}</div>{sub && <div className="small muted ellipsis">{sub}</div>}</div>
      {right}
    </>
  );
  return onClick ? <button className="list-row" onClick={() => { tap(); onClick(); }}>{inner}</button> : <div className="list-row">{inner}</div>;
}
