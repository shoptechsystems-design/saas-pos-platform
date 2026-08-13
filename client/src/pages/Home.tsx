import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, useMemo } from "react";
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
  Loader2,
  Clock,
  FolderPlus,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Database,
  HelpCircle,
  Bell
} from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, logout, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === "admin" ? "superadmin" : "pos");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [publicView, setPublicView] = useState<"home" | "auth">("home");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authBootstrapTimedOut, setAuthBootstrapTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setAuthBootstrapTimedOut(false);
      return;
    }
    const timeoutId = window.setTimeout(() => setAuthBootstrapTimedOut(true), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [loading]);

  const { data: tenantCtx } = trpc.tenant.context.useQuery(undefined, { enabled: !!user && user?.role !== "admin" });
  const { data: tenantSettings } = trpc.tenant.settings.useQuery(undefined, { enabled: !!user && user?.role !== "admin" });

  if (loading && !authBootstrapTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#0f172a] flex items-center justify-center shadow-xl animate-pulse">
            <Store className="h-6 w-6 text-[#f8f3e7]" />
          </div>
          <p className="text-sm font-medium tracking-wide text-slate-500">Loading OmniPOS Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return publicView === "home"
      ? <PublicHome onLogin={() => { setAuthMode("login"); setPublicView("auth"); }} onRegister={() => { setAuthMode("register"); setPublicView("auth"); }} />
      : <AuthScreen initialMode={authMode} onBack={() => setPublicView("home")} onAuthenticated={refresh} />;
  }

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

  const navGroups = user.role === "admin" ? [
    { label: "Platform Administration", items: [{ id: "superadmin", label: "Super Admin Console", icon: Store }] }
  ] : [
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
      { id: "masterdata", label: "Master Data", icon: Database },
      { id: "team", label: "Team & Roles", icon: ShieldCheck },
      { id: "settings", label: "Business Settings", icon: Settings },
    ] },
  ];

  return (
    <div className="omnipos-app min-h-screen bg-[#f8fafc] text-[#0f172a] flex">
      {/* Grouped premium sidebar */}
      <aside className={`omnipos-sidebar shrink-0 border-r border-slate-200 bg-white flex flex-col transition-[width] duration-300 max-[767px]:w-[84px] ${sidebarCollapsed ? "w-[84px]" : "w-[280px]"}`}>
        <div className={`flex h-[88px] items-center border-b border-slate-100 ${sidebarCollapsed ? "justify-center px-3" : "gap-3 px-5"}`}>
          {tenantSettings?.logoUrl ? (
            <img src={tenantSettings.logoUrl.startsWith('/') ? tenantSettings.logoUrl : tenantSettings.logoUrl} alt="Store logo" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl object-cover shadow-[0_8px_18px_rgba(15,23,42,0.16)] border border-slate-200 bg-white" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-white font-black text-sm shadow-[0_8px_18px_rgba(15,23,42,0.16)]">
              {tenantSettings?.name ? tenantSettings.name.charAt(0).toUpperCase() : "OP"}
            </div>
          )}
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
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f766e] text-xs font-black text-white"><span>{user.name?.charAt(0).toUpperCase()}</span><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-50 bg-[#f9735b]" /></div>
            {!sidebarCollapsed && <div className="min-w-0 flex-1 max-[767px]:hidden"><p className="truncate text-xs font-black text-[#0f172a]">{user.name}</p><p className="truncate text-[10px] font-medium text-slate-500">{user.email}</p></div>}
          </div>
          <Button variant="ghost" onClick={logout} className={`mt-2 h-10 w-full justify-start gap-2 rounded-xl text-slate-500 hover:bg-[#fff1ec] hover:text-[#c2412d] ${sidebarCollapsed ? "justify-center px-0" : "px-3"}`}><LogOut className="h-4 w-4" />{!sidebarCollapsed && <span className="text-xs font-bold max-[767px]:hidden">Sign Out</span>}</Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#0f172a] tracking-tight capitalize">
                {activeTab === "pos" ? "POS Cashier Terminal" : activeTab.replace("-", " & ")}
              </h2>
              <p className="text-xs text-slate-500">{businessName} • Tenant Isolation Active</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Global search products, orders..."
                className="pl-9 bg-white border-slate-200 w-64 text-xs text-[#0f172a] shadow-sm"
              />
            </div>
            <Button variant="outline" size="icon" className="border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {user.role === "admin" ? (
            <SuperAdminView />
          ) : (
            <>
              {activeTab === "pos" && <POSTerminalView setActiveTab={setActiveTab} />}
              {activeTab === "dashboard" && <TenantDashboardView />}
              {activeTab === "products" && <ProductCatalogView />}
              {activeTab === "inventory" && <InventoryManagementView />}
              {activeTab === "customers" && <CustomerDirectoryView />}
              {activeTab === "sales" && <SalesHistoryView />}
              {activeTab === "expenses" && <ExpenseTrackerView />}
              {activeTab === "team" && <TeamRolesView />}
              {activeTab === "masterdata" && <MasterDataView />}
              {activeTab === "settings" && <TenantSettingsView />}
            </>
          )}
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
      toast.success("Welcome back to OmniPOS.");
      await onAuthenticated();
    },
    onError: error => toast.error(error.message),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async result => {
      authUtils.auth.me.setData(undefined, result.user);
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
    <div className="min-h-screen bg-[#102c36] text-[#F8F3E7] grid lg:grid-cols-[1.1fr_0.9fr] selection:bg-[#0f172a] selection:text-[#07111F]">
      <section className="hidden lg:flex relative overflow-hidden p-14 flex-col justify-between bg-[radial-gradient(circle_at_12%_10%,rgba(15,118,110,0.18),transparent_34%),linear-gradient(145deg,#0a1f2a_0%,#07111f_55%,#1e293b_100%)] border-r border-[#1d3b3f]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-slate-400/20" />
        <div className="absolute right-16 top-24 h-36 w-36 rounded-full border border-amber-300/20" />
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-[#0f172a] text-[#07111F] flex items-center justify-center font-black shadow-xl shadow-slate-900/20">OP</div>
          <div><p className="font-black tracking-tight text-lg">OmniPOS</p><p className="text-xs text-slate-300/70">Commerce operations, clarified.</p></div>
        </div>
        <div className="relative max-w-xl">
          <Badge className="bg-amber-300/10 text-amber-200 border-amber-300/20 rounded-full px-3 py-1 mb-6">Built for modern retail teams</Badge>
          <h1 className="text-5xl font-black leading-[1.04] tracking-tight">Sell with confidence. Run the whole business from one calm workspace.</h1>
          <p className="mt-6 text-base leading-7 text-[#b6c8c5] max-w-lg">A focused POS terminal, live inventory, customer loyalty, and clean financial reporting designed for fast-moving shops and cafés.</p>
          <div className="mt-9 grid grid-cols-3 gap-3 max-w-lg">
            <div className="rounded-2xl border border-[#24454a] bg-[#0d2630]/70 p-4"><Zap className="h-5 w-5 text-amber-300" /><p className="mt-3 text-xs text-[#b6c8c5]">Fast checkout</p></div>
            <div className="rounded-2xl border border-[#24454a] bg-[#0d2630]/70 p-4"><ShieldCheck className="h-5 w-5 text-[#0f766e]" /><p className="mt-3 text-xs text-[#b6c8c5]">Tenant-safe</p></div>
            <div className="rounded-2xl border border-[#24454a] bg-[#0d2630]/70 p-4"><BarChart3 className="h-5 w-5 text-rose-300" /><p className="mt-3 text-xs text-[#b6c8c5]">Actionable data</p></div>
          </div>
        </div>
        <p className="relative text-xs text-[#78938f]">Secure workspace access for admins, cashiers, and inventory managers.</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10 bg-[#f6f2e8] text-[#12312f]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10"><div className="h-10 w-10 rounded-xl bg-[#0f172a] text-[#f8f3e7] flex items-center justify-center font-black">OP</div><span className="font-black text-xl">OmniPOS</span></div>
          {onBack && <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-xs font-black text-[#5b706b] transition hover:text-[#0f172a]">← Back to overview</button>}
          <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f766e]">{mode === "login" ? "Welcome back" : "Start your workspace"}</p><h2 className="mt-2 text-3xl font-black tracking-tight">{mode === "login" ? "Sign in to OmniPOS" : "Create your business account"}</h2><p className="mt-2 text-sm text-[#5b706b]">{mode === "login" ? "Use your OmniPOS email and password to continue." : "Set up your PKR-ready POS workspace in a few steps."}</p></div>
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
            <div>
              <label className="text-xs font-bold text-[#35524c]">Password</label>
              <div className="relative mt-1">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} required minLength={mode === "register" ? 8 : 1} placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"} className="h-12 rounded-xl border-[#c8d4cc] bg-white pr-11 text-[#12312f] placeholder:text-[#9aa9a3]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#12312f]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {mode === "register" && (
              <div>
                <label className="text-xs font-bold text-[#35524c]">Confirm password</label>
                <div className="relative mt-1">
                  <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} placeholder="Repeat password" className="h-12 rounded-xl border-[#c8d4cc] bg-white pr-11 text-[#12312f] placeholder:text-[#9aa9a3]" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#12312f]">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-[#f8f3e7] font-black shadow-lg shadow-slate-900/10">{isPending ? "Please wait..." : mode === "login" ? "Sign in to workspace" : "Create PKR workspace"}</Button>
          </form>
          <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[#cbd7ce] bg-[#eef1e8] p-4"><ShieldCheck className="h-5 w-5 mt-0.5 text-[#0f766e] shrink-0" /><p className="text-xs leading-5 text-[#5b706b]">Direct OmniPOS accounts use secure server-side password hashing and an httpOnly session. No external Manus sign-in is required for this workspace.</p></div>
        </div>
      </section>
    </div>
  );
}

function POSTerminalView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
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
  const { data: tenantSettings } = trpc.tenant.settings.useQuery();

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
            className={selectedCategory === undefined ? "bg-[#0f172a] text-[#f8f3e7] rounded-xl" : "border-[#203b42] bg-[#0d2630] text-[#c7d8d1] rounded-xl hover:bg-slate-800"}
          >
            All Categories
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? "bg-[#0f172a] text-[#f8f3e7] rounded-xl" : "border-[#203b42] bg-[#0d2630] text-[#c7d8d1] rounded-xl hover:bg-slate-800"}
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
              className="bg-[#0d2630]/95 border-[#203b42] hover:border-[#f9735b]/40 cursor-pointer transition-all p-3.5 flex flex-col justify-between group shadow-lg rounded-2xl min-h-[220px]"
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
                <span className="font-bold text-[#0f766e]">₨{Number(product.sellingPrice).toFixed(2)}</span>
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
                <ShoppingBag className="h-4 w-4 text-[#0f766e]" /> Current Order
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
                    <p className="text-xs text-[#0f766e] mt-1">₨{Number(item.product.sellingPrice).toFixed(2)} each</p>
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
              <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedCustomerId ?? ""}
                      onChange={e => {
                        if (e.target.value === "NEW_CUSTOMER") {
                          setActiveTab("customers");
                          return;
                        }
                        setSelectedCustomerId(e.target.value ? Number(e.target.value) : null);
                      }}
                      className="bg-[#07111F] border border-[#203b42] rounded-xl px-3 py-1.5 text-xs text-[#f8f3e7]"
                    >
                      <option value="">Walk-in Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.loyaltyPoints} pts)</option>
                      ))}
                      <option value="NEW_CUSTOMER">+ Add New Customer...</option>
                    </select>
                  </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-[#203b42] text-sm">
              <div className="flex justify-between text-[#9eb4ae]"><span>Subtotal</span><span>₨{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-[#9eb4ae]"><span>Tax (18%)</span><span>₨{tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-extrabold text-xl text-[#f8f3e7] pt-2 border-t border-[#203b42]">
                <span>TOTAL</span>
                <span className="text-[#0f766e]">₨{total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={() => setPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-[#f8f3e7] font-bold h-12 shadow-lg shadow-slate-900/10 rounded-xl text-base mt-2"
            >
              Pay ₨{total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-[#0f172a] max-w-md rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#0f766e]" /> Complete Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Amount Due</p>
              <h3 className="text-3xl font-black text-[#0f172a] mt-1">₨{total.toFixed(2)}</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-bold">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {(["cash", "card", "transfer", "other"] as const).map(m => (
                  <Button
                    key={m}
                    variant={paymentMethod === m ? "default" : "outline"}
                    onClick={() => setPaymentMethod(m)}
                    className={paymentMethod === m ? "bg-[#0f172a] text-white capitalize rounded-xl font-bold h-11" : "border-slate-200 bg-slate-50 text-slate-700 capitalize hover:bg-slate-100 rounded-xl font-medium h-11"}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold">Cash Received (PKR)</label>
                <Input
                  type="number"
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-50 border-slate-200 h-12 text-lg font-bold text-[#0f172a] rounded-xl"
                />
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-slate-500 font-medium">Change Due:</span>
                  <span className="font-bold text-[#0f766e]">₨{changeDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              onClick={() => checkoutMutation.mutate({ items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })), discount: 0, paymentMethod, amountReceived: receivedNum || total, customerId: selectedCustomerId })}
              disabled={checkoutMutation.isPending}
              className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-12 shadow-lg shadow-slate-900/10 rounded-xl"
            >
              Confirm & Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!checkoutResult} onOpenChange={() => setCheckoutResult(null)}>
        <DialogContent className="bg-white border-slate-200 text-[#0f172a] max-w-sm rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0f172a] font-bold text-lg">
              <Printer className="h-5 w-5 text-[#0f766e]" /> Receipt Generated
            </DialogTitle>
          </DialogHeader>
          {checkoutResult && (
            <div className="space-y-4 font-mono text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800">
              <div className="text-center pb-3 border-b border-slate-200 flex flex-col items-center gap-2">
                {tenantSettings?.logoUrl && (
                  <img src={tenantSettings.logoUrl} alt="Store Logo" className="h-12 max-w-[120px] object-contain rounded-lg shadow-sm" />
                )}
                <p className="font-bold text-sm text-[#0f172a]">{tenantSettings?.name || "OmniPOS Store"}</p>
                <p className="text-slate-500 text-xs">{checkoutResult.saleNumber}</p>
                <p className="text-[10px] text-slate-400">{new Date().toLocaleString()}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₨{checkoutResult.subtotal}</span></div>
                <div className="flex justify-between text-slate-600"><span>Tax (18%)</span><span>₨{checkoutResult.tax}</span></div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 text-[#0f172a]"><span>TOTAL</span><span>₨{checkoutResult.total}</span></div>
                <div className="flex justify-between text-[#0f766e] pt-1 font-semibold"><span>Change Returned</span><span>₨{checkoutResult.change}</span></div>
              </div>
              <div className="text-center pt-3 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed font-sans">
                {checkoutResult.footer}
              </div>
              <Button onClick={() => setCheckoutResult(null)} className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-sans font-bold mt-4 rounded-xl h-11 shadow-sm">
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
  const todaySales = Number(stats?.todaySales ?? 0);
  const monthSales = Number(stats?.monthSales ?? 0);
  const todayOrders = Number(stats?.todayOrders ?? 0);
  const activeProducts = Number(stats?.products ?? 0);
  const registeredCustomers = Number(stats?.customers ?? 0);
  const lowStockCount = Number(stats?.lowStock ?? lowStock.length);
  const averageOrder = todayOrders ? todaySales / todayOrders : 0;
  const healthPercent = activeProducts ? Math.max(0, Math.min(100, ((activeProducts - lowStockCount) / activeProducts) * 100)) : 0;

  const metricCards = [
    { label: "Today's sales", value: `₨${todaySales.toFixed(2)}`, helper: `${todayOrders} orders completed`, accent: "text-[#0f766e]", icon: Receipt },
    { label: "Month-to-date revenue", value: `₨${monthSales.toFixed(2)}`, helper: "Current billing period", accent: "text-[#0f172a]", icon: TrendingUp },
    { label: "Average order value", value: `₨${averageOrder.toFixed(2)}`, helper: "Based on today's sales", accent: "text-[#f9735b]", icon: ShoppingBag },
    { label: "Customer directory", value: registeredCustomers.toString(), helper: `${lowStockCount} low-stock alerts`, accent: "text-[#0f766e]", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0f766e]">Business overview</p><h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#0f172a]">Good morning, Aura Coffee.</h3><p className="mt-1 text-sm text-slate-500">Here’s what is happening across your workspace today.</p></div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">PKR • Live data</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, helper, accent, icon: Icon }) => <Card key={label} className="rounded-2xl border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-slate-500">{label}</p><p className={`mt-3 text-2xl font-black tracking-tight ${accent}`}>{value}</p></div><div className="rounded-xl bg-slate-50 p-2.5"><Icon className="h-4 w-4 text-slate-500" /></div></div><p className="mt-4 text-[11px] font-medium text-slate-400">{helper}</p></Card>)}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-slate-500">Revenue pulse</p><h4 className="mt-1 text-xl font-black tracking-tight text-[#0f172a]">Keep your operation in view.</h4></div><Badge className="rounded-full border border-[#d5eee8] bg-[#effaf7] text-[#0f766e]">Today</Badge></div><div className="mt-8 grid h-40 grid-cols-7 items-end gap-3 rounded-2xl bg-[#f8fafc] p-4">{[0.34,0.52,0.43,0.68,0.58,0.78, Math.max(0.12, Math.min(0.95, todaySales / Math.max(monthSales / 24, 1) / 10))].map((height, index) => <div key={index} className="group flex h-full flex-col justify-end gap-2"><div className={`w-full rounded-t-lg transition ${index === 6 ? "bg-[#0f172a]" : index === 4 ? "bg-[#f9735b]" : "bg-[#b9e4db]"}`} style={{ height: `${Math.round(height * 100)}%` }} /><span className="text-center text-[9px] font-bold text-slate-400">{["M","T","W","T","F","S","S"][index]}</span></div>)}</div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Month-to-date</p><p className="mt-1 text-lg font-black text-[#0f172a]">₨{monthSales.toFixed(2)}</p></div><div className="text-right"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Orders today</p><p className="mt-1 text-lg font-black text-[#0f766e]">{todayOrders}</p></div></div></Card>
        <Card className="rounded-2xl border-slate-200 bg-[#0f172a] p-6 text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)]"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-400">Operational health</p><h4 className="mt-1 text-xl font-black">Inventory readiness</h4></div><Package className="h-5 w-5 text-[#f9735b]" /></div><p className="mt-10 text-4xl font-black">{Math.round(healthPercent)}<span className="text-xl text-slate-400">%</span></p><p className="mt-1 text-xs text-slate-400">products above minimum stock</p><div className="mt-7 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#f9735b]" style={{ width: `${healthPercent}%` }} /></div><div className="mt-7 space-y-3 text-xs"><div className="flex items-center justify-between"><span className="text-slate-400">Active products</span><span className="font-black">{activeProducts}</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Low-stock alerts</span><span className="font-black text-[#f9735b]">{lowStockCount}</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Customers tracked</span><span className="font-black">{registeredCustomers}</span></div></div></Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-500">Needs attention</p><h4 className="mt-1 text-lg font-black text-[#0f172a]">Low-stock alerts</h4></div><AlertTriangle className="h-5 w-5 text-[#f9735b]" /></div><div className="space-y-2">{lowStock.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">All inventory levels are optimal.</p> : lowStock.slice(0, 5).map(p => <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3"><div><p className="text-sm font-bold text-[#0f172a]">{p.name}</p><p className="mt-0.5 text-[11px] text-slate-500">SKU: {p.sku}</p></div><Badge className="rounded-full border border-[#ffd9d2] bg-[#fff1ec] text-[#c2412d]">{p.stockQuantity} left</Badge></div>)}</div></Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-500">Latest activity</p><h4 className="mt-1 text-lg font-black text-[#0f172a]">Recent transactions</h4></div><Receipt className="h-5 w-5 text-[#0f766e]" /></div><div className="space-y-2">{recentSales.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No sales recorded today.</p> : recentSales.slice(0, 5).map(item => <div key={item.sale.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div><p className="text-sm font-bold text-[#0f172a]">{item.sale.saleNumber}</p><p className="mt-0.5 text-[11px] text-slate-500">{item.customer?.name ?? "Walk-in Customer"} • {item.sale.paymentMethod.toUpperCase()}</p></div><span className="text-sm font-black text-[#0f766e]">₨{Number(item.sale.total).toFixed(2)}</span></div>)}</div></Card>
      </div>
    </div>
  );
}

function ProductCatalogView() {
  const utils = trpc.useUtils();
  const { data: products = [] } = trpc.catalog.products.useQuery();
  const { data: categories = [] } = trpc.catalog.categories.useQuery();
  const [openNew, setOpenNew] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [productImageUrl, setProductImageUrl] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#5B6CFF");

  const uploadImageMutation = trpc.catalog.uploadProductImage.useMutation({
    onSuccess: (res) => {
      setProductImageUrl(res.url);
      toast.success("Product image uploaded successfully!");
    },
    onError: err => toast.error(err.message || "Failed to upload image.")
  });

  const createMutation = trpc.catalog.createProduct.useMutation({
    onSuccess: async () => {
      toast.success("Product created successfully!");
      setOpenNew(false);
      setName("");
      setSku("");
      setPrice("");
      setStock("");
      setCategoryId(undefined);
      setProductImageUrl("");
      await utils.catalog.products.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatColor, setEditCatColor] = useState("#5B6CFF");

  const createCategoryMutation = trpc.catalog.createCategory.useMutation({
    onSuccess: async () => {
      toast.success("Category added successfully!");
      setOpenCategory(false);
      setNewCatName("");
      await utils.catalog.categories.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  const updateCategoryMutation = trpc.catalog.updateCategory.useMutation({
    onSuccess: async () => {
      toast.success("Category updated successfully!");
      setEditingCategory(null);
      await utils.catalog.categories.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  const deleteCategoryMutation = trpc.catalog.deleteCategory.useMutation({
    onSuccess: async () => {
      toast.success("Category deleted successfully!");
      await utils.catalog.categories.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  const deleteProductMutation = trpc.catalog.deleteProduct.useMutation({
    onSuccess: async () => {
      toast.success("Product deleted successfully!");
      await utils.catalog.products.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdSku, setEditProdSku] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdStock, setEditProdStock] = useState("");
  const [editProdCatId, setEditProdCatId] = useState<number | undefined>(undefined);
  const [editProdImageUrl, setEditProdImageUrl] = useState("");

  const uploadEditImageMutation = trpc.catalog.uploadProductImage.useMutation({
    onSuccess: (res) => {
      setEditProdImageUrl(res.url);
      toast.success("Product image uploaded successfully!");
    },
    onError: err => toast.error(err.message || "Failed to upload image.")
  });

  const updateProductMutation = trpc.catalog.updateProduct.useMutation({
    onSuccess: async () => {
      toast.success("Product updated successfully!");
      setEditingProduct(null);
      await utils.catalog.products.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#f8f3e7]">Product Catalog & Category Management</h3>
          <p className="text-xs text-[#9eb4ae] mt-1">Manage pricing, SKUs, stock thresholds, and dynamic tenant categories.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={openCategory} onOpenChange={setOpenCategory}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#203b42] bg-[#0d2630] text-[#f8f3e7] hover:bg-slate-800 font-semibold rounded-xl">
                <FolderPlus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-[#0f172a] rounded-2xl p-6 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#0f172a]">Add Custom Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Category Name</label>
                  <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Special Brews" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Color Badge</label>
                  <div className="flex gap-2 mt-1">
                    {["#5B6CFF", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#F97316"].map(c => (
                      <button key={c} type="button" onClick={() => setNewCatColor(c)} className={`h-8 w-8 rounded-lg border-2 ${newCatColor === c ? "border-[#0f172a] scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <Button onClick={() => createCategoryMutation.mutate({ name: newCatName, color: newCatColor })} className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-12 shadow-lg shadow-slate-900/10 rounded-xl mt-4">
                  Save Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-[#f8f3e7] font-semibold rounded-xl shadow-lg shadow-slate-900/10">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-[#0f172a] rounded-2xl p-6 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#0f172a]">Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-3 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Product Name <span className="text-red-500">*</span></label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Organic Espresso Beans" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">SKU <span className="text-slate-400 font-normal">(Optional — auto-generated if left blank)</span></label>
                  <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. SKU-101" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Category <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <select
                    value={categoryId ?? ""}
                    onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0f172a] mt-1 h-11"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 font-medium">Selling Price (PKR) <span className="text-red-500">*</span></label>
                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="14.99" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium">Initial Stock <span className="text-red-500">*</span></label>
                    <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="50" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Product Image <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <div className="mt-1.5 flex items-center gap-3">
                    {productImageUrl ? (
                      <img src={productImageUrl} alt="Preview" className="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-400 font-bold text-xs">IMG</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const base64Data = reader.result as string;
                          try {
                            const res = await uploadImageMutation.mutateAsync({ filename: file.name, contentType: file.type || "image/png", base64Data });
                            setProductImageUrl(res.url);
                          } catch (err) {}
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Or Image URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <Input value={productImageUrl} onChange={e => setProductImageUrl(e.target.value)} placeholder="https://example.com/item.png" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11 text-xs" />
                </div>
                <Button
                  onClick={() => createMutation.mutate({ name, sku: sku || undefined, categoryId, costPrice: 0, sellingPrice: Number(price) || 0, stockQuantity: Number(stock) || 0, minStockLevel: 5, imageUrl: productImageUrl || null })}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-12 shadow-lg shadow-slate-900/10 rounded-xl mt-4"
                >
                  Save Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)] xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-black text-[#0f172a]">Tenant Categories</h4>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{categories.length}</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Categories are fully dynamic per business workspace (e.g., bookshop, stationery, café).</p>
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/75 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-bold text-[#0f172a]">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingCategory(cat); setEditCatName(cat.name); setEditCatColor(cat.color); }} className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-200">Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteCategoryMutation.mutate({ id: cat.id })} className="h-7 px-2 text-xs text-red-600 hover:bg-red-50">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)] xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base font-black text-[#0f172a]">Products</h4>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{products.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">SKU</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Stock</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-semibold text-[#0f172a] flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : <Tag className="h-4 w-4 text-slate-500" />}
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td className="py-4 text-slate-500 font-mono text-xs">{p.sku}</td>
                    <td className="py-4 font-bold text-[#0f766e]">₨{Number(p.sellingPrice).toFixed(2)}</td>
                    <td className="py-4 font-semibold text-slate-700">{p.stockQuantity}</td>
                    <td className="py-4">
                      <Badge variant={p.stockQuantity <= p.minStockLevel ? "destructive" : "secondary"} className="rounded-lg">
                        {p.stockQuantity <= p.minStockLevel ? "Low Stock" : "In Stock"}
                      </Badge>
                    </td>
                    <td className="py-4 text-right flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditProdName(p.name);
                          setEditProdSku(p.sku);
                          setEditProdPrice(p.sellingPrice.toString());
                          setEditProdStock(p.stockQuantity.toString());
                          setEditProdCatId(p.categoryId ?? undefined);
                          setEditProdImageUrl(p.imageUrl ?? "");
                          setEditingProduct(p);
                        }}
                        className="h-8 px-2.5 text-xs text-slate-700 hover:bg-slate-100 font-bold rounded-xl"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete product "${p.name}"?`)) {
                            deleteProductMutation.mutate({ id: p.id });
                          }
                        }}
                        className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={open => !open && setEditingCategory(null)}>
          <DialogContent className="bg-white border-slate-200 text-[#0f172a] rounded-2xl p-6 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#0f172a]">Edit Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Category Name</label>
                <Input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="bg-slate-50 border-slate-200 mt-1 rounded-xl h-11 text-[#0f172a]" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Color Badge</label>
                <div className="flex gap-2 mt-1">
                  {["#5B6CFF", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#F97316"].map(c => (
                    <button key={c} type="button" onClick={() => setEditCatColor(c)} className={`h-8 w-8 rounded-lg border-2 ${editCatColor === c ? "border-[#0f172a] scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={() => updateCategoryMutation.mutate({ id: editingCategory.id, name: editCatName, color: editCatColor })} className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-12 shadow-lg rounded-xl mt-4">
                Update Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={open => !open && setEditingProduct(null)}>
          <DialogContent className="bg-white border-slate-200 text-[#0f172a] rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#0f172a]">Edit Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Product Name</label>
                <Input value={editProdName} onChange={e => setEditProdName(e.target.value)} className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">SKU</label>
                <Input value={editProdSku} onChange={e => setEditProdSku(e.target.value)} className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Category</label>
                <select
                  value={editProdCatId ?? ""}
                  onChange={e => setEditProdCatId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0f172a] mt-1 h-11"
                >
                  <option value="">Uncategorized</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Selling Price (PKR)</label>
                  <Input type="number" value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)} className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Stock Quantity</label>
                  <Input type="number" value={editProdStock} onChange={e => setEditProdStock(e.target.value)} className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Product Image (Optional)</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {editProdImageUrl ? <img src={editProdImageUrl} alt="" className="h-full w-full object-cover" /> : <Tag className="h-5 w-5 text-slate-400" />}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const base64Data = reader.result as string;
                        await uploadEditImageMutation.mutateAsync({
                          filename: file.name,
                          contentType: file.type || "image/png",
                          base64Data: base64Data.split(",")[1] || base64Data,
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>
              <Button
                onClick={() => updateProductMutation.mutate({ id: editingProduct.id, name: editProdName, sku: editProdSku, categoryId: editProdCatId, sellingPrice: Number(editProdPrice) || 0, stockQuantity: Number(editProdStock) || 0, imageUrl: editProdImageUrl || undefined })}
                className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-12 shadow-lg rounded-xl mt-4"
              >
                Update Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function InventoryManagementView() {
  const { data: lowStock = [] } = trpc.inventory.lowStock.useQuery();
  const { data: movements = [] } = trpc.inventory.movements.useQuery();
  const { data: products = [] } = trpc.catalog.products.useQuery();
  const { data: purchases = [] } = trpc.purchases.list.useQuery();
  const { data: suppliers = [] } = trpc.suppliers.list.useQuery();
  const utils = trpc.useUtils();

  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [openAdjust, setOpenAdjust] = useState(false);

  const [variantProductId, setVariantProductId] = useState<number | undefined>();
  const [variantName, setVariantName] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [openVariant, setOpenVariant] = useState(false);

  const { data: variants = [] } = trpc.inventory.variants.useQuery(
    { productId: variantProductId! },
    { enabled: !!variantProductId }
  );

  const adjustMutation = trpc.inventory.adjust.useMutation({
    onSuccess: async () => {
      toast.success("Stock adjusted successfully!");
      setOpenAdjust(false);
      setAdjQty("");
      setAdjReason("");
      await utils.inventory.lowStock.invalidate();
      await utils.inventory.movements.invalidate();
      await utils.catalog.products.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  const createVariantMutation = trpc.inventory.createVariant.useMutation({
    onSuccess: async () => {
      toast.success("Variant created successfully!");
      setVariantName("");
      setVariantSku("");
      setVariantPrice("");
      setVariantStock("");
      await utils.inventory.variants.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  const deleteVariantMutation = trpc.inventory.deleteVariant.useMutation({
    onSuccess: async () => {
      toast.success("Variant deleted!");
      await utils.inventory.variants.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#0f172a]">Advanced Inventory Management</h3>
          <p className="text-xs text-slate-500 mt-1">Track low-stock alerts, manage product variants, and inspect audit movements.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setOpenAdjust(true)} className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold rounded-xl shadow-md">
            Manual Stock Adjust
          </Button>
          <Button onClick={() => setOpenVariant(true)} variant="outline" className="border-slate-300 text-[#0f172a] hover:bg-slate-100 font-bold rounded-xl">
            Manage Variants
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
        <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <p className="text-xs text-slate-500 font-medium">Low Stock Alerts</p>
          <h3 className="text-3xl font-extrabold text-amber-600 mt-2">{lowStock.length}</h3>
          <p className="text-xs text-slate-400 mt-1.5">Items at or below min threshold</p>
        </Card>
        <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <p className="text-xs text-slate-500 font-medium">Active Suppliers</p>
          <h3 className="text-3xl font-extrabold text-[#0f172a] mt-2">{suppliers.length}</h3>
          <p className="text-xs text-slate-400 mt-1.5">Wholesale partners</p>
        </Card>
        <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <p className="text-xs text-slate-500 font-medium">Purchase Orders</p>
          <h3 className="text-3xl font-extrabold text-[#0f766e] mt-2">{purchases.length}</h3>
          <p className="text-xs text-slate-400 mt-1.5">Registered POs</p>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="bg-amber-50/60 border-amber-200 p-6 rounded-2xl shadow-sm">
          <h4 className="font-bold text-amber-900 mb-2">Low Stock Warning Alerts</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStock.map(p => (
              <div key={p.id} className="bg-white border border-amber-200/70 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{p.name}</p>
                  <p className="text-[11px] text-slate-500">SKU: {p.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
                    {p.stockQuantity} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        <h3 className="font-bold text-[#0f172a] mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-[#0f766e]" /> Inventory Audit Ledger & Movements
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Movement Type</th>
                <th className="pb-3 font-semibold">Product ID</th>
                <th className="pb-3 font-semibold">Quantity Change</th>
                <th className="pb-3 font-semibold">Reason / Reference</th>
                <th className="pb-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4">
                    <Badge className={`rounded-lg capitalize ${m.quantity > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                      {m.type}
                    </Badge>
                  </td>
                  <td className="py-4 font-mono text-xs font-semibold text-slate-700">#{m.productId}</td>
                  <td className={`py-4 font-bold ${m.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="py-4 text-slate-600 text-xs">{m.reason || "Automatic stock adjustment"}</td>
                  <td className="py-4 text-slate-400 text-xs">{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No inventory movements recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={openAdjust} onOpenChange={setOpenAdjust}>
        <DialogContent className="bg-white border-slate-200 text-[#0f172a] rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0f172a]">Manual Stock Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div>
              <label className="text-xs text-slate-500 font-medium">Select Product</label>
              <select
                value={selectedProductId ?? ""}
                onChange={e => setSelectedProductId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0f172a] mt-1 h-11"
              >
                <option value="">Choose product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Quantity Change (+ to add, - to subtract)</label>
              <Input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} placeholder="e.g. 10 or -5" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Reason for Adjustment</label>
              <Input value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="e.g. Stock count correction / Restock" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
            </div>
            <Button
              onClick={() => {
                if (!selectedProductId) { toast.error("Please select a product."); return; }
                adjustMutation.mutate({ productId: selectedProductId, quantity: Number(adjQty) || 0, reason: adjReason || "Manual adjustment" });
              }}
              className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-12 shadow-lg rounded-xl mt-4"
            >
              Apply Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openVariant} onOpenChange={setOpenVariant}>
        <DialogContent className="bg-white border-slate-200 text-[#0f172a] rounded-2xl p-6 shadow-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0f172a]">Manage Product Variants</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs text-slate-500 font-medium">Select Parent Product</label>
              <select
                value={variantProductId ?? ""}
                onChange={e => setVariantProductId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0f172a] mt-1 h-11"
              >
                <option value="">Choose product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {variantProductId && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h4 className="text-sm font-bold text-slate-800">Existing Variants</h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {variants.map(v => (
                    <div key={v.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{v.name}</p>
                        <p className="text-[11px] text-slate-500">SKU: {v.sku} | Stock: {v.stockQuantity} | +₨{v.additionalPrice}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteVariantMutation.mutate({ id: v.id })} className="text-xs text-red-600 hover:bg-red-50">Delete</Button>
                    </div>
                  ))}
                  {variants.length === 0 && <p className="text-xs text-slate-400">No variants created for this product yet.</p>}
                </div>

                <h4 className="text-sm font-bold text-slate-800 pt-2">Add New Variant</h4>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Variant Name (e.g. Large / Red)</label>
                  <Input value={variantName} onChange={e => setVariantName(e.target.value)} placeholder="Large" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-10 text-xs" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Variant SKU</label>
                  <Input value={variantSku} onChange={e => setVariantSku(e.target.value)} placeholder="SKU-LRG" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-10 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 font-medium">Extra Price (PKR)</label>
                    <Input type="number" value={variantPrice} onChange={e => setVariantPrice(e.target.value)} placeholder="0" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-10 text-xs" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium">Initial Stock</label>
                    <Input type="number" value={variantStock} onChange={e => setVariantStock(e.target.value)} placeholder="20" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-10 text-xs" />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!variantName || !variantSku) { toast.error("Please provide name and SKU."); return; }
                    createVariantMutation.mutate({ productId: variantProductId, name: variantName, sku: variantSku, additionalPrice: Number(variantPrice) || 0, stockQuantity: Number(variantStock) || 0 });
                  }}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-11 rounded-xl"
                >
                  Save Variant
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerDirectoryView() {
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: groups = [] } = trpc.customerGroups.list.useQuery();
  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [groupId, setGroupId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const createMutation = trpc.customers.create.useMutation({
    onSuccess: async () => {
      toast.success("Customer added successfully!");
      setOpenNew(false);
      setName("");
      setEmail("");
      setPhone("");
      setGroupId(null);
      await utils.customers.list.invalidate();
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
            <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-[#f8f3e7] font-semibold rounded-xl shadow-lg shadow-slate-900/10">
              <Plus className="h-4 w-4 mr-2" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 text-[#0f172a] rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#0f172a]">New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Eleanor Vance" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Email Address</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="eleanor@example.com" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Phone Number</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555-0191" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Customer Group / Tier</label>
                <Select value={groupId ? groupId.toString() : "none"} onValueChange={val => setGroupId(val === "none" ? null : Number(val))}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11 w-full">
                    <SelectValue placeholder="Select group (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-[#0f172a]">
                    <SelectItem value="none">Standard / None</SelectItem>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id.toString()}>{g.name} ({g.discountPercent}% off)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => createMutation.mutate({ name, email, phone, groupId })} 
                disabled={createMutation.isPending}
                className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-12 shadow-lg shadow-slate-900/10 rounded-xl mt-4 flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                {createMutation.isPending ? "Saving Customer..." : "Save Customer"}
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
                  <td className="py-4 font-bold text-[#0f766e]">{c.loyaltyPoints} pts</td>
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
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const [dateRange, setDateRange] = useState<"all" | "today" | "yesterday" | "last3" | "week" | "month" | "custom">("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const last3Start = todayStart - 3 * 86400000;
    const weekStart = todayStart - 7 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return recentSales.filter(item => {
      const saleTime = new Date(item.sale.createdAt).getTime();

      // Date filter
      if (dateRange === "today" && saleTime < todayStart) return false;
      if (dateRange === "yesterday" && (saleTime < yesterdayStart || saleTime >= todayStart)) return false;
      if (dateRange === "last3" && saleTime < last3Start) return false;
      if (dateRange === "week" && saleTime < weekStart) return false;
      if (dateRange === "month" && saleTime < monthStart) return false;
      if (dateRange === "custom") {
        if (customStart && saleTime < new Date(customStart).getTime()) return false;
        if (customEnd && saleTime > new Date(customEnd).getTime() + 86400000) return false;
      }

      // Customer filter
      if (selectedCustomerId !== "all") {
        const custIdNum = Number(selectedCustomerId);
        if (item.customer?.id !== custIdNum) return false;
      }

      return true;
    });
  }, [recentSales, dateRange, selectedCustomerId, customStart, customEnd]);

  const totalFilteredRevenue = useMemo(() => {
    return filteredSales.reduce((acc, item) => acc + Number(item.sale.total), 0);
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#f8f3e7]">Sales History & Analytics</h3>
          <p className="text-xs text-[#9eb4ae] mt-1">Audit completed transactions with date ranges and customer filters.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#0d2630]/95 border border-[#203b42] p-3 rounded-2xl shadow-sm">
          <div>
            <p className="text-[10px] uppercase text-[#9eb4ae] font-bold">Filtered Revenue</p>
            <p className="text-lg font-black text-[#0f766e]">₨{totalFilteredRevenue.toFixed(2)} ({filteredSales.length} orders)</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-[#0d2630]/95 border-[#203b42] p-5 rounded-2xl shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[#9eb4ae] font-bold mb-1.5 block">Date Range</label>
            <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
              <SelectTrigger className="bg-[#07111F] border-[#203b42] text-[#f8f3e7] rounded-xl h-11">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d2630] border-[#203b42] text-[#f8f3e7]">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last3">Last 3 Days</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-[#9eb4ae] font-bold mb-1.5 block">Customer Filter</label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="bg-[#07111F] border-[#203b42] text-[#f8f3e7] rounded-xl h-11">
                <SelectValue placeholder="All customers" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d2630] border-[#203b42] text-[#f8f3e7]">
                <SelectItem value="all">All Customers & Walk-ins</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.email || c.phone || "No contact"})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => { setDateRange("all"); setSelectedCustomerId("all"); setCustomStart(""); setCustomEnd(""); }}
              className="w-full border-[#203b42] bg-[#07111F] text-[#c7d8d1] hover:bg-slate-800 h-11 rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {dateRange === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#203b42]">
            <div>
              <label className="text-xs text-[#9eb4ae] font-medium mb-1 block">Start Date</label>
              <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-[#07111F] border-[#203b42] text-[#f8f3e7] rounded-xl h-11" />
            </div>
            <div>
              <label className="text-xs text-[#9eb4ae] font-medium mb-1 block">End Date</label>
              <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-[#07111F] border-[#203b42] text-[#f8f3e7] rounded-xl h-11" />
            </div>
          </div>
        )}
      </Card>

      {/* Transactions Table */}
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
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#9eb4ae]">
                    No sales found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map(item => (
                  <tr key={item.sale.id} className="hover:bg-[#07111F]/40 transition-colors">
                    <td className="py-4 font-semibold text-[#f8f3e7]">{item.sale.saleNumber}</td>
                    <td className="py-4 text-[#c7d8d1]">{item.customer?.name ?? "Walk-in Customer"}</td>
                    <td className="py-4 uppercase text-xs font-semibold text-[#0f766e]">{item.sale.paymentMethod}</td>
                    <td className="py-4 font-extrabold text-[#f8f3e7]">₨{Number(item.sale.total).toFixed(2)}</td>
                    <td className="py-4 text-[#9eb4ae] text-xs">{new Date(item.sale.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ExpenseTrackerView() {
  const { data: expenses = [] } = trpc.expenses.list.useQuery();
  const { data: categories = [] } = trpc.catalog.categories.useQuery();
  const [openNew, setOpenNew] = useState(false);
  const [category, setCategory] = useState(categories[0]?.name ?? "Rent & Utilities");
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
            <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-[#f8f3e7] font-semibold rounded-xl shadow-lg shadow-slate-900/10">
              <Plus className="h-4 w-4 mr-2" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 text-[#0f172a] rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#0f172a]">Record Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Category (Dynamic Workspace Categories)</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0f172a] mt-1 h-11"
                >
                  {categories.length === 0 ? (
                    <option value="General Overhead">General Overhead</option>
                  ) : (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Amount (PKR)</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="250.00" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Notes</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Monthly utility bill" className="bg-slate-50 border-slate-200 text-[#0f172a] mt-1 rounded-xl h-11" />
              </div>
              <Button onClick={() => createMutation.mutate({ category, amount: Number(amount) || 0, notes })} className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-12 shadow-lg shadow-slate-900/10 rounded-xl mt-4">
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
            <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-[#f8f3e7] font-semibold rounded-xl shadow-lg shadow-slate-900/10">
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
              <Button onClick={() => inviteMutation.mutate({ name, email, role })} className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-[#f8f3e7] font-bold h-12 shadow-lg shadow-slate-900/10 rounded-xl mt-4">
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
                  <td className="py-4 font-semibold text-[#0f766e] uppercase text-xs">{membership.role.replace("_", " ")}</td>
                  <td className="py-4">
                    <Badge className="bg-[#effaf7] text-[#0f766e] border-[#d5eee8] rounded-lg">
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

function MasterDataView() {
  const { data: categories = [] } = trpc.catalog.categories.useQuery();
  const { data: customerGroups = [] } = trpc.customerGroups.list.useQuery();
  const utils = trpc.useUtils();
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#0f766e");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDiscount, setNewGroupDiscount] = useState("0");

  const createCatMutation = trpc.catalog.createCategory.useMutation({
    onSuccess: () => {
      utils.catalog.categories.invalidate();
      setNewCatName("");
      toast.success("Category added successfully.");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCatMutation = trpc.catalog.deleteCategory.useMutation({
    onSuccess: () => {
      utils.catalog.categories.invalidate();
      toast.success("Category deleted.");
    },
    onError: (err) => toast.error(err.message),
  });

  const createGroupMutation = trpc.customerGroups.create.useMutation({
    onSuccess: () => {
      utils.customerGroups.list.invalidate();
      setNewGroupName("");
      setNewGroupDiscount("0");
      toast.success("Customer group/type added.");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteGroupMutation = trpc.customerGroups.delete.useMutation({
    onSuccess: () => {
      utils.customerGroups.list.invalidate();
      toast.success("Customer group deleted.");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-black text-[#0f172a]">Tenant Master Data</h3>
        <p className="text-xs text-slate-500 mt-1">Manage your store's custom product categories and customer types/groups. These options instantly populate your product catalog, POS terminal, and customer management screens.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Categories */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-black text-[#0f172a]">Product Categories</h4>
              <p className="text-xs text-slate-500 mt-0.5">Organize items for your inventory and POS terminal.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{categories.length} categories</span>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="e.g. Stationery, Beverages"
              className="bg-slate-50 border-slate-200 h-10 rounded-xl text-xs flex-1"
            />
            <input
              type="color"
              value={newCatColor}
              onChange={e => setNewCatColor(e.target.value)}
              className="h-10 w-12 rounded-xl border border-slate-200 p-1 cursor-pointer bg-white"
            />
            <Button
              onClick={() => {
                if (!newCatName.trim()) return toast.error("Please enter a category name");
                createCatMutation.mutate({ name: newCatName.trim(), color: newCatColor });
              }}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl h-10 px-4 text-xs font-bold"
            >
              Add Category
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/75 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-bold text-[#0f172a]">{cat.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteCatMutation.mutate({ id: cat.id })} className="h-7 px-2 text-xs text-red-600 hover:bg-red-50">
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer Groups & Types */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-black text-[#0f172a]">Customer Groups & Types</h4>
              <p className="text-xs text-slate-500 mt-0.5">Define membership tiers or pricing groups (e.g. Wholesale, VIP).</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{customerGroups.length} groups</span>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="e.g. VIP Member, Wholesale"
              className="bg-slate-50 border-slate-200 h-10 rounded-xl text-xs flex-1"
            />
            <Button
              onClick={() => {
                if (!newGroupName.trim()) return toast.error("Please enter a group name");
                createGroupMutation.mutate({ name: newGroupName.trim(), discountPercent: Number(newGroupDiscount) || 0 });
              }}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl h-10 px-4 text-xs font-bold"
            >
              Add Group
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {customerGroups.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No custom customer groups created yet. Add one above to organize your customers.</p>
            ) : (
              customerGroups.map(group => (
                <div key={group.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/75 p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-[#0f172a]">{group.name}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteGroupMutation.mutate({ id: group.id })} className="h-7 px-2 text-xs text-red-600 hover:bg-red-50">
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TenantSettingsView() {
  const { data: settings } = trpc.tenant.settings.useQuery();
  const utils = trpc.useUtils();
  const [name, setName] = useState(settings?.name ?? "");
  const [businessType, setBusinessType] = useState(settings?.businessType ?? "Retail");
  const [currency, setCurrency] = useState(settings?.currency ?? "USD");
  const [taxRate, setTaxRate] = useState(settings?.taxRate?.toString() ?? "8.25");
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl ?? "");
  const [receiptFooter, setReceiptFooter] = useState(settings?.receiptFooter ?? "");

  useEffect(() => {
    if (settings) {
      setName(settings.name ?? "");
      setBusinessType(settings.businessType ?? "Retail");
      setCurrency(settings.currency ?? "USD");
      setTaxRate(settings.taxRate?.toString() ?? "8.25");
      setLogoUrl(settings.logoUrl ?? "");
      setReceiptFooter(settings.receiptFooter ?? "");
    }
  }, [settings]);

  const updateMutation = trpc.tenant.updateSettings.useMutation({
    onSuccess: async () => {
      toast.success("Business settings and branding updated successfully!");
      await utils.tenant.settings.invalidate();
      await utils.tenant.context.invalidate();
    },
    onError: err => toast.error(err.message)
  });

  const uploadLogoMutation = trpc.tenant.uploadLogo.useMutation({
    onSuccess: async (res) => {
      setLogoUrl(res.url);
      toast.success("Logo uploaded and applied successfully!");
      await utils.tenant.settings.invalidate();
      await utils.tenant.context.invalidate();
    },
    onError: err => toast.error(err.message || "Failed to upload logo.")
  });

  return (
    <div className="space-y-6 w-full max-w-6xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0f766e]">Workspace configuration</p>
          <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#0f172a]">Business Settings & Branding.</h3>
          <p className="mt-1 text-sm text-slate-500">Customize store identity, logos, tax rules, receipt footers, and regional currency.</p>
        </div>
        <Badge className="w-fit rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">Tenant Admin workspace</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)] lg:col-span-2 space-y-6">
          <h4 className="text-base font-black text-[#0f172a]">Core business profile</h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500">Business Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aura Coffee & Gourmet" className="mt-1.5 h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500">Business Type / Industry</label>
                <Input value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="e.g. Bookstore & Stationery" className="mt-1.5 h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Currency Code</label>
                <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="e.g. PKR or USD" className="mt-1.5 h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500">Default Tax Rate (%)</label>
                <Input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="18.00" className="mt-1.5 h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Receipt Footer Message</label>
              <Input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} placeholder="Thank you for shopping with us!" className="mt-1.5 h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm" />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)] space-y-6">
          <h4 className="text-base font-black text-[#0f172a]">Store Logo & Branding</h4>
          <p className="text-xs text-slate-500 leading-relaxed">Upload a logo image file from your computer or provide an image URL to display in the application header and receipts.</p>
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Store logo preview" className="h-20 w-20 rounded-2xl object-cover shadow-md mb-3 border border-slate-200 bg-white" onError={(e) => { console.error("Logo preview load error for URL:", logoUrl); }} />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f172a] text-white font-black text-xl shadow-md mb-3">
                {name ? name.charAt(0).toUpperCase() : "OP"}
              </div>
            )}
            <p className="text-xs font-bold text-slate-700">Logo preview</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Upload Logo File</label>
            <input
              type="file"
              accept="image/*"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async () => {
                  const base64Data = reader.result as string;
                  // Set immediate local data URI preview so user sees it right away
                  setLogoUrl(base64Data);
                  try {
                    const res = await uploadLogoMutation.mutateAsync({ filename: file.name, contentType: file.type || "image/png", base64Data });
                    setLogoUrl(res.url);
                  } catch (err: any) {
                    // handled by onError
                  }
                };
                reader.readAsDataURL(file);
              }}
              className="mt-1.5 block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0f172a] file:text-white hover:file:bg-[#1e293b] cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Or Logo Image URL</label>
            <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="mt-1.5 h-11 rounded-xl border-slate-200 bg-slate-50 text-xs text-slate-900" />
          </div>
          <Button
            onClick={() => updateMutation.mutate({ name, businessType, currency, taxRate: Number(taxRate) || 0, logoUrl: logoUrl || null, receiptFooter })}
            disabled={updateMutation.isPending}
            className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-12 shadow-lg shadow-slate-900/10 rounded-2xl"
          >
            {updateMutation.isPending ? "Saving..." : "Save Settings & Branding"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

function SuperAdminView() {
  const utils = trpc.useUtils();
  const { data: stats } = trpc.admin.platformStats.useQuery();
  const { data: tenants = [] } = trpc.admin.tenants.useQuery();
  const statusMutation = trpc.admin.setTenantStatus.useMutation({
    onSuccess: async () => {
      toast.success("Organization status updated successfully!");
      await Promise.all([utils.admin.tenants.invalidate(), utils.admin.platformStats.invalidate()]);
    },
    onError: err => toast.error(err.message),
  });
  const activeCount = tenants.filter(({ tenant }) => tenant.status === "active").length;
  const suspendedCount = tenants.filter(({ tenant }) => tenant.status === "suspended").length;
  const pendingCount = tenants.filter(({ tenant }) => tenant.status === "inactive").length;
  const activeRate = tenants.length ? Math.round((activeCount / tenants.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0f766e]">Platform administration</p><h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#0f172a]">Organization control center.</h3><p className="mt-1 text-sm text-slate-500">Monitor every workspace, keep access decisions clear, and protect tenant boundaries.</p></div><Badge className="w-fit rounded-full border border-[#d5eee8] bg-[#effaf7] text-[#0f766e]">Super Admin access</Badge></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Total businesses", value: stats?.tenants ?? 0, helper: "Registered workspaces", icon: Store, accent: "text-[#0f172a]" }, { label: "Active businesses", value: stats?.activeTenants ?? activeCount, helper: `${activeRate}% of organizations`, icon: CheckCircle, accent: "text-[#0f766e]" }, { label: "Platform users", value: stats?.users ?? 0, helper: "Across all workspaces", icon: Users, accent: "text-[#f9735b]" }, { label: "Gross revenue", value: `₨${Number(stats?.revenue ?? 0).toFixed(2)}`, helper: "Completed transactions", icon: TrendingUp, accent: "text-[#0f766e]" }].map(({ label, value, helper, icon: Icon, accent }) => <Card key={label} className="rounded-2xl border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-slate-500">{label}</p><p className={`mt-3 text-2xl font-black tracking-tight ${accent}`}>{value}</p></div><div className="rounded-xl bg-slate-50 p-2.5"><Icon className="h-4 w-4 text-slate-500" /></div></div><p className="mt-4 text-[11px] font-medium text-slate-400">{helper}</p></Card>)}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-2xl border-slate-200 bg-[#0f172a] p-6 text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)]"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-400">Workspace health</p><h4 className="mt-1 text-xl font-black">Access distribution</h4></div><ShieldCheck className="h-5 w-5 text-[#f9735b]" /></div><p className="mt-9 text-4xl font-black">{activeRate}<span className="text-xl text-slate-400">%</span></p><p className="mt-1 text-xs text-slate-400">of organizations currently active</p><div className="mt-6 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#f9735b]" style={{ width: `${activeRate}%` }} /></div><div className="mt-7 space-y-3 text-xs"><div className="flex items-center justify-between"><span className="text-slate-400">Active</span><span className="font-black text-[#b9e4db]">{activeCount}</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Suspended</span><span className="font-black text-[#f9735b]">{suspendedCount}</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Pending approval</span><span className="font-black">{pendingCount}</span></div></div></Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"><div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold text-slate-500">Tenant directory</p><h4 className="mt-1 text-lg font-black text-[#0f172a]">Organization management</h4><p className="mt-1 text-xs text-slate-500">Approve, suspend, or reactivate workspaces without crossing their data boundaries.</p></div><Badge className="w-fit rounded-full border border-slate-200 bg-slate-50 text-slate-500">Live control</Badge></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-3 font-black">Business</th><th className="pb-3 font-black">Owner</th><th className="pb-3 font-black">Type</th><th className="pb-3 font-black">Status</th><th className="pb-3 font-black">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{tenants.map(({ tenant, owner }) => <tr key={tenant.id} className="transition hover:bg-slate-50"><td className="py-4 font-bold text-[#0f172a]">{tenant.name}</td><td className="py-4 text-xs text-slate-500">{owner.name}<br /><span className="text-[10px]">{owner.email}</span></td><td className="py-4 text-xs text-slate-500">{tenant.businessType}</td><td className="py-4"><Badge className={`rounded-full border ${tenant.status === "active" ? "border-[#d5eee8] bg-[#effaf7] text-[#0f766e]" : tenant.status === "suspended" ? "border-[#ffd9d2] bg-[#fff1ec] text-[#c2412d]" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{tenant.status}</Badge></td><td className="py-4"><Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ tenantId: tenant.id, status: tenant.status === "active" ? "suspended" : "active" })} className="rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50">{tenant.status === "active" ? "Suspend" : tenant.status === "suspended" ? "Reactivate" : "Approve"}</Button></td></tr>)}</tbody></table></div></Card>
      </div>
    </div>
  );
}
