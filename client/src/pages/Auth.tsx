import { useState } from "react";
import { KaryanoLogo } from "@/components/Logo";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle, Eye, EyeOff, Lock, Mail, ShieldCheck, Store, TrendingUp, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-[#2dd4bf]/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-[#2dd4bf]/10";

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-300">{label}</label>
      <div className="relative mt-1.5">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        {children}
      </div>
    </div>
  );
}

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  return score;
}

export default function AuthScreen({ initialMode = "login", onBack, onAuthenticated }: { initialMode?: "login" | "register"; onBack?: () => void; onAuthenticated: () => Promise<unknown> }) {
  const authUtils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async result => {
      authUtils.auth.me.setData(undefined, result.user);
      toast.success("Welcome back to Karyano.");
      await onAuthenticated();
    },
    onError: error => toast.error(error.message),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async result => {
      authUtils.auth.me.setData(undefined, result.user);
      toast.success("Workspace created. Welcome to Karyano.");
      await onAuthenticated();
    },
    onError: error => toast.error(error.message),
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "register") {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      registerMutation.mutate({ name, businessName, email, password });
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const score = strength(password);
  const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"][score];
  const strengthColor = ["bg-slate-600", "bg-[#fb7c66]", "bg-[#febc2e]", "bg-[#5eead4]", "bg-[#2dd4bf]"][score];

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[#070b14] text-white selection:bg-[#14b8a6] selection:text-[#04201c] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="pointer-events-none absolute inset-0">
        <div className="lp-aurora absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-[#14b8a6]/20 blur-[130px]" />
        <div className="lp-aurora-2 absolute -bottom-40 right-0 h-[480px] w-[480px] rounded-full bg-[#fb7c66]/12 blur-[130px]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_30%_30%,black_20%,transparent_70%)]" />
      </div>

      {/* showcase */}
      <section className="relative hidden flex-col justify-between border-r border-white/5 p-14 lg:flex">
        <div><KaryanoLogo height={46} className="text-white" /></div>

        <div className="relative">
          <h1 className="max-w-xl text-5xl font-extrabold leading-[1.06] tracking-[-0.025em]">
            Sell with confidence.<br />
            <span className="bg-gradient-to-r from-[#5eead4] via-[#2dd4bf] to-[#fb7c66] bg-clip-text text-transparent">Run it all from one calm workspace.</span>
          </h1>
          <p className="mt-6 max-w-lg leading-7 text-slate-400">A focused POS terminal, live inventory, customer records and clean financial reporting for fast-moving shops and cafés.</p>

          {/* 3D floating stack */}
          <div className="relative mt-14 h-56 max-w-lg" style={{ perspective: "1200px" }}>
            <div className="absolute inset-0" style={{ transform: "rotateX(14deg) rotateY(-18deg)", transformStyle: "preserve-3d" }}>
              <div className="absolute left-0 top-6 w-64 rounded-2xl border border-white/10 bg-gradient-to-b from-[#121a2c] to-[#0b1220] p-4 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]" style={{ transform: "translateZ(0)" }}>
                <p className="text-[11px] font-medium text-slate-500">Today's sales</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-[#2dd4bf]">₨ 184,250</p>
                <div className="mt-4 flex h-14 items-end gap-1.5">
                  {[35, 55, 42, 70, 58, 90, 76].map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 6 ? "linear-gradient(to top,#0f766e,#2dd4bf)" : "rgba(45,212,191,0.25)" }} />)}
                </div>
              </div>
              <div className="lp-float absolute left-44 top-0 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a2236]/90 p-3.5 backdrop-blur-md shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]" style={{ transform: "translateZ(80px)" }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14b8a6]/15"><TrendingUp className="h-4 w-4 text-[#2dd4bf]" /></span>
                <div><p className="text-xs font-bold">+18.4% this week</p><p className="text-[10px] text-slate-400">126 orders completed</p></div>
              </div>
              <div className="lp-float-slow absolute left-52 top-28 flex items-center gap-2 rounded-full border border-[#2dd4bf]/30 bg-[#0b1220]/90 px-4 py-2 backdrop-blur-md shadow-[0_20px_40px_-10px_rgba(20,184,166,0.45)]" style={{ transform: "translateZ(130px)" }}>
                <CheckCircle className="h-4 w-4 text-[#2dd4bf]" /><span className="text-xs font-bold">Payment received</span>
              </div>
            </div>
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-[#2dd4bf]" /> Secure access for admins, cashiers and inventory managers.</p>
      </section>

      {/* form */}
      <section className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="lg:hidden"><KaryanoLogo height={38} className="text-white" /></div>
            {onBack && <button type="button" onClick={onBack} className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to overview</button>}
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-7 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2dd4bf]">{mode === "login" ? "Welcome back" : "Start your workspace"}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.015em]">{mode === "login" ? "Sign in to Karyano" : "Create your business account"}</h2>
            <p className="mt-2 text-sm text-slate-400">{mode === "login" ? "Use your email and password to continue." : "Set up your PKR-ready POS workspace in minutes."}</p>

            <div className="mb-6 mt-7 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
              {(["login", "register"] as const).map(m => (
                <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-lg py-2.5 text-sm font-semibold transition ${mode === m ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-slate-400 hover:text-slate-200"}`}>{m === "login" ? "Sign in" : "Register"}</button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && <>
                <Field label="Your name" icon={User}><input value={name} onChange={e => setName(e.target.value)} required placeholder="Ayesha Khan" autoComplete="name" className={fieldClass} /></Field>
                <Field label="Business name" icon={Store}><input value={businessName} onChange={e => setBusinessName(e.target.value)} required placeholder="Khan Mart & Café" className={fieldClass} /></Field>
              </>}
              <Field label="Email address" icon={Mail}><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@business.com" autoComplete="email" className={fieldClass} /></Field>
              <Field label="Password" icon={Lock}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : 1} placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"} autoComplete={mode === "login" ? "current-password" : "new-password"} className={`${fieldClass} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </Field>
              {mode === "register" && <>
                {password && (
                  <div>
                    <div className="flex gap-1.5">{[1, 2, 3, 4].map(i => <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? strengthColor : "bg-white/10"}`} />)}</div>
                    <p className="mt-1.5 text-[11px] text-slate-500">Password strength: <span className="font-semibold text-slate-300">{strengthLabel}</span></p>
                  </div>
                )}
                <Field label="Confirm password" icon={Lock}>
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} placeholder="Repeat password" autoComplete="new-password" className={`${fieldClass} pr-11 ${confirmPassword && confirmPassword !== password ? "!border-[#fb7c66]/60" : ""}`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide password" : "Show password"} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </Field>
              </>}
              <button type="submit" disabled={isPending} className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2dd4bf] to-[#14b8a6] text-sm font-bold text-[#04201c] shadow-[0_16px_36px_-12px_rgba(20,184,166,0.7)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                {isPending ? "Please wait..." : mode === "login" ? "Sign in to workspace" : "Create PKR workspace"}
                {!isPending && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              {mode === "login" ? "New to Karyano?" : "Already have an account?"}{" "}
              <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-semibold text-[#2dd4bf] hover:underline">{mode === "login" ? "Create a workspace" : "Sign in"}</button>
            </p>
          </div>

          <p className="mt-5 flex items-start justify-center gap-2 text-center text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2dd4bf]" /> Passwords are hashed server-side and sessions use httpOnly cookies.</p>
        </div>
      </section>
    </div>
  );
}
