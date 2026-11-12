import { IonContent, IonIcon, IonPage } from "@ionic/react";
import { KaryanoMark } from "~/components/Logo";
import { eyeOffOutline, eyeOutline, settingsOutline } from "ionicons/icons";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Field, Sheet } from "~/components/ui";
import { defaultApiBase, getApiBase, setApiBase, useToken } from "~/lib/platform";
import { ApiError } from "~/lib/rest";
import { useAuthActions } from "~/lib/session";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ServerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [url, setUrl] = useState(getApiBase());
  const [err, setErr] = useState("");
  const save = () => {
    const v = url.trim().replace(/\/+$/, "");
    if (!/^https?:\/\/.+/i.test(v)) return setErr("Enter a full address starting with https:// (or http:// on your local network).");
    setApiBase(v === defaultApiBase ? null : v); onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Server settings">
      <p className="muted small" style={{ margin: 0 }}>The address of your Karyano server — the same one your web portal runs on.</p>
      <Field label="Server address" error={err}><input className="input" value={url} onChange={e => { setUrl(e.target.value); setErr(""); }} inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://your-pos.example.com" /></Field>
      <button className="btn btn-primary btn-block" onClick={save}>Save</button>
      {defaultApiBase && <button className="btn btn-block" onClick={() => { setApiBase(null); setUrl(defaultApiBase); onClose(); }}>Reset to default</button>}
    </Sheet>
  );
}

function Shell({ title, sub, children, footer }: { title: string; sub: string; children: React.ReactNode; footer: React.ReactNode }) {
  const [server, setServer] = useState(false);
  return (
    <IonPage>
      <IonContent>
        <div className="auth">
          <div className="row between"><KaryanoMark size={52} />
            <button className="icon-btn" aria-label="Server settings" onClick={() => setServer(true)}><IonIcon icon={settingsOutline} /></button></div>
          <div><h1 className="h1" style={{ fontSize: 28 }}>{title}</h1><p className="muted" style={{ margin: "6px 0 0" }}>{sub}</p></div>
          {children}
          <div className="center muted small" style={{ marginTop: "auto" }}>{footer}</div>
        </div>
        <ServerSheet open={server} onClose={() => setServer(false)} />
      </IonContent>
    </IonPage>
  );
}

function PasswordInput({ value, onChange, placeholder, auto }: { value: string; onChange: (v: string) => void; placeholder: string; auto: string }) {
  const [show, setShow] = useState(false);
  return <div className="pw"><input className="input" type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={auto} /><button type="button" aria-label="Toggle password" onClick={() => setShow(!show)}><IonIcon icon={show ? eyeOffOutline : eyeOutline} /></button></div>;
}

export function Login() {
  const token = useToken();
  const nav = useNavigate();
  const { login } = useAuthActions();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  if (token) return <Navigate to="/home" replace />;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!EMAIL.test(email.trim())) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    try { await login(email.trim(), password); nav("/home", { replace: true }); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Could not sign in."); }
    finally { setBusy(false); }
  };
  return (
    <Shell title="Welcome back" sub="Sign in to your Karyano workspace." footer={<>New to Karyano? <Link className="link" to="/signup">Create an account</Link></>}>
      <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        <Field label="Email"><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" autoComplete="email" inputMode="email" autoCapitalize="none" /></Field>
        <Field label="Password"><PasswordInput value={password} onChange={setPassword} placeholder="Your password" auto="current-password" /></Field>
        {error && <div className="banner bad">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </Shell>
  );
}

export function Signup() {
  const token = useToken();
  const nav = useNavigate();
  const { register } = useAuthActions();
  const [f, setF] = useState({ name: "", businessName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  if (token) return <Navigate to="/home" replace />;
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (f.name.trim().length < 2) return setError("Enter your full name.");
    if (f.businessName.trim().length < 2) return setError("Enter your business name.");
    if (!EMAIL.test(f.email.trim())) return setError("Enter a valid email address.");
    if (f.password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try { await register({ name: f.name.trim(), businessName: f.businessName.trim(), email: f.email.trim(), password: f.password }); nav("/home", { replace: true }); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Could not create the account."); }
    finally { setBusy(false); }
  };
  return (
    <Shell title="Create your account" sub="Set up your business and start selling in minutes." footer={<>Already have an account? <Link className="link" to="/login">Sign in</Link></>}>
      <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        <Field label="Your name"><input className="input" value={f.name} onChange={e => set("name")(e.target.value)} placeholder="Full name" autoComplete="name" /></Field>
        <Field label="Business name"><input className="input" value={f.businessName} onChange={e => set("businessName")(e.target.value)} placeholder="e.g. Al-Madina Mart" /></Field>
        <Field label="Email"><input className="input" type="email" value={f.email} onChange={e => set("email")(e.target.value)} placeholder="you@business.com" autoComplete="email" inputMode="email" autoCapitalize="none" /></Field>
        <Field label="Password" hint="At least 8 characters."><PasswordInput value={f.password} onChange={set("password")} placeholder="Create a password" auto="new-password" /></Field>
        {error && <div className="banner bad">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        <p className="tiny muted center" style={{ margin: 0 }}>You'll be the owner of the new business workspace.</p>
      </form>
    </Shell>
  );
}
