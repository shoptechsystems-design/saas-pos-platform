import { IonIcon } from "@ionic/react";
import { cloudOfflineOutline, refreshOutline, trashOutline } from "ionicons/icons";
import { useState } from "react";
import { discard, retryNow, useQueue, useSyncing } from "~/lib/offline";
import { dateTime, money } from "~/lib/format";
import { Sheet, useNotify } from "./ui";

/** Shows queued/failed offline sales with Retry + Discard. Hidden when the queue is empty. */
export default function QueueBanner({ currency }: { currency?: string }) {
  const queue = useQueue(); const syncing = useSyncing(); const [open, setOpen] = useState(false); const { confirm } = useNotify();
  if (!queue.length) return null;
  const failed = queue.filter(q => q.status === "failed").length; const pending = queue.length - failed;
  const latest = [...queue].reverse().find(q => q.lastError)?.lastError;
  return (
    <>
      <button className={`banner ${failed ? "bad" : "warn"}`} style={{ border: 0, width: "100%", textAlign: "left", font: "inherit" }} onClick={() => setOpen(true)}>
        <IonIcon icon={cloudOfflineOutline} />
        <span className="grow">{syncing ? "Syncing sales…" : `${pending ? `${pending} sale${pending > 1 ? "s" : ""} waiting to sync` : ""}${pending && failed ? " · " : ""}${failed ? `${failed} failed` : ""}`}{latest && <><br /><span className="tiny" style={{ fontWeight: 500 }}>{latest}</span></>}</span>
        <b>View</b>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Offline sales">
        <button className="btn btn-primary" onClick={() => retryNow()}><IonIcon icon={refreshOutline} /> {syncing ? "Syncing…" : "Retry now"}</button>
        <div className="card divide">
          {queue.map(q => (
            <div className="list-row" key={q.id}>
              <div className="grow"><div className="bold">{money(q.summary.total, currency)} <span className={`pill ${q.status === "failed" ? "bad" : "warn"}`}>{q.status}</span></div>
                <div className="small muted">{q.summary.itemCount} item{q.summary.itemCount > 1 ? "s" : ""} · {dateTime(q.createdAt)}{q.summary.customerName ? ` · ${q.summary.customerName}` : ""}</div>
                {q.lastError && <div className="tiny" style={{ color: "var(--c-red)" }}>{q.lastError}</div>}</div>
              {q.status === "failed" && <button className="icon-btn" aria-label="Retry" onClick={() => retryNow(q.id)}><IonIcon icon={refreshOutline} /></button>}
              <button className="icon-btn" aria-label="Discard" onClick={() => confirm("Discard this sale?", "It will be removed from this phone and never sent to the server.", "Discard", () => discard(q.id), true)}><IonIcon icon={trashOutline} /></button>
            </div>
          ))}
        </div>
        <p className="tiny muted" style={{ margin: 0 }}>Sales sync automatically when you're back online. Each sale is sent once — retrying never creates duplicates.</p>
      </Sheet>
    </>
  );
}
