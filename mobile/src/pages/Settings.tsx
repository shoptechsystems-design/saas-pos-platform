import { IonIcon } from "@ionic/react";
import { imageOutline } from "ionicons/icons";
import { useEffect, useRef, useState } from "react";
import { Async, Card, Field, Screen, useNotify } from "~/components/ui";
import { useAct, useSettings } from "~/lib/queries";
import { api } from "~/lib/rest";
import { useSession } from "~/lib/session";

const TYPES = ["Retail", "Grocery", "Pharmacy", "Restaurant", "Electronics", "Clothing", "Wholesale", "Other"];

export default function Settings() {
  const s = useSession(); const n = useNotify();
  const q = useSettings();
  const admin = s.can.admin;
  const [f, setF] = useState({ name: "", businessType: "Retail", currency: "PKR", taxRate: "0", receiptFooter: "" });
  const [logo, setLogo] = useState<string | null>(null);
  const [err, setErr] = useState(""); const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (q.data) { setF({ name: q.data.name, businessType: q.data.businessType, currency: q.data.currency, taxRate: String(q.data.taxRate), receiptFooter: q.data.receiptFooter ?? "" }); setLogo(q.data.logoUrl); } }, [q.data]);
  const save = useAct((b: object) => api.put("/tenant/settings", b), ["settings", "context"]);
  const refresh = useAct(async () => null, ["settings", "context"]);

  const submit = async () => {
    const tax = Number(f.taxRate);
    if (f.name.trim().length < 2) return setErr("Enter your business name.");
    if (f.currency.trim().length < 3) return setErr("Currency must be at least 3 letters (e.g. PKR).");
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) return setErr("Tax rate must be between 0 and 100.");
    setErr("");
    try { await save.mutateAsync({ name: f.name.trim(), businessType: f.businessType.trim() || "Retail", currency: f.currency.trim().toUpperCase(), taxRate: tax, logoUrl: logo || null, receiptFooter: f.receiptFooter.trim() || null }); n.ok("Settings saved"); }
    catch (e) { n.fail(e); }
  };
  const upload = (input: HTMLInputElement) => {
    const picked = input.files?.[0]; input.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/")) return n.fail(new Error("Please choose an image file."));
    if (picked.size > 5 * 1024 * 1024) return n.fail(new Error("Logo must be under 5 MB."));
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try { const r = await api.post<{ url: string }>("/tenant/logo", { filename: picked.name, base64Data: String(reader.result), contentType: picked.type }); setLogo(r.url); await refresh.mutateAsync(null); n.ok("Logo updated"); }
      catch (e) { n.fail(e); } finally { setUploading(false); }
    };
    reader.onerror = () => n.fail(new Error("Could not read that file."));
    reader.readAsDataURL(picked);
  };
  return (
    <Screen title="Business settings" back="/more" onRefresh={() => q.refetch()}>
      <Async q={q}>
        {() => <>
          {!admin && <div className="banner info">Only the business owner / admin can change these settings.</div>}
          <Card>
            <div className="row" style={{ gap: 14 }}>
              <div className="avatar" style={{ width: 72, height: 72, borderRadius: 18, overflow: "hidden" }}>{logo ? <img src={logo} alt="Business logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setLogo(null)} /> : <IonIcon icon={imageOutline} style={{ fontSize: 30 }} />}</div>
              <div className="grow"><div className="h2">Business logo</div><div className="small muted">Shown on receipts and PDF reports. PNG or JPG, up to 5 MB.</div>
                {admin && <><button className="btn btn-sm" style={{ marginTop: 8 }} disabled={uploading} onClick={() => file.current?.click()}>{uploading ? "Uploading…" : logo ? "Change logo" : "Upload logo"}</button><input ref={file} type="file" accept="image/png,image/jpeg" hidden onChange={e => upload(e.target)} /></>}</div>
            </div>
          </Card>
          <Card><div className="stack" style={{ gap: 14 }}>
            <Field label="Business name"><input className="input" value={f.name} disabled={!admin} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Business type"><select className="select" value={f.businessType} disabled={!admin} onChange={e => setF({ ...f, businessType: e.target.value })}>{[...new Set([f.businessType, ...TYPES])].map(t => <option key={t}>{t}</option>)}</select></Field>
            <div className="grid2">
              <Field label="Currency"><input className="input" value={f.currency} disabled={!admin} maxLength={8} autoCapitalize="characters" onChange={e => setF({ ...f, currency: e.target.value })} /></Field>
              <Field label="Tax rate (%)"><input className="input" value={f.taxRate} disabled={!admin} inputMode="decimal" onChange={e => setF({ ...f, taxRate: e.target.value })} /></Field>
            </div>
            <Field label="Receipt footer" hint="Printed at the bottom of receipts and PDFs." error={err}><textarea className="textarea" value={f.receiptFooter} disabled={!admin} maxLength={500} onChange={e => setF({ ...f, receiptFooter: e.target.value })} placeholder="Thank you for shopping with us." /></Field>
          </div></Card>
          {admin && <button className="btn btn-primary btn-block" disabled={save.isPending} onClick={submit}>{save.isPending ? "Saving…" : "Save changes"}</button>}
        </>}
      </Async>
    </Screen>
  );
}
