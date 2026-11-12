import { KaryanoLogo } from "@/components/Logo";
import { useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Barcode,
  Boxes,
  CheckCircle,
  ChevronRight,
  Lock,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
} from "lucide-react";

type Props = { onLogin: () => void; onRegister: () => void };

/* ───────────── 3D hero scene ───────────── */

function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setRot({ x: -py * 10, y: px * 14 });
  };

  const scene: CSSProperties = {
    transform: `rotateX(${10 + rot.x}deg) rotateY(${-12 + rot.y}deg) rotateZ(1deg)`,
    transformStyle: "preserve-3d",
    transition: "transform 0.25s ease-out",
  };

  const bars = [38, 56, 44, 72, 60, 88, 70, 96];

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setRot({ x: 0, y: 0 })}
      className="relative mx-auto w-full max-w-[640px] select-none"
      style={{ perspective: "1600px" }}
    >
      <div className="absolute inset-0 -z-10 rounded-full bg-[#14b8a6]/25 blur-[110px]" />
      <div className="relative" style={scene}>
        {/* main dashboard panel */}
        <div
          className="relative rounded-[28px] border border-white/10 bg-gradient-to-b from-[#121a2c] to-[#0b1220] p-4 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)_inset]"
          style={{ transform: "translateZ(0px)" }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold text-slate-400">karyano.app / dashboard</span>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#2dd4bf]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2dd4bf]" /> Live</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              { l: "Today's sales", v: "₨ 184,250", c: "text-[#2dd4bf]" },
              { l: "Orders", v: "126", c: "text-white" },
              { l: "Avg. order", v: "₨ 1,462", c: "text-[#fb7c66]" },
            ].map(k => (
              <div key={k.l} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <p className="text-[10px] font-medium text-slate-500">{k.l}</p>
                <p className={`mt-1.5 text-base font-bold tracking-tight ${k.c}`}>{k.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-300">Revenue · last 8 days</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#14b8a6]/15 px-2 py-0.5 text-[10px] font-bold text-[#2dd4bf]"><TrendingUp className="h-3 w-3" /> +18.4%</span>
            </div>
            <div className="mt-4 flex h-32 items-end gap-2">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: i === bars.length - 1 ? "linear-gradient(to top,#0f766e,#2dd4bf)" : "linear-gradient(to top,rgba(45,212,191,0.12),rgba(45,212,191,0.35))" }} />
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {["Latte", "Croissant", "Cold Brew", "Beans 1kg"].map((n, i) => (
              <div key={n} className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
                <div className="h-9 rounded-md" style={{ background: ["#3b2a20", "#7a4b21", "#1f2a44", "#27302a"][i] }} />
                <p className="mt-1.5 truncate text-[10px] font-semibold text-slate-300">{n}</p>
              </div>
            ))}
          </div>
        </div>

        {/* floating receipt */}
        <div className="lp-float absolute -left-16 top-44 w-44 rounded-2xl border border-white/10 bg-white p-3.5 text-[#0f172a] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]" style={{ transform: "translateZ(90px)" }}>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Receipt className="h-3.5 w-3.5 text-[#0f766e]" /> SALE-2026-1050</div>
          <div className="mt-2 space-y-1 text-[10px] text-slate-500">
            <div className="flex justify-between"><span>2 × Latte</span><span>₨ 900</span></div>
            <div className="flex justify-between"><span>Croissant</span><span>₨ 450</span></div>
            <div className="flex justify-between"><span>Tax 18%</span><span>₨ 243</span></div>
          </div>
          <div className="mt-2 flex justify-between border-t border-dashed border-slate-200 pt-2 text-xs font-extrabold"><span>Total</span><span className="text-[#0f766e]">₨ 1,593</span></div>
        </div>

        {/* floating low-stock alert */}
        <div className="lp-float-slow absolute -right-6 bottom-28 flex w-52 items-center gap-3 rounded-2xl border border-white/10 bg-[#1a2236]/90 p-3 backdrop-blur-md shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]" style={{ transform: "translateZ(120px)" }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fb7c66]/15"><AlertTriangle className="h-4 w-4 text-[#fb7c66]" /></span>
          <div><p className="text-[11px] font-bold text-white">Low stock</p><p className="text-[10px] text-slate-400">Almond Milk 1L · 8 left</p></div>
        </div>

        {/* floating payment chip */}
        <div className="lp-float absolute -top-8 right-10 flex items-center gap-2 rounded-full border border-[#2dd4bf]/30 bg-[#0b1220]/90 px-3.5 py-2 backdrop-blur-md shadow-[0_20px_40px_-10px_rgba(20,184,166,0.45)]" style={{ transform: "translateZ(150px)" }}>
          <CheckCircle className="h-4 w-4 text-[#2dd4bf]" />
          <span className="text-[11px] font-bold text-white">Payment received</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────── hover-tilt card ───────────── */

function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ x: 0, y: 0, gx: 50, gy: 50, on: false });

  const move = (e: MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({ x: (0.5 - py) * 8, y: (px - 0.5) * 8, gx: px * 100, gy: py * 100, on: true });
  };

  return (
    <div style={{ perspective: "900px" }} className={className}>
      <div
        ref={ref}
        onMouseMove={move}
        onMouseLeave={() => setT(s => ({ ...s, x: 0, y: 0, on: false }))}
        className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7"
        style={{ transform: `rotateX(${t.x}deg) rotateY(${t.y}deg)`, transition: "transform 0.2s ease-out" }}
      >
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{ opacity: t.on ? 1 : 0, background: `radial-gradient(320px circle at ${t.gx}% ${t.gy}%, rgba(45,212,191,0.14), transparent 60%)` }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#14b8a6]/25 to-[#14b8a6]/5 text-[#2dd4bf] shadow-[0_8px_24px_-8px_rgba(20,184,166,0.5)]">{children}</span>;
}

/* ───────────── page ───────────── */

export default function Landing({ onLogin, onRegister }: Props) {
  const features = [
    { icon: Zap, title: "Checkout without friction", body: "Search by name, SKU or barcode, build the cart in a tap and print a clean receipt in seconds.", span: "md:col-span-2" },
    { icon: ShieldCheck, title: "Isolated by design", body: "Every business lives in its own secure tenant with role-based access.", span: "" },
    { icon: Boxes, title: "Inventory that talks back", body: "Low-stock alerts, purchase orders and adjustments keep shelves full.", span: "" },
    { icon: BarChart3, title: "The complete picture", body: "Revenue, margins, expenses and customer statements, exportable as branded PDFs.", span: "md:col-span-2" },
  ];

  const steps = [
    { n: "01", icon: ShoppingBag, t: "Sell", d: "Collect cash, card or transfer. Offline-friendly mobile checkout syncs when you're back online." },
    { n: "02", icon: Barcode, t: "Replenish", d: "Catch low stock early and raise purchase orders before momentum slows." },
    { n: "03", icon: TrendingUp, t: "Understand", d: "One live view of the business, scoped to the right roles and tenants." },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b14] text-white selection:bg-[#14b8a6] selection:text-[#04201c]">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden">
        <div className="lp-aurora absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-[#14b8a6]/20 blur-[130px]" />
        <div className="lp-aurora-2 absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[#fb7c66]/15 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_72%)]" />
      </div>

      {/* nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070b14]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" aria-label="Karyano home" className="flex items-center"><KaryanoLogo height={40} className="text-white" /></a>
          <nav className="hidden items-center gap-9 text-sm font-medium text-slate-400 md:flex">
            <a href="#features" className="transition hover:text-white">Platform</a>
            <a href="#workflow" className="transition hover:text-white">Workflow</a>
            <a href="#security" className="transition hover:text-white">Security</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onLogin} className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:inline-flex">Sign in</button>
            <button onClick={onRegister} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0b1220] transition hover:bg-[#ccfbf1]">Start free</button>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* hero */}
        <section className="mx-auto grid max-w-7xl gap-16 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-10 lg:pb-32 lg:pt-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur">
              <span className="rounded-full bg-[#14b8a6] px-1.5 py-0.5 text-[10px] font-bold text-[#04201c]">NEW</span> Offline-first mobile checkout <ChevronRight className="h-3 w-3 text-slate-500" />
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.04] tracking-[-0.025em] sm:text-6xl lg:text-[4.4rem]">
              Run your shop with <span className="bg-gradient-to-r from-[#5eead4] via-[#2dd4bf] to-[#fb7c66] bg-clip-text text-transparent">calm precision.</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-slate-400">
              Karyano unifies checkout, inventory, customers and reporting in one fast, multi-tenant workspace, built for PKR and for the way real shops work.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button onClick={onRegister} className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#2dd4bf] to-[#14b8a6] px-7 text-sm font-bold text-[#04201c] shadow-[0_18px_40px_-12px_rgba(20,184,166,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-12px_rgba(20,184,166,0.85)]">
                Create your workspace <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={onLogin} className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10">Sign in</button>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-7">
              {[["PKR", "native currency"], ["RBAC", "roles built in"], ["100%", "tenant isolated"]].map(([a, b]) => (
                <div key={a}><p className="text-xl font-extrabold tracking-tight text-white">{a}</p><p className="mt-0.5 text-xs text-slate-500">{b}</p></div>
              ))}
            </div>
          </div>
          <div className="px-2 pt-14 sm:px-8 lg:px-0 lg:pl-6 lg:pt-0"><HeroScene /></div>
        </section>

        {/* features */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2dd4bf]">The platform</p>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-0.015em] sm:text-5xl">Everything the counter needs. Nothing it doesn't.</h2>
            <p className="mt-5 text-slate-400">One workspace for the cashier, the stockroom and the owner's desk.</p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {features.map(f => (
              <TiltCard key={f.title} className={f.span}>
                <IconBadge><f.icon className="h-5 w-5" /></IconBadge>
                <h3 className="mt-8 text-xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-2.5 max-w-md text-sm leading-6 text-slate-400">{f.body}</p>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* workflow */}
        <section id="workflow" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#fb7c66]">One connected workflow</p>
              <h2 className="mt-4 max-w-md text-4xl font-extrabold leading-tight tracking-[-0.015em] sm:text-5xl">From first scan to next decision.</h2>
              <p className="mt-5 max-w-md leading-7 text-slate-400">Every role gets the right view without the whole maze, for owners, cashiers and inventory teams alike.</p>
            </div>
            <div className="relative space-y-5">
              <div className="absolute bottom-6 left-[27px] top-6 hidden w-px bg-gradient-to-b from-[#2dd4bf]/60 via-white/10 to-transparent sm:block" />
              {steps.map(s => (
                <div key={s.n} className="relative flex gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#2dd4bf]/30 hover:bg-white/[0.05]">
                  <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1220] text-[#2dd4bf]"><s.icon className="h-6 w-6" /></span>
                  <div>
                    <p className="text-xs font-bold text-slate-500">{s.n}</p>
                    <h3 className="mt-1 text-xl font-bold">{s.t}</h3>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* security */}
        <section id="security" className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="grid items-center gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-8 sm:p-12 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#2dd4bf]"><Lock className="h-4 w-4" /> Security</div>
              <h2 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">Built so one business can never see another.</h2>
              <p className="mt-4 max-w-xl text-slate-400">Server-side password hashing, httpOnly sessions, role-based permissions and strict tenant boundaries on every query.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-slate-300">
              {["Hashed passwords", "httpOnly sessions", "Role-based access", "Tenant isolation"].map(t => (
                <span key={t} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3"><CheckCircle className="h-4 w-4 text-[#2dd4bf]" /> {t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1220] px-6 py-14 text-center sm:px-12">
            <div className="lp-aurora absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#14b8a6]/30 blur-[100px]" />
            <div className="relative">
              <Users className="mx-auto h-8 w-8 text-[#2dd4bf]" />
              <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-extrabold leading-tight tracking-[-0.015em] sm:text-5xl">Make your next shift feel lighter.</h2>
              <p className="mx-auto mt-4 max-w-md text-slate-400">Set up your PKR-ready workspace in minutes.</p>
              <button onClick={onRegister} className="mt-9 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-sm font-bold text-[#0b1220] transition hover:-translate-y-0.5 hover:bg-[#ccfbf1]">Create workspace <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/5 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© 2026 Karyano. Commerce operations, clarified.</p>
        <p>Secure multi-tenant POS for modern businesses.</p>
      </footer>
    </div>
  );
}
