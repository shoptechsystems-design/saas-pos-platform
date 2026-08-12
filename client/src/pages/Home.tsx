import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Store,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  ShoppingBag,
  Package,
  Receipt,
  LogOut,
  Plus,
  Trash2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Search,
  Printer,
  Settings,
  Truck,
  CreditCard,
  Tag,
  Clock,
  RotateCcw,
  CheckCircle,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  HelpCircle,
  Bell
} from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, logout, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState("pos");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [publicView, setPublicView] = useState<"home" | "auth">("home");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d2630] text-[#eef3ea]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl animate-pulse">
            <Store className="h-6 w-6 text-[#f8f3e7]" />
          </div>
          <p className="text-sm font-medium tracking-wide text-[#9eb4ae]">Loading OmniPOS Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return publicView === "home"
      ? <PublicHome onLogin={() => { setAuthMode("login"); setPublicView("auth"); }} onRegister={() => { setAuthMode("register"); setPublicView("auth"); }} />
      : <AuthScreen initialMode={authMode} onBack={() => setPublicView("home")} onAuthenticated={refresh} />;
  }

  const { data: tenantCtx } = trpc.tenant.context.useQuery(undefined, { enabled: user.role !== "admin" });
  const { data: tenantSettings } = trpc.tenant.settings.useQuery(undefined, { enabled: user.role !== "admin" });

  const roleLabel = user.role === "admin"
    ? "Super Admin"
    : tenantCtx?.membership.role === "tenant_admin"
    ? "Tenant Admin"
    : tenantCtx?.membership.role === "inventory_manager"
    ? "Inventory Manager"
    : "Cashier";
  const currentRole = roleLabel;

  const businessName = user.role === "admin"
    ? "Platform Administration"
    : (tenantSettings?.name || "OmniPOS Workspace");

  const navGroups = [
    { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: BarChart3 }] },
    { label: "Commerce", items: [
      { id: "pos", label: "POS Terminal", icon: ShoppingBag },
      { id: "products", label: "Products", icon: Package },
      { id: "customers", label: "Customers", icon: Users },
    ] },
    { label: "Operations", items: [
      { id: "inventory", label: "Inventory & POs", icon: Truck },
      { id: "sales", label: "Sales History", icon: Receipt },
      { id: "expenses", label: "Expenses", icon: DollarSign },
    ] },
    { label: "Workspace", items: [
      { id: "team", label: "Team & Roles", icon: ShieldCheck },
      { id: "settings", label: "Business Settings", icon: Settings },
    ] },
    ...(user.role === "admin" ? [{ label: "Administration", items: [{ id: "superadmin", label: "Super Admin", icon: Store }] }] : []),
  ];

  return (
    <div className="omnipos-app min-h-screen bg-[#f8fafc] text-[#0f172a] flex">
      {/* Grouped premium sidebar */}
      <aside className={`omnipos-sidebar shrink-0 border-r border-slate-200 bg-white flex flex-col transition-[width] duration-300 max-[767px]:w-[84px] ${sidebarCollapsed ? "w-[84px]" : "w-[280px]"}`}>
        <div className={`flex h-[88px] items-center border-b border-slate-100 ${sidebarCollapsed ? "justify-center px-3" : "gap-3 px-5"}`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-sm font-black tracking-tight text-white shadow-[0_8px_18px_rgba(15,23,42,0.16)]">OP</div>
          {!sidebarCollapsed && <div className="min-w-0 max-[767px]:hidden"><p className="truncate text-[15px] font-black tracking-[-0.02em] text-[#0f172a]">{businessName}</p><div className="mt-1 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0f766e]" /><span className="truncate text-[11px] font-bold text-[#0f766e]">{currentRole}</span></div></div>}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          {navGroups.map(group => (
            <div key={group.label} className="mb-7 last:mb-0">
              {!sidebarCollapsed && <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 max-[767px]:hidden">{group.label}</p>}
              <div className="space-y-1.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      aria-label={item.label}
                      className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[13px] font-bold transition-all duration-200 max-[767px]:justify-center ${sidebarCollapsed ? "justify-center" : ""} ${active ? "bg-[#0f172a] text-white shadow-[0_10px_20px_rgba(15,23,42,0.14)]" : "text-slate-500 hover:bg-slate-50 hover:text-[#0f172a]"}`}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#f9735b]" />}
                      <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? "text-[#f9735b]" : "text-slate-400 group-hover:text-[#0f766e]"}`} />
                      {!sidebarCollapsed && <span className="truncate max-[767px]:hidden">{item.label}</span>}
                      {!sidebarCollapsed && item.id === "superadmin" && <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider max-[767px]:hidden ${active ? "bg-white/10 text-white/80" : "bg-[#fff1ec] text-[#c2412d]"}`}>Admin</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 p-3">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`mb-2 flex h-9 w-full items-center gap-2 rounded-xl px-3 text-[11px] font-black text-slate-400 transition hover:bg-slate-50 hover:text-[#0f172a] ${sidebarCollapsed ? "justify-center px-0" : ""}`} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}><SlidersHorizontal className={`h-4 w-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />{!sidebarCollapsed && <span className="max-[767px]:hidden">Collapse</span>}</button>
          <div className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f766e] text-xs font-black text-white"><span>{user.name?.charAt(0).toUpperCase()}</span><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-50 bg-[#36b37e]" /></div>
            {!sidebarCollapsed && <div className="min-w-0 flex-1 max-[767px]:hidden"><p className="truncate text-xs font-black text-[#0f172a]">{user.name}</p><p className="truncate text-[10px] font-medium text-slate-500">{user.email}</p></div>}
          </div>
          <Button variant="ghost" onClick={logout} className={`mt-2 h-10 w-full justify-start gap-2 rounded-xl text-slate-500 hover:bg-[#fff1ec] hover:text-[#c2412d] ${sidebarCollapsed ? "justify-center px-0" : "px-3"}`}><LogOut className="h-4 w-4" />{!sidebarCollapsed && <span className="text-xs font-bold max-[767px]:hidden">Sign Out</span>}</Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-[#203b42] bg-[#0d2630]/70 backdrop-blur px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[#c7d8d1] hover:bg-slate-700 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#f8f3e7] tracking-tight capitalize">
                {activeTab === "pos" ? "POS Cashier Terminal" : activeTab.replace("-", " & ")}
              </h2>
              <p className="text-xs text-[#9eb4ae]">Aura Coffee & Gourmet Market • Tenant Isolation Active</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9eb4ae]" />
              <Input
                placeholder="Global search products, orders..."
                className="pl-9 bg-[#07111F] border-[#203b42] w-64 text-xs text-[#f8f3e7]"
              />
            </div>
            <Button variant="outline" size="icon" className="border-[#203b42] bg-[#0d2630] text-[#c7d8d1] hover:bg-slate-800">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-[#203b42] bg-[#0d2630] text-[#c7d8d1] hover:bg-slate-800">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {activeTab === "pos" && <POSTerminalView />}
          {activeTab === "dashboard" && <TenantDashboardView />}
          {activeTab === "products" && <ProductCatalogView />}
          {activeTab === "inventory" && <InventoryManagementView />}
          {activeTab === "customers" && <CustomerDirectoryView />}
          {activeTab === "sales" && <SalesHistoryView />}
          {activeTab === "expenses" && <ExpenseTrackerView />}
          {activeTab === "team" && <TeamRolesView />}
          {activeTab === "settings" && <TenantSettingsView />}
          {activeTab === "superadmin" && user.role === "admin" && <SuperAdminView />}
        </main>
      </div>
    </div>
  );
}

function PublicHome({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#0f172a] selection:bg-[#0f172a] selection:text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f172a] text-sm font-black text-white shadow-lg">OP</div><div><p className="font-black tracking-tight">OmniPOS</p><p className="hidden text-[11px] text-slate-500 sm:block">The commerce operating system</p></div></div>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex"><a href="#features" className="transition hover:text-slate-950">Platform</a><a href="#workflow" className="transition hover:text-slate-950">Workflow</a><a href="#security" className="transition hover:text-slate-950">Security</a></nav>
        <div className="flex items-center gap-2 sm:gap-3"><button onClick={onLogin} className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950 sm:inline-flex">Sign in</button><button onClick={onRegister} className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-[#1e293b]">Start free</button></div>
      </header>
      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:gap-20 lg:pb-28 lg:pt-20">
          <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#0f766e]"><span className="h-2 w-2 rounded-full bg-[#f9735b]" /> Made for ambitious operators</div><h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">The calm operating system for your shop.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-slate-500">OmniPOS brings checkout, inventory, customer relationships, and decisions into one beautifully clear workspace built for daily momentum.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><button onClick={onRegister} className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-6 text-sm font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-[#1e293b]">Create your workspace <ChevronRight className="h-4 w-4" /></button><button onClick={onLogin} className="inline-flex h-13 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Sign in to demo</button></div><div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-500"><span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#0f766e]" /> PKR-ready checkout</span><span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#0f766e]" /> Multi-tenant by design</span></div></div>
          <div className="relative"><div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#dff4ef] via-transparent to-[#ffe5df] blur-2xl" /><div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.35)] sm:p-5"><div className="flex items-center justify-between border-b border-slate-100 pb-4"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-lg bg-[#0f172a] text-center text-[10px] font-black leading-7 text-white">OP</div><span className="text-xs font-black">Operations overview</span></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">Live workspace</span></div><div className="grid gap-3 py-4 sm:grid-cols-[1.15fr_0.85fr]"><div className="rounded-2xl bg-[#f7f8fa] p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-500">Today at a glance</p><p className="mt-1 text-2xl font-black tracking-tight">Make every sale count</p></div><BarChart3 className="h-5 w-5 text-[#0f766e]" /></div><div className="mt-5 h-28 rounded-xl bg-white p-3"><div className="flex h-full items-end gap-2"><span className="h-8 flex-1 rounded-t-md bg-[#d5eee8]" /><span className="h-14 flex-1 rounded-t-md bg-[#b9e4db]" /><span className="h-11 flex-1 rounded-t-md bg-[#8bcfc3]" /><span className="h-20 flex-1 rounded-t-md bg-[#0f766e]" /><span className="h-16 flex-1 rounded-t-md bg-[#f9735b]" /><span className="h-24 flex-1 rounded-t-md bg-[#0f172a]" /></div></div></div><div className="space-y-3"><div className="rounded-2xl bg-[#0f172a] p-4 text-white"><div className="flex items-center justify-between"><ShoppingBag className="h-5 w-5 text-[#f9735b]" /><span className="text-[10px] font-bold text-slate-400">POS terminal</span></div><p className="mt-6 text-lg font-black">Fast, focused checkout</p><p className="mt-1 text-xs leading-5 text-slate-400">Search products, build the order, finish confidently.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><Package className="h-5 w-5 text-[#0f766e]" /><span className="text-[10px] font-bold text-slate-400">Inventory</span></div><p className="mt-4 text-sm font-black">Always know what moves</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 w-3/4 rounded-full bg-[#0f766e]" /></div></div></div></div></div></div>
        </section>
        <section id="features" className="border-y border-slate-200 bg-white"><div className="mx-auto grid max-w-7xl gap-px bg-slate-200 px-5 sm:px-8 md:grid-cols-3"><div className="bg-white px-1 py-9 md:px-4"><Zap className="h-5 w-5 text-[#f9735b]" /><h3 className="mt-5 text-lg font-black">Checkout without friction</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">A cashier experience shaped around speed, search, smart carts, and clean receipts.</p></div><div className="bg-white px-1 py-9 md:px-8"><ShieldCheck className="h-5 w-5 text-[#0f766e]" /><h3 className="mt-5 text-lg font-black">Every business stays separate</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Tenants, roles, products, customers, and reports live inside secure business boundaries.</p></div><div className="bg-white px-1 py-9 md:px-8"><Receipt className="h-5 w-5 text-[#0f172a]" /><h3 className="mt-5 text-lg font-black">The complete picture</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Turn daily transactions into a clear view of revenue, stock, loyalty, and operations.</p></div></div></section>
        <section id="workflow" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-28"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#0f766e]">One connected workflow</p><h2 className="mt-4 max-w-md text-4xl font-black leading-tight tracking-tight">From first scan to next decision.</h2><p className="mt-5 max-w-md leading-7 text-slate-500">Give every role the right view without giving them the whole maze. OmniPOS keeps the operation clear for owners, cashiers, and inventory teams.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-sm font-black text-[#f9735b]">01</span><h3 className="mt-10 text-xl font-black">Sell</h3><p className="mt-2 text-sm leading-6 text-slate-500">Search by name, SKU, or barcode. Apply discounts. Collect cash, card, or transfer.</p></div><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-sm font-black text-[#0f766e]">02</span><h3 className="mt-10 text-xl font-black">Replenish</h3><p className="mt-2 text-sm leading-6 text-slate-500">Catch low stock early, adjust inventory, and create purchase orders before momentum slows.</p></div><div id="security" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2"><span className="text-sm font-black text-[#0f172a]">03</span><h3 className="mt-10 text-xl font-black">Understand</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">See the health of your business in one view with reporting that respects tenant boundaries and role permissions.</p></div></div></section>
        <section className="mx-5 mb-16 overflow-hidden rounded-[2rem] bg-[#0f172a] px-6 py-12 text-white sm:mx-8 sm:px-12 lg:mx-auto lg:max-w-7xl lg:py-16"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#f9735b]">Ready when you are</p><h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-tight">Make your next shift feel lighter.</h2></div><button onClick={onRegister} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#0f172a] transition hover:bg-[#fff1ec]">Create workspace <ChevronRight className="h-4 w-4" /></button></div></section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 pb-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>© 2026 OmniPOS. Commerce operations, clarified.</p><p>Secure multi-tenant POS for modern businesses.</p></footer>
    </div>
  );
}

function AuthScreen({ initialMode = "login", onBack, onAuthenticated }: { initialMode?: "login" | "register"; onBack?: () => void; onAuthenticated: () => Promise<unknown> }) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("Welcome back to OmniPOS.");
      await onAuthenticated();
    },
    onError: error => toast.error(error.message),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Workspace created. Welcome to OmniPOS.");
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

  return (
    <div className="min-h-screen bg-[#102c36] text-[#F8F3E7] grid lg:grid-cols-[1.1fr_0.9fr] selection:bg-emerald-400 selection:text-[#07111F]">
      <section className="hidden lg:flex relative overflow-hidden p-14 flex-col justify-between bg-[radial-gradient(circle_at_12%_10%,rgba(56,189,148,0.18),transparent_34%),linear-gradient(145deg,#0a1f2a_0%,#07111f_55%,#24311f_100%)] border-r border-[#1d3b3f]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-emerald-400/20" />
        <div className="absolute right-16 top-24 h-36 w-36 rounded-full border border-amber-300/20" />
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-400 text-[#07111F] flex items-center justify-center font-black shadow-xl shadow-emerald-400/20">OP</div>
          <div><p className="font-black tracking-tight text-lg">OmniPOS</p><p className="text-xs text-emerald-200/70">Commerce operations, clarified.</p></div>
        </div>
        <div className="relative max-w-xl">
          <Badge className="bg-amber-300/10 text-amber-200 border-amber-300/20 rounded-full px-3 py-1 mb-6">Built for modern retail teams</Badge>
          <h1 className="text-5xl font-black leading-[1.04] tracking-tight">Sell with confidence. Run the whole business from one calm workspace.</h1>
          <p className="mt-6 text-base leading-7 text-[#b6c8c5] max-w-lg">A focused POS terminal, live inventory, customer loyalty, and clean financial reporting designed for fast-moving shops and cafés.</p>
          <div className="mt-9 grid grid-cols-3 gap-3 max-w-lg">
            <div className="rounded-2xl border border-[#24454a] bg-[#0d2630]/70 p-4"><Zap className="h-5 w-5 text-amber-300" /><p className="mt-3 text-xs text-[#b6c8c5]">Fast checkout</p></div>
            <div className="rounded-2xl border border-[#24454a] bg-[#0d2630]/70 p-4"><ShieldCheck className="h-5 w-5 text-emerald-300" /><p className="mt-3 text-xs text-[#b6c8c5]">Tenant-safe</p></div>
            <div className="rounded-2xl border border-[#24454a] bg-[#0d2630]/70 p-4"><BarChart3 className="h-5 w-5 text-rose-300" /><p className="mt-3 text-xs text-[#b6c8c5]">Actionable data</p></div>
          </div>
        </div>
        <p className="relative text-xs text-[#78938f]">Secure workspace access for admins, cashiers, and inventory managers.</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10 bg-[#f6f2e8] text-[#12312f]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10"><div className="h-10 w-10 rounded-xl bg-[#0e8f78] text-[#f8f3e7] flex items-center justify-center font-black">OP</div><span className="font-black text-xl">OmniPOS</span></div>
          {onBack && <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-xs font-black text-[#5b706b] transition hover:text-[#0f172a]">← Back to overview</button>}
          <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0e8f78]">{mode === "login" ? "Welcome back" : "Start your workspace"}</p><h2 className="mt-2 text-3xl font-black tracking-tight">{mode === "login" ? "Sign in to OmniPOS" : "Create your business account"}</h2><p className="mt-2 text-sm text-[#5b706b]">{mode === "login" ? "Use your OmniPOS email and password to continue." : "Set up your PKR-ready POS workspace in a few steps."}</p></div>
          <div className="grid grid-cols-2 rounded-2xl bg-[#e8e7dc] p-1 mb-7">
            <button type="button" onClick={() => setMode("login")} className={`rounded-xl py-2.5 text-sm font-bold transition ${mode === "login" ? "bg-white text-[#12312f] shadow-sm" : "text-[#71827d]"}`}>Sign in</button>
            <button type="button" onClick={() => setMode("register")} className={`rounded-xl py-2.5 text-sm font-bold transition ${mode === "register" ? "bg-white text-[#12312f] shadow-sm" : "text-[#71827d]"}`}>Register</button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && <>
              <div><label className="text-xs font-bold text-[#35524c]">Your name</label><Input value={name} onChange={event => setName(event.target.value)} required placeholder="Ayesha Khan" className="mt-1 h-12 rounded-xl border-[#c8d4cc] bg-white text-[#12312f] placeholder:text-[#9aa9a3]" /></div>
              <div><label className="text-xs font-bold text-[#35524c]">Business name</label><Input value={businessName} onChange={event => setBusinessName(event.target.value)} required placeholder="Khan Mart & Café" className="mt-1 h-12 rounded-xl border-[#c8d4cc] bg-white text-[#12312f] placeholder:text-[#9aa9a3]" /></div>
            </>}
            <div><label className="text-xs font-bold text-[#35524c]">Email address</label><Input type="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="you@business.com" className="mt-1 h-12 rounded-xl border-[#c8d4cc] bg-white text-[#12312f] placeholder:text-[#9aa9a3]" /></div>
            <div><label className="text-xs font-bold text-[#35524c]">Password</label><Input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={mode === "register" ? 8 : 1} placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"} className="mt-1 h-12 rounded-xl border-[#c8d4cc] bg-white text-[#12312f] placeholder:text-[#9aa9a3]" /></div>
            {mode === "register" && <div><label className="text-xs font-bold text-[#35524c]">Confirm password</label><Input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} placeholder="Repeat password" className="mt-1 h-12 rounded-xl border-[#c8d4cc] bg-white text-[#12312f] placeholder:text-[#9aa9a3]" /></div>}
            <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl bg-[#0e8f78] hover:bg-[#087762] text-[#f8f3e7] font-black shadow-lg shadow-[#0e8f78]/20">{isPending ? "Please wait..." : mode === "login" ? "Sign in to workspace" : "Create PKR workspace"}</Button>
          </form>
          <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[#cbd7ce] bg-[#eef1e8] p-4"><ShieldCheck className="h-5 w-5 mt-0.5 text-[#0e8f78] shrink-0" /><p className="text-xs leading-5 text-[#5b706b]">Direct OmniPOS accounts use secure server-side password hashing and an httpOnly session. No external Manus sign-in is required for this workspace.</p></div>
        </div>
      </section>
    </div>
  );
}

function POSTerminalView() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [cart, setCart] = useState<Array<{ product: any; quantity: number }>>([]);
  const [discount, setDiscount] = useState("0");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | "other">("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [heldOrders, setHeldOrders] = useState<Array<{ id: string; cart: any[]; customerId: number | null; time: string }>>([]);

  const { data: categories = [] } = trpc.catalog.categories.useQuery();
  const { data: products = [] } = trpc.catalog.products.useQuery({ query: search, categoryId: selectedCategory });
  const { data: customers = [] } = trpc.customers.list.useQuery();

  const checkoutMutation = trpc.pos.checkout.useMutation({
    onSuccess: (res) => {
      setCheckoutResult(res);
      setPaymentModalOpen(false);
      setCart([]);
      setAmountReceived("");
      toast.success(`Sale completed successfully! (${res.saleNumber})`);
    },
    onError: err => toast.error(err.message)
  });

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.product.discountPrice ?? item.product.sellingPrice) * item.quantity, 0), [cart]);
  const discountVal = Number(discount) || 0;
  const taxable = Math.max(0, subtotal - discountVal);
  const tax = taxable * 0.18;
  const total = taxable + tax;
  const receivedNum = Number(amountReceived) || 0;
  const changeDue = Math.max(0, receivedNum - total);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error("Cannot exceed available stock.");
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stockQuantity <= 0) {
        toast.error("Product is out of stock.");
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const next = item.quantity + delta;
        if (next <= 0) return null;
        if (next > item.product.stockQuantity) {
          toast.error("Exceeds stock limit.");
          return item;
        }
        return { ...item, quantity: next };
      }
      return item;
    }).filter(Boolean) as any);
  };

  const holdCurrentOrder = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: `HOLD-${Date.now().toString(36).toUpperCase()}`,
      cart,
      customerId: selectedCustomerId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHeldOrders(prev => [...prev, newHold]);
    setCart([]);
    setSelectedCustomerId(null);
    toast.success("Order placed on hold.");
  };

  const resumeOrder = (holdId: string) => {
    const found = heldOrders.find(h => h.id === holdId);
    if (!found) return;
    setCart(found.cart);
    setSelectedCustomerId(found.customerId);
    setHeldOrders(prev => prev.filter(h => h.id !== holdId));
    toast.success(`Resumed order ${holdId}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 xl:gap-8 h-full min-h-0">
      {/* Left / Main Product Grid Area */}
      <div className="lg:col-span-7 flex flex-col gap-4 min-w-0">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#9eb4ae]" />
            <Input
              placeholder="Search by name, SKU, or barcode (e.g. COF-ETH-01)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-[#0d2630] border-[#203b42] text-[#f8f3e7] h-11 rounded-xl shadow-sm"
            />
          </div>
          {heldOrders.length > 0 && (
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
              {heldOrders.map(hold => (
                <Button key={hold.id} variant="outline" size="sm" onClick={() => resumeOrder(hold.id)} className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 shrink-0">
                  <Clock className="h-3.5 w-3.5 mr-1.5" /> Resume {hold.id} ({hold.cart.reduce((s, i) => s + i.quantity, 0)})
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={selectedCategory === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(undefined)}
            className={selectedCategory === undefined ? "bg-emerald-500 text-[#f8f3e7] rounded-xl" : "border-[#203b42] bg-[#0d2630] text-[#c7d8d1] rounded-xl hover:bg-slate-800"}
          >
            All Categories
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? "bg-emerald-500 text-[#f8f3e7] rounded-xl" : "border-[#203b42] bg-[#0d2630] text-[#c7d8d1] rounded-xl hover:bg-slate-800"}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:h-[calc(100vh-260px)] max-h-[680px] overflow-y-auto pr-1 pb-1">
          {products.map(product => (
            <Card
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-[#0d2630]/95 border-[#203b42] hover:border-emerald-500/20 cursor-pointer transition-all p-3.5 flex flex-col justify-between group shadow-lg rounded-2xl min-h-[220px]"
            >
              <div>
                <div className="h-32 rounded-xl bg-[#07111F] mb-3 flex items-center justify-center overflow-hidden border border-[#203b42]/80">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Tag className="h-8 w-8 text-slate-600" />
                  )}
                </div>
                <h4 className="font-semibold text-sm text-[#eef3ea] line-clamp-1">{product.name}</h4>
                <p className="text-xs text-[#9eb4ae] mt-0.5">SKU: {product.sku}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-emerald-300">₨{Number(product.sellingPrice).toFixed(2)}</span>
                <Badge variant={product.stockQuantity <= product.minStockLevel ? "destructive" : "secondary"} className="text-[10px] rounded-lg">
                  Stock: {product.stockQuantity}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Cart & Checkout Area */}
      <div className="lg:col-span-5 flex flex-col bg-[#0d2630]/95 border border-[#203b42] rounded-2xl p-4 sm:p-5 lg:p-6 shadow-2xl justify-between min-h-[520px] lg:min-h-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-[#203b42]">
            <div>
              <h3 className="font-bold text-[#f8f3e7] flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-300" /> Current Order
              </h3>
              <p className="text-xs text-[#9eb4ae] mt-0.5">Order #{Date.now().toString(36).toUpperCase()}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={holdCurrentOrder} disabled={cart.length === 0} className="border-slate-700 bg-slate-800 text-xs text-[#c7d8d1] hover:bg-slate-700">
                Hold
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-[#9eb4ae] hover:text-red-400 text-xs">
                Clear
              </Button>
            </div>
          </div>

          <div className="flex-1 max-h-[min(300px,34vh)] overflow-y-auto py-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-[#78938f] text-sm flex flex-col items-center gap-2">
                <ShoppingBag className="h-8 w-8 text-slate-700" />
                <p>Cart is empty. Click products to add.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between bg-[#07111F] p-3.5 rounded-xl border border-[#203b42]/80 shadow-sm">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-semibold text-[#d6e2db] truncate">{item.product.name}</p>
                    <p className="text-xs text-emerald-300 mt-1">₨{Number(item.product.sellingPrice).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-[#c7d8d1] hover:bg-slate-700 font-bold">-</button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-[#c7d8d1] hover:bg-slate-700 font-bold">+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[#203b42] pt-4 space-y-3 mt-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#9eb4ae]">Customer</span>
              <select
                value={selectedCustomerId ?? ""}
                onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                className="bg-[#07111F] border border-[#203b42] rounded-xl px-3 py-1.5 text-xs text-[#f8f3e7]"
              >
                <option value="">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.loyaltyPoints} pts)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-[#203b42] text-sm">
              <div className="flex justify-between text-[#9eb4ae]"><span>Subtotal</span><span>₨{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-[#9eb4ae]"><span>Tax (18%)</span><span>₨{tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-extrabold text-xl text-[#f8f3e7] pt-2 border-t border-[#203b42]">
                <span>TOTAL</span>
                <span className="text-emerald-300">₨{total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={() => setPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-bold h-12 shadow-lg shadow-emerald-500/25 rounded-xl text-base mt-2"
            >
              Pay ₨{total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="bg-[#0d2630] border-[#203b42] text-[#f8f3e7] max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#f8f3e7] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-300" /> Complete Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-3">
            <div className="bg-[#07111F] p-4 rounded-xl border border-[#203b42] text-center">
              <p className="text-xs text-[#9eb4ae] uppercase tracking-wider font-medium">Amount Due</p>
              <h3 className="text-3xl font-extrabold text-emerald-300 mt-1">₨{total.toFixed(2)}</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#9eb4ae] font-medium">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {(["cash", "card", "transfer", "other"] as const).map(m => (
                  <Button
                    key={m}
                    variant={paymentMethod === m ? "default" : "outline"}
                    onClick={() => setPaymentMethod(m)}
                    className={paymentMethod === m ? "bg-emerald-500 text-[#f8f3e7] capitalize" : "border-[#203b42] bg-[#07111F] text-[#c7d8d1] capitalize hover:bg-slate-800"}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <label className="text-xs text-[#9eb4ae] font-medium">Cash Received (PKR)</label>
                <Input
                  type="number"
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  className="bg-[#07111F] border-[#203b42] h-11 text-lg font-bold text-[#f8f3e7]"
                />
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-[#9eb4ae]">Change Due:</span>
                  <span className="font-bold text-emerald-300">₨{changeDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              onClick={() => checkoutMutation.mutate({ items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })), discount: 0, paymentMethod, amountReceived: receivedNum || total, customerId: selectedCustomerId })}
              disabled={checkoutMutation.isPending}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-bold h-12 shadow-lg shadow-emerald-500/25 rounded-xl"
            >
              Confirm & Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!checkoutResult} onOpenChange={() => setCheckoutResult(null)}>
        <DialogContent className="bg-[#0d2630] border-[#203b42] text-[#f8f3e7] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-300">
              <Printer className="h-5 w-5" /> Receipt Generated
            </DialogTitle>
          </DialogHeader>
          {checkoutResult && (
            <div className="space-y-4 font-mono text-xs bg-[#07111F] p-5 rounded-xl border border-[#203b42]">
              <div className="text-center pb-3 border-b border-[#203b42]">
                <p className="font-bold text-sm text-[#f8f3e7]">Aura Coffee & Gourmet</p>
                <p className="text-[#9eb4ae] mt-1">{checkoutResult.saleNumber}</p>
                <p className="text-[10px] text-[#78938f] mt-0.5">{new Date().toLocaleString()}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#c7d8d1]"><span>Subtotal</span><span>₨{checkoutResult.subtotal}</span></div>
                <div className="flex justify-between text-[#c7d8d1]"><span>Tax (18%)</span><span>₨{checkoutResult.tax}</span></div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-[#203b42] text-[#f8f3e7]"><span>TOTAL</span><span>₨{checkoutResult.total}</span></div>
                <div className="flex justify-between text-emerald-400 pt-1 font-semibold"><span>Change Returned</span><span>₨{checkoutResult.change}</span></div>
              </div>
              <div className="text-center pt-3 border-t border-[#203b42] text-[11px] text-[#9eb4ae] leading-relaxed">
                {checkoutResult.footer}
              </div>
              <Button onClick={() => setCheckoutResult(null)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-sans font-semibold mt-4 rounded-xl">
                Done & Next Sale
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TenantDashboardView() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: lowStock = [] } = trpc.dashboard.lowStock.useQuery();
  const { data: recentSales = [] } = trpc.dashboard.recentSales.useQuery();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Today's Sales</p>
          <h3 className="text-3xl font-extrabold text-emerald-300 mt-2">₨{Number(stats?.todaySales ?? 0).toFixed(2)}</h3>
          <p className="text-xs text-[#78938f] mt-1.5">{stats?.todayOrders ?? 0} orders completed today</p>
        </Card>
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Month-to-Date Revenue</p>
          <h3 className="text-3xl font-extrabold text-emerald-300 mt-2">₨{Number(stats?.monthSales ?? 0).toFixed(2)}</h3>
          <p className="text-xs text-[#78938f] mt-1.5">Active billing period</p>
        </Card>
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Active Products</p>
          <h3 className="text-3xl font-extrabold text-[#f8f3e7] mt-2">{stats?.products ?? 0}</h3>
          <p className="text-xs text-amber-400 mt-1.5">{stats?.lowStock ?? 0} low stock warnings</p>
        </Card>
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Registered Customers</p>
          <h3 className="text-3xl font-extrabold text-[#f8f3e7] mt-2">{stats?.customers ?? 0}</h3>
          <p className="text-xs text-[#78938f] mt-1.5">Loyalty points enabled</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <h3 className="font-bold text-[#f8f3e7] mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" /> Low Stock Alerts
          </h3>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-[#78938f] text-center py-8">All inventory levels are optimal.</p>
            ) : (
              lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-[#07111F] p-4 rounded-xl border border-[#203b42]">
                  <div>
                    <p className="text-sm font-semibold text-[#f8f3e7]">{p.name}</p>
                    <p className="text-xs text-[#9eb4ae]">SKU: {p.sku}</p>
                  </div>
                  <Badge variant="destructive" className="rounded-lg">Stock: {p.stockQuantity}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <h3 className="font-bold text-[#f8f3e7] mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-300" /> Recent Transactions
          </h3>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-[#78938f] text-center py-8">No sales recorded today.</p>
            ) : (
              recentSales.map(item => (
                <div key={item.sale.id} className="flex items-center justify-between bg-[#07111F] p-4 rounded-xl border border-[#203b42]">
                  <div>
                    <p className="text-sm font-semibold text-[#f8f3e7]">{item.sale.saleNumber}</p>
                    <p className="text-xs text-[#9eb4ae]">{item.customer?.name ?? "Walk-in Customer"} • {item.sale.paymentMethod.toUpperCase()}</p>
                  </div>
                  <span className="font-extrabold text-emerald-300">₨{Number(item.sale.total).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProductCatalogView() {
  const { data: products = [] } = trpc.catalog.products.useQuery();
  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const createMutation = trpc.catalog.createProduct.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully!");
      setOpenNew(false);
      setName("");
      setSku("");
      setPrice("");
      setStock("");
    },
    onError: err => toast.error(err.message)
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-[#f8f3e7]">Product Catalog Management</h3>
          <p className="text-xs text-[#9eb4ae] mt-1">Manage pricing, SKUs, and stock thresholds across inventory.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-semibold rounded-xl shadow-lg shadow-emerald-500/25">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d2630] border-[#203b42] text-[#f8f3e7] rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#f8f3e7]">Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">Product Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Organic Espresso Beans" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">SKU</label>
                <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU-ESP-01" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#9eb4ae] font-medium">Selling Price (PKR)</label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="14.99" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
                </div>
                <div>
                  <label className="text-xs text-[#9eb4ae] font-medium">Initial Stock</label>
                  <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="50" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
                </div>
              </div>
              <Button
                onClick={() => createMutation.mutate({ name, sku, costPrice: 0, sellingPrice: Number(price) || 0, stockQuantity: Number(stock) || 0, minStockLevel: 5 })}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-bold h-12 shadow-lg shadow-emerald-500/25 rounded-xl mt-4"
              >
                Save Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#203b42] text-[#9eb4ae] text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Product</th>
                <th className="pb-3 font-semibold">SKU</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold">Stock</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-[#07111F]/40 transition-colors">
                  <td className="py-4 font-semibold text-[#f8f3e7] flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : <Tag className="h-4 w-4 text-[#78938f]" />}
                    </div>
                    <span>{p.name}</span>
                  </td>
                  <td className="py-4 text-[#9eb4ae] font-mono text-xs">{p.sku}</td>
                  <td className="py-4 font-bold text-emerald-300">₨{Number(p.sellingPrice).toFixed(2)}</td>
                  <td className="py-4 font-semibold">{p.stockQuantity}</td>
                  <td className="py-4">
                    <Badge variant={p.stockQuantity <= p.minStockLevel ? "destructive" : "secondary"} className="rounded-lg">
                      {p.stockQuantity <= p.minStockLevel ? "Low Stock" : "In Stock"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function InventoryManagementView() {
  const { data: lowStock = [] } = trpc.inventory.lowStock.useQuery();
  const { data: purchases = [] } = trpc.purchases.list.useQuery();
  const { data: suppliers = [] } = trpc.suppliers.list.useQuery();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Low Stock Items</p>
          <h3 className="text-3xl font-extrabold text-amber-400 mt-2">{lowStock.length}</h3>
          <p className="text-xs text-[#78938f] mt-1.5">Require replenishment</p>
        </Card>
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Active Suppliers</p>
          <h3 className="text-3xl font-extrabold text-[#f8f3e7] mt-2">{suppliers.length}</h3>
          <p className="text-xs text-[#78938f] mt-1.5">Wholesale partners</p>
        </Card>
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Purchase Orders</p>
          <h3 className="text-3xl font-extrabold text-emerald-300 mt-2">{purchases.length}</h3>
          <p className="text-xs text-[#78938f] mt-1.5">Logged in system</p>
        </Card>
      </div>

      <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
        <h3 className="font-bold text-[#f8f3e7] mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-emerald-300" /> Purchase Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#203b42] text-[#9eb4ae] text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">PO Number</th>
                <th className="pb-3 font-semibold">Supplier</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Total Cost</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {purchases.map(({ purchase, supplier }) => (
                <tr key={purchase.id} className="hover:bg-[#07111F]/40 transition-colors">
                  <td className="py-4 font-semibold text-[#f8f3e7]">{purchase.purchaseNumber}</td>
                  <td className="py-4 text-[#c7d8d1]">{supplier?.name ?? "Direct Supplier"}</td>
                  <td className="py-4">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg capitalize">
                      {purchase.status}
                    </Badge>
                  </td>
                  <td className="py-4 font-bold text-emerald-300">₨{Number(purchase.total).toFixed(2)}</td>
                  <td className="py-4 text-[#9eb4ae] text-xs">{new Date(purchase.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CustomerDirectoryView() {
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Customer added successfully!");
      setOpenNew(false);
      setName("");
      setEmail("");
      setPhone("");
    },
    onError: err => toast.error(err.message)
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-[#f8f3e7]">Customer Directory & Loyalty</h3>
          <p className="text-xs text-[#9eb4ae] mt-1">Track reward points, lifetime spend, and contact details.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-semibold rounded-xl shadow-lg shadow-emerald-500/25">
              <Plus className="h-4 w-4 mr-2" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d2630] border-[#203b42] text-[#f8f3e7] rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#f8f3e7]">New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Eleanor Vance" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">Email Address</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="eleanor@example.com" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">Phone Number</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555-0191" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
              </div>
              <Button onClick={() => createMutation.mutate({ name, email, phone })} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-bold h-12 shadow-lg shadow-emerald-500/25 rounded-xl mt-4">
                Save Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#203b42] text-[#9eb4ae] text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Customer Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Phone</th>
                <th className="pb-3 font-semibold">Loyalty Points</th>
                <th className="pb-3 font-semibold">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-[#07111F]/40 transition-colors">
                  <td className="py-4 font-semibold text-[#f8f3e7]">{c.name}</td>
                  <td className="py-4 text-[#9eb4ae]">{c.email || "-"}</td>
                  <td className="py-4 text-[#9eb4ae]">{c.phone || "-"}</td>
                  <td className="py-4 font-bold text-emerald-300">{c.loyaltyPoints} pts</td>
                  <td className="py-4 font-extrabold text-[#f8f3e7]">₨{Number(c.totalSpent).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SalesHistoryView() {
  const { data: recentSales = [] } = trpc.dashboard.recentSales.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-[#f8f3e7]">Sales History & Transactions</h3>
        <p className="text-xs text-[#9eb4ae] mt-1">Audit completed transactions, payment methods, and receipts.</p>
      </div>

      <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#203b42] text-[#9eb4ae] text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Order Number</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Payment Method</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {recentSales.map(item => (
                <tr key={item.sale.id} className="hover:bg-[#07111F]/40 transition-colors">
                  <td className="py-4 font-semibold text-[#f8f3e7]">{item.sale.saleNumber}</td>
                  <td className="py-4 text-[#c7d8d1]">{item.customer?.name ?? "Walk-in Customer"}</td>
                  <td className="py-4 uppercase text-xs font-semibold text-emerald-300">{item.sale.paymentMethod}</td>
                  <td className="py-4 font-extrabold text-[#f8f3e7]">₨{Number(item.sale.total).toFixed(2)}</td>
                  <td className="py-4 text-[#9eb4ae] text-xs">{new Date(item.sale.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ExpenseTrackerView() {
  const { data: expenses = [] } = trpc.expenses.list.useQuery();
  const [openNew, setOpenNew] = useState(false);
  const [category, setCategory] = useState("Rent & Utilities");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Expense recorded successfully!");
      setOpenNew(false);
      setAmount("");
      setNotes("");
    },
    onError: err => toast.error(err.message)
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-[#f8f3e7]">Business Expense Tracker</h3>
          <p className="text-xs text-[#9eb4ae] mt-1">Monitor operational overhead and category expenses.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-semibold rounded-xl shadow-lg shadow-emerald-500/25">
              <Plus className="h-4 w-4 mr-2" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d2630] border-[#203b42] text-[#f8f3e7] rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#f8f3e7]">Record Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#07111F] border border-[#203b42] rounded-xl px-3 py-2 text-sm text-[#f8f3e7] mt-1"
                >
                  <option value="Rent & Utilities">Rent & Utilities</option>
                  <option value="Marketing & Ads">Marketing & Ads</option>
                  <option value="Equipment Maintenance">Equipment Maintenance</option>
                  <option value="Staff Payroll">Staff Payroll</option>
                  <option value="Packaging & Supplies">Packaging & Supplies</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">Amount (PKR)</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="250.00" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">Notes</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Monthly utility bill" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
              </div>
              <Button onClick={() => createMutation.mutate({ category, amount: Number(amount) || 0, notes })} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-bold h-12 shadow-lg shadow-emerald-500/25 rounded-xl mt-4">
                Save Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#203b42] text-[#9eb4ae] text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Notes</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-[#07111F]/40 transition-colors">
                  <td className="py-4 font-semibold text-[#f8f3e7]">{e.category}</td>
                  <td className="py-4 text-[#9eb4ae]">{e.notes || "-"}</td>
                  <td className="py-4 font-bold text-rose-300">₨{Number(e.amount).toFixed(2)}</td>
                  <td className="py-4 text-[#9eb4ae] text-xs">{new Date(e.expenseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TeamRolesView() {
  const { data: team = [] } = trpc.team.list.useQuery();
  const [openInvite, setOpenInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"cashier" | "inventory_manager">("cashier");

  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success("Team member added successfully!");
      setOpenInvite(false);
      setEmail("");
      setName("");
    },
    onError: err => toast.error(err.message)
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-[#f8f3e7]">Team & Role Permissions</h3>
          <p className="text-xs text-[#9eb4ae] mt-1">Manage staff access across Tenant Admin, Cashier, and Inventory Manager roles.</p>
        </div>
        <Dialog open={openInvite} onOpenChange={setOpenInvite}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-semibold rounded-xl shadow-lg shadow-emerald-500/25">
              <Plus className="h-4 w-4 mr-2" /> Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d2630] border-[#203b42] text-[#f8f3e7] rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#f8f3e7]">Assign Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">User Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Connor" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">Email (Must have signed in once)</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-[#9eb4ae] font-medium">Assigned Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-[#07111F] border border-[#203b42] rounded-xl px-3 py-2 text-sm text-[#f8f3e7] mt-1"
                >
                  <option value="cashier">Cashier</option>
                  <option value="inventory_manager">Inventory Manager</option>
                </select>
              </div>
              <Button onClick={() => inviteMutation.mutate({ name, email, role })} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-bold h-12 shadow-lg shadow-emerald-500/25 rounded-xl mt-4">
                Assign Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#203b42] text-[#9eb4ae] text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Staff Member</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Assigned Role</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {team.map(({ membership, user }) => (
                <tr key={membership.id} className="hover:bg-[#07111F]/40 transition-colors">
                  <td className="py-4 font-semibold text-[#f8f3e7]">{user.name}</td>
                  <td className="py-4 text-[#9eb4ae]">{user.email}</td>
                  <td className="py-4 font-semibold text-emerald-300 uppercase text-xs">{membership.role.replace("_", " ")}</td>
                  <td className="py-4">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg">
                      {membership.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TenantSettingsView() {
  const { data: settings } = trpc.tenant.settings.useQuery();
  const [name, setName] = useState(settings?.name ?? "");
  const [businessType, setBusinessType] = useState(settings?.businessType ?? "Retail");
  const [currency, setCurrency] = useState(settings?.currency ?? "USD");
  const [taxRate, setTaxRate] = useState(settings?.taxRate?.toString() ?? "8.25");
  const [receiptFooter, setReceiptFooter] = useState(settings?.receiptFooter ?? "");

  const updateMutation = trpc.tenant.updateSettings.useMutation({
    onSuccess: () => toast.success("Business settings updated successfully!"),
    onError: err => toast.error(err.message)
  });

  return (
    <Card className="bg-[#0d2630]/95 border-[#203b42] p-8 max-w-2xl rounded-2xl shadow-2xl">
      <h3 className="text-xl font-bold text-[#f8f3e7] mb-2">Business Settings & Branding</h3>
      <p className="text-xs text-[#9eb4ae] mb-6">Configure receipt footer messages, tax rates, currency, and store details.</p>
      <div className="space-y-5">
        <div>
          <label className="text-xs text-[#9eb4ae] font-medium">Business Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#9eb4ae] font-medium">Business Type</label>
            <Input value={businessType} onChange={e => setBusinessType(e.target.value)} className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
          </div>
          <div>
            <label className="text-xs text-[#9eb4ae] font-medium">Currency</label>
            <Input value={currency} onChange={e => setCurrency(e.target.value)} className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
          </div>
        </div>
        <div>
          <label className="text-xs text-[#9eb4ae] font-medium">Default Tax Rate (%)</label>
          <Input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
        </div>
        <div>
          <label className="text-xs text-[#9eb4ae] font-medium">Receipt Footer Message</label>
          <Input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} placeholder="Thank you for your visit!" className="bg-[#07111F] border-[#203b42] mt-1 rounded-xl h-11" />
        </div>
        <Button onClick={() => updateMutation.mutate({ name, businessType, currency, taxRate: Number(taxRate) || 0, receiptFooter })} className="bg-emerald-500 hover:bg-emerald-400 text-[#f8f3e7] font-bold h-12 shadow-lg shadow-emerald-500/25 rounded-xl mt-4">
          Save Settings
        </Button>
      </div>
    </Card>
  );
}

function SuperAdminView() {
  const utils = trpc.useUtils();
  const { data: stats } = trpc.admin.platformStats.useQuery();
  const { data: tenants = [] } = trpc.admin.tenants.useQuery();
  const statusMutation = trpc.admin.setTenantStatus.useMutation({
    onSuccess: async () => {
      toast.success("Organization status updated successfully!");
      await Promise.all([
        utils.admin.tenants.invalidate(),
        utils.admin.platformStats.invalidate(),
      ]);
    },
    onError: err => toast.error(err.message)
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Total Businesses</p>
          <h3 className="text-3xl font-extrabold text-emerald-300 mt-2">{stats?.tenants ?? 0}</h3>
        </Card>
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Active Businesses</p>
          <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">{stats?.activeTenants ?? 0}</h3>
        </Card>
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Platform Users</p>
          <h3 className="text-3xl font-extrabold text-[#f8f3e7] mt-2">{stats?.users ?? 0}</h3>
        </Card>
        <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#9eb4ae] font-medium">Platform Gross Revenue</p>
          <h3 className="text-3xl font-extrabold text-emerald-300 mt-2">₨{Number(stats?.revenue ?? 0).toFixed(2)}</h3>
        </Card>
      </div>

      <Card className="bg-[#0d2630]/95 border-[#203b42] p-6 rounded-2xl shadow-xl">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="font-bold text-[#f8f3e7]">Organization management</h3><p className="mt-1 text-xs text-[#9eb4ae]">Approve new businesses, pause access, or reactivate an organization without crossing tenant data boundaries.</p></div><Badge className="w-fit rounded-full bg-emerald-500/10 text-emerald-300">Super Admin controls</Badge></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#203b42] text-[#9eb4ae] text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Business Name</th>
                <th className="pb-3 font-semibold">Owner</th>
                <th className="pb-3 font-semibold">Business Type</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tenants.map(({ tenant, owner }) => (
                <tr key={tenant.id} className="hover:bg-[#07111F]/40 transition-colors">
                  <td className="py-4 font-semibold text-[#f8f3e7]">{tenant.name}</td>
                  <td className="py-4 text-[#9eb4ae]">{owner.name} ({owner.email})</td>
                  <td className="py-4">{tenant.businessType}</td>
                  <td className="py-4">
                    <Badge variant={tenant.status === "active" ? "default" : "destructive"} className="rounded-lg">
                      {tenant.status}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => statusMutation.mutate({ tenantId: tenant.id, status: tenant.status === "active" ? "suspended" : "active" })}
                      className="border-slate-200 bg-white text-xs rounded-xl text-slate-700 hover:bg-slate-50"
                    >
                      {tenant.status === "active" ? "Suspend organization" : tenant.status === "suspended" ? "Reactivate organization" : "Approve organization"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
