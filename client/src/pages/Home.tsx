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
  Bell,
  Pencil,
  Tags,
  Download,
  Menu,
  PieChart,
  History,
  Keyboard
} from "lucide-react";
import { toast } from "sonner";
import { money, moneyWhole } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import PurchaseOrders from "@/components/PurchaseOrders";
import CommandPalette, { SearchTrigger } from "@/components/CommandPalette";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReportsView from "./Reports";
import POSView from "./POS";
import ActivityView from "./Activity";
import { DataTable, Pill, SearchBox, Segmented, StatTile, fmtDate, fmtTime, relativeTime } from "@/components/data/kit";
import Landing from "./Landing";
import AuthScreen from "./Auth";
import DashboardView from "./Dashboard";
import CustomersView from "./Customers";
import SalesView from "./Sales";
import ExpensesView from "./Expenses";
import TeamView from "./Team";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatches(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return matches;
}

export default function Home() {
  const { user, loading, logout, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === "admin" ? "superadmin" : "pos");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const collapsed = isDesktop && sidebarCollapsed;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(o => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
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
  const { data: lowStockAlerts = [] } = trpc.dashboard.lowStock.useQuery(undefined, { enabled: !!user && user?.role !== "admin", refetchInterval: 60000 });

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
      ? <Landing onLogin={() => { setAuthMode("login"); setPublicView("auth"); }} onRegister={() => { setAuthMode("register"); setPublicView("auth"); }} />
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
    { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: BarChart3 }, { id: "reports", label: "Reports", icon: PieChart, adminOnly: true }] },
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
      { id: "team", label: "Team & Roles", icon: ShieldCheck, adminOnly: true },
      { id: "activity", label: "Activity Log", icon: History, adminOnly: true },
      { id: "settings", label: "Business Settings", icon: Settings },
    ] },
  ].map(g => ({ ...g, items: g.items.filter((i: any) => !i.adminOnly || user.role === "admin" || tenantCtx?.membership.role === "tenant_admin") }));
  const flatPages = navGroups.flatMap(g => g.items);

  return (
    <div className="omnipos-app flex h-dvh w-full overflow-hidden bg-[#f8fafc] text-[#0f172a]">
      {/* Grouped premium sidebar */}
      {mobileNav && <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)} aria-hidden="true" />}
      <aside className={`omnipos-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-[280px] max-w-[85vw] shrink-0 flex-col border-r border-white/5 bg-[#0b1220] text-slate-300 transition-transform duration-300 lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:transition-[width] ${mobileNav ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-[84px]" : "lg:w-[280px]"}`}>
        <div className={`flex h-[88px] items-center border-b border-white/10 ${collapsed ? "justify-center px-3" : "gap-3 px-5"}`}>
          {tenantSettings?.logoUrl ? (
            <img src={tenantSettings.logoUrl.startsWith('/') ? tenantSettings.logoUrl : tenantSettings.logoUrl} alt="Store logo" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl object-cover shadow-[0_8px_18px_rgba(15,23,42,0.16)] border border-slate-200 bg-white" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white font-black text-sm shadow-[0_8px_24px_rgba(20,184,166,0.35)]">
              {tenantSettings?.name ? tenantSettings.name.charAt(0).toUpperCase() : "OP"}
            </div>
          )}
          {!collapsed && <div className="min-w-0"><p className="truncate text-[15px] font-bold tracking-[-0.01em] text-white">{businessName}</p><div className="mt-1 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" /><span className="truncate text-[11px] font-semibold text-[#2dd4bf]">{currentRole}</span></div></div>}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          {navGroups.map(group => (
            <div key={group.label} className="mb-7 last:mb-0">
              {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{group.label}</p>}
              <div className="space-y-1.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setMobileNav(false); }}
                      aria-label={item.label}
                      className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[13px] font-bold transition-all duration-200 ${collapsed ? "justify-center" : ""} ${active ? "bg-white/10 text-white ring-1 ring-white/10" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#2dd4bf]" />}
                      <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? "text-[#2dd4bf]" : "text-slate-500 group-hover:text-[#2dd4bf]"}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && item.id === "superadmin" && <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider ${active ? "bg-white/10 text-white/80" : "bg-[#fff1ec] text-[#c2412d]"}`}>Admin</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2.5 ${collapsed ? "flex-col justify-center" : ""}`}>
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f766e] text-xs font-black text-white"><span>{user.name?.charAt(0).toUpperCase()}</span><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b1220] bg-[#2dd4bf]" /></div>
            {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{user.name}</p><p className="truncate text-[10px] font-medium text-slate-400">{user.email}</p></div>}
            <button onClick={logout} aria-label="Sign out" title="Sign out" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex h-dvh min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:h-20 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button onClick={() => setMobileNav(true)} aria-label="Open menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"><Menu className="h-5 w-5" /></button>
            <button onClick={() => setSidebarCollapsed(c => !c)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 lg:flex"><SlidersHorizontal className="h-4 w-4" /></button>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight text-[#0f172a] sm:text-lg">
                {({ pos: "POS Terminal", dashboard: "Dashboard", reports: "Reports", products: "Products", inventory: "Inventory & purchase orders", customers: "Customers", sales: "Sales history", expenses: "Expenses", masterdata: "Master data", team: "Team & roles", activity: "Activity log", settings: "Business settings", superadmin: "Super admin console" } as Record<string, string>)[activeTab] ?? activeTab}
              </h2>
              <p className="hidden truncate text-xs text-slate-500 sm:block">{businessName}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {user.role !== "admin" && <>
              <SearchTrigger onClick={() => setPaletteOpen(true)} />
              <button onClick={() => setPaletteOpen(true)} aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 md:hidden"><Search className="h-4 w-4" /></button>
              <Popover>
                <PopoverTrigger asChild>
                  <button aria-label={`Notifications${lowStockAlerts.length ? `, ${lowStockAlerts.length} alerts` : ""}`} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
                    <Bell className="h-4 w-4" />
                    {lowStockAlerts.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{lowStockAlerts.length > 9 ? "9+" : lowStockAlerts.length}</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 rounded-2xl border-slate-200 bg-white p-0 text-slate-900 shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3"><p className="text-sm font-bold">Notifications</p><p className="text-xs text-slate-500">{lowStockAlerts.length ? `${lowStockAlerts.length} products need restocking` : "You're all caught up"}</p></div>
                  <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    {lowStockAlerts.slice(0, 8).map(p => <li key={p.id}><button onClick={() => setActiveTab("inventory")} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.name}</span><span className="text-[11px] text-slate-400">{p.sku}</span></span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${p.stockQuantity <= 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{p.stockQuantity <= 0 ? "Out" : `${p.stockQuantity} left`}</span></button></li>)}
                  </ul>
                  {lowStockAlerts.length > 0 && <button onClick={() => setActiveTab("inventory")} className="w-full border-t border-slate-100 py-2.5 text-center text-xs font-semibold text-teal-700 hover:bg-slate-50">Open inventory</button>}
                </PopoverContent>
              </Popover>
            </>}
            <button onClick={() => setHelpOpen(true)} aria-label="Help and shortcuts" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"><HelpCircle className="h-4 w-4" /></button>
          </div>
        </header>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} pages={flatPages} onNavigate={setActiveTab} />
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="max-w-md rounded-2xl border-slate-200 bg-white p-6 text-slate-900">
            <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl font-bold"><Keyboard className="h-5 w-5 text-teal-600" /> Shortcuts & tips</DialogTitle></DialogHeader>
            <ul className="space-y-3 pt-1 text-sm">
              {[["⌘K / Ctrl+K", "Search products, customers and orders, or jump to any page"], ["/", "Focus the product search on the POS terminal"], ["Enter", "In POS search: add the matching product (works with barcode scanners)"], ["Esc", "Close any dialog or panel"]].map(([k, d]) => (
                <li key={k} className="flex items-start gap-3"><kbd className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-semibold text-slate-600">{k}</kbd><span className="text-slate-600">{d}</span></li>
              ))}
            </ul>
            <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">Tip: open a shift on the POS terminal before selling so your cash drawer reconciles at close.</p>
          </DialogContent>
        </Dialog>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"><div className="mx-auto w-full max-w-[1600px]">
          {user.role === "admin" ? (
            <SuperAdminView />
          ) : (
            <>
              {activeTab === "pos" && <POSView setActiveTab={setActiveTab} />}
              {activeTab === "dashboard" && <DashboardView setActiveTab={setActiveTab} />}
              {activeTab === "reports" && <ReportsView />}
              {activeTab === "activity" && <ActivityView />}
              {activeTab === "products" && <ProductCatalogView />}
              {activeTab === "inventory" && <InventoryManagementView />}
              {activeTab === "customers" && <CustomersView />}
              {activeTab === "sales" && <SalesView />}
              {activeTab === "expenses" && <ExpensesView />}
              {activeTab === "team" && <TeamView />}
              {activeTab === "masterdata" && <MasterDataView />}
              {activeTab === "settings" && <TenantSettingsView />}
            </>
          )}
        </div></main>
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
  const [prodSearch, setProdSearch] = useState("");
  const [prodCat, setProdCat] = useState("all");
  const [prodStock, setProdStock] = useState<"all" | "low" | "out">("all");
  const [manageCats, setManageCats] = useState(false);
  const filteredProducts = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    return products.filter(p =>
      (prodCat === "all" || String(p.categoryId) === prodCat) &&
      (prodStock === "all" || (prodStock === "out" ? p.stockQuantity <= 0 : p.stockQuantity <= p.minStockLevel)) &&
      (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode ?? "").includes(q)));
  }, [products, prodSearch, prodCat, prodStock]);
  const inventoryValue = products.reduce((s, p) => s + Number(p.costPrice) * p.stockQuantity, 0);
  const lowCount = products.filter(p => p.stockQuantity <= p.minStockLevel).length;
  const startEditProduct = (p: any) => {
    setEditProdName(p.name); setEditProdSku(p.sku); setEditProdPrice(p.sellingPrice.toString()); setEditProdStock(p.stockQuantity.toString());
    setEditProdCatId(p.categoryId ?? undefined); setEditProdImageUrl(p.imageUrl ?? ""); setEditingProduct(p);
  };
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
          <h3 className="text-2xl font-extrabold tracking-[-0.015em] text-slate-900">Products</h3>
          <p className="mt-1 text-sm text-slate-500">Pricing, stock levels and categories for everything you sell.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => downloadCsv("products", ["Name", "SKU", "Barcode", "Category", "Cost", "Price", "Stock", "Min stock"], filteredProducts.map(p => [p.name, p.sku, p.barcode, categories.find(c => c.id === p.categoryId)?.name, p.costPrice, p.sellingPrice, p.stockQuantity, p.minStockLevel]))} className="border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
          <Button variant="outline" onClick={() => setManageCats(true)} className="border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"><Tags className="h-4 w-4 mr-2" /> Manage categories</Button>
          <Dialog open={openCategory} onOpenChange={setOpenCategory}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold rounded-xl">
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

      <div className="stat-grid">
        <StatTile label="Products" value={products.length} hint={`${categories.length} categories`} icon={Package} />
        <StatTile label="Inventory value" value={moneyWhole(inventoryValue)} hint="at cost price" icon={DollarSign} tone="bg-indigo-50 text-indigo-600" />
        <StatTile label="Low stock" value={lowCount} hint={lowCount ? "needs restocking" : "all healthy"} icon={AlertTriangle} tone="bg-rose-50 text-rose-600" />
        <StatTile label="Avg. margin" value={`${(products.length ? products.reduce((s, p) => s + (Number(p.sellingPrice) ? ((Number(p.sellingPrice) - Number(p.costPrice)) / Number(p.sellingPrice)) * 100 : 0), 0) / products.length : 0).toFixed(0)}%`} hint="selling vs cost price" icon={TrendingUp} tone="bg-orange-50 text-orange-600" />
      </div>

      <DataTable
        rows={filteredProducts} rowKey={p => p.id} pageSize={10}
        toolbar={<div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBox value={prodSearch} onChange={setProdSearch} placeholder="Search name, SKU or barcode…" />
          <Select value={prodCat} onValueChange={setProdCat}>
            <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm lg:w-52"><SelectValue /></SelectTrigger>
            <SelectContent className="border-slate-200 bg-white text-slate-900"><SelectItem value="all">All categories</SelectItem>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Segmented value={prodStock} onChange={setProdStock} options={[{ value: "all", label: "All" }, { value: "low", label: "Low stock" }, { value: "out", label: "Out of stock" }]} />
          <span className="text-xs text-slate-500 lg:ml-auto">{filteredProducts.length} of {products.length} products</span>
        </div>}
        empty={{ icon: Package, title: products.length ? "No products match" : "No products yet", hint: products.length ? "Try a different search or filter." : "Add your first product to start selling.", action: !products.length ? <Button onClick={() => setOpenNew(true)} className="rounded-xl bg-slate-900 text-white hover:bg-slate-700">Add product</Button> : undefined }}
        columns={[
          { key: "name", header: "Product", sortValue: (p: any) => p.name.toLowerCase(), cell: (p: any) => {
            const cat = categories.find(c => c.id === p.categoryId);
            return <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : <Tag className="h-4 w-4 text-slate-400" />}</div>
              <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{p.name}</p>{cat && <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />{cat.name}</p>}</div>
            </div>; } },
          { key: "sku", header: "SKU", hideBelow: "lg", sortValue: (p: any) => p.sku, cell: (p: any) => <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600">{p.sku}</span> },
          { key: "price", header: "Price", align: "right", sortValue: (p: any) => Number(p.sellingPrice), cell: (p: any) => {
            const price = Number(p.sellingPrice), cost = Number(p.costPrice), margin = price ? ((price - cost) / price) * 100 : 0;
            return <div><p className="font-bold tabular-nums text-slate-900">{moneyWhole(price)}</p><p className="text-[11px] text-slate-400">{margin.toFixed(0)}% margin</p></div>; } },
          { key: "stock", header: "Stock", hideBelow: "sm", sortValue: (p: any) => p.stockQuantity, cell: (p: any) => {
            const target = Math.max(p.minStockLevel * 4, 1), pct = Math.min(100, (p.stockQuantity / target) * 100), low = p.stockQuantity <= p.minStockLevel;
            return <div className="w-28"><p className="text-sm font-semibold tabular-nums text-slate-800">{p.stockQuantity} <span className="text-[11px] font-normal text-slate-400">units</span></p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${p.stockQuantity <= 0 ? "bg-rose-500" : low ? "bg-amber-500" : "bg-teal-500"}`} style={{ width: `${pct}%` }} /></div></div>; } },
          { key: "status", header: "Status", cell: (p: any) => p.stockQuantity <= 0 ? <Pill tone="rose" dot>Out of stock</Pill> : p.stockQuantity <= p.minStockLevel ? <Pill tone="amber" dot>Low stock</Pill> : <Pill tone="emerald" dot>In stock</Pill> },
          { key: "actions", header: "", align: "right", cell: (p: any) => <div className="flex justify-end gap-1">
            <button type="button" onClick={() => startEditProduct(p)} aria-label={`Edit ${p.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => { if (window.confirm(`Delete product "${p.name}"?`)) deleteProductMutation.mutate({ id: p.id }); }} aria-label={`Delete ${p.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
          </div> },
        ]}
      />

      <Dialog open={manageCats} onOpenChange={setManageCats}>
        <DialogContent className="max-w-lg rounded-2xl border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Manage categories</DialogTitle></DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1 pt-2">
            {categories.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No categories yet.</p>}
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
                <span className="flex items-center gap-2.5 text-sm font-semibold"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />{cat.name}</span>
                <span className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setManageCats(false); setEditingCategory(cat); setEditCatName(cat.name); setEditCatColor(cat.color); }} className="h-8 px-2.5 text-xs text-slate-600 hover:bg-slate-200">Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteCategoryMutation.mutate({ id: cat.id })} className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50">Delete</Button>
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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

  const [ledgerFilter, setLedgerFilter] = useState<"all" | "in" | "out">("all");
  const productById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const unitsOnHand = products.reduce((s, p) => s + p.stockQuantity, 0);
  const ledgerRows = useMemo(() => movements.filter(m => ledgerFilter === "all" || (ledgerFilter === "in" ? m.quantity > 0 : m.quantity < 0)), [movements, ledgerFilter]);
  const typeTone: Record<string, "emerald" | "rose" | "indigo" | "amber" | "sky"> = { purchase: "indigo", stock_in: "emerald", sale: "rose", stock_out: "rose", adjustment: "amber" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-extrabold tracking-[-0.015em] text-slate-900">Inventory</h3>
          <p className="mt-1 text-sm text-slate-500">Stock alerts, adjustments, variants and the full movement ledger.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setOpenAdjust(true)} className="h-10 rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-700">Manual stock adjust</Button>
          <Button onClick={() => setOpenVariant(true)} variant="outline" className="h-10 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50">Manage variants</Button>
        </div>
      </div>

      <div className="stat-grid">
        <StatTile label="Units on hand" value={unitsOnHand.toLocaleString("en-PK")} hint={`across ${products.length} products`} icon={Package} />
        <StatTile label="Low stock alerts" value={lowStock.length} hint="at or below minimum" icon={AlertTriangle} tone="bg-amber-50 text-amber-600" />
        <StatTile label="Suppliers" value={suppliers.length} hint="wholesale partners" icon={Truck} tone="bg-indigo-50 text-indigo-600" />
        <StatTile label="Purchase orders" value={purchases.length} hint="registered" icon={Receipt} tone="bg-sky-50 text-sky-600" />
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-amber-50/40 p-5">
          <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /><h4 className="text-sm font-bold text-amber-900">Needs restocking · {lowStock.length} items</h4></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-white px-3.5 py-2.5">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{p.name}</p><p className="text-[11px] text-slate-500">{p.sku} · min {p.minStockLevel}</p></div>
                <Pill tone={p.stockQuantity <= 0 ? "rose" : "amber"}>{p.stockQuantity <= 0 ? "Out" : `${p.stockQuantity} left`}</Pill>
              </div>
            ))}
          </div>
        </div>
      )}

      <PurchaseOrders />

      <DataTable
        rows={ledgerRows} rowKey={m => m.id} pageSize={10}
        toolbar={<><div><h4 className="text-base font-bold text-slate-900">Movement ledger</h4><p className="text-xs text-slate-500">Every stock change, newest first.</p></div>
          <Segmented value={ledgerFilter} onChange={setLedgerFilter} options={[{ value: "all", label: "All" }, { value: "in", label: "Stock in" }, { value: "out", label: "Stock out" }]} /></>}
        empty={{ icon: Truck, title: "No stock movements yet", hint: "Sales, purchases and manual adjustments will be logged here automatically." }}
        columns={[
          { key: "when", header: "When", sortValue: (m: any) => new Date(m.createdAt).getTime(), cell: (m: any) => <div><p className="text-sm text-slate-800">{relativeTime(m.createdAt)}</p><p className="text-[11px] text-slate-400">{fmtDate(m.createdAt)} · {fmtTime(m.createdAt)}</p></div> },
          { key: "type", header: "Type", cell: (m: any) => <Pill tone={typeTone[m.type] ?? "slate"}><span className="capitalize">{String(m.type).replace("_", " ")}</span></Pill> },
          { key: "product", header: "Product", sortValue: (m: any) => productById.get(m.productId)?.name ?? "", cell: (m: any) => { const pr = productById.get(m.productId); return pr ? <div><p className="font-semibold text-slate-900">{pr.name}</p><p className="font-mono text-[11px] text-slate-400">{pr.sku}</p></div> : <span className="text-slate-400">Deleted product #{m.productId}</span>; } },
          { key: "qty", header: "Change", align: "right", sortValue: (m: any) => m.quantity, cell: (m: any) => <span className={`font-bold tabular-nums ${m.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span> },
          { key: "reason", header: "Reason", hideBelow: "md", cell: (m: any) => <span className="text-sm text-slate-600">{m.reason || "Automatic adjustment"}</span> },
        ]}
      />

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
                        <p className="text-[11px] text-slate-500">SKU: {v.sku} | Stock: {v.stockQuantity} | +{money(v.additionalPrice)}</p>
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

  const [activeTab, setActiveTab] = useState<"categories" | "groups">("categories");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold tracking-[-0.015em] text-slate-900">Master data</h3>
          <p className="mt-1 text-sm text-slate-500">Reference data used across products, customers and pricing.</p>
        </div>
      </div>

      {/* Extensible Master Data Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "categories" ? "bg-[#0f172a] text-white shadow-md shadow-slate-900/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Product Categories ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("groups")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "groups" ? "bg-[#0f172a] text-white shadow-md shadow-slate-900/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Customer Groups & Tiers ({customerGroups.length})
        </button>
      </div>

      {activeTab === "categories" && (
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-black text-[#0f172a]">Product Categories</h4>
              <p className="text-xs text-slate-500 mt-0.5">Organize items for your inventory and POS terminal.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{categories.length} categories</span>
          </div>

          <div className="flex gap-2 mb-6">
            <Input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="e.g. Stationery, Beverages"
              className="bg-slate-50 border-slate-200 h-11 rounded-xl text-xs flex-1"
            />
            <input
              type="color"
              value={newCatColor}
              onChange={e => setNewCatColor(e.target.value)}
              className="h-11 w-14 rounded-xl border border-slate-200 p-1 cursor-pointer bg-white"
            />
            <Button
              onClick={() => {
                if (!newCatName.trim()) return toast.error("Please enter a category name");
                createCatMutation.mutate({ name: newCatName.trim(), color: newCatColor });
              }}
              disabled={createCatMutation.isPending}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl h-11 px-5 text-xs font-bold flex items-center gap-2"
            >
              {createCatMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categories.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No categories created yet. Add one above.</div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-bold text-[#0f172a]">{cat.name}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteCatMutation.mutate({ id: cat.id })} className="h-8 px-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg">
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === "groups" && (
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-black text-[#0f172a]">Customer Groups & Types</h4>
              <p className="text-xs text-slate-500 mt-0.5">Define membership tiers or pricing groups (e.g. Wholesale, VIP).</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{customerGroups.length} groups</span>
          </div>

          <div className="flex gap-2 mb-6">
            <Input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="e.g. VIP Member, Wholesale"
              className="bg-slate-50 border-slate-200 h-11 rounded-xl text-xs flex-1"
            />
            <Input
              type="number"
              value={newGroupDiscount}
              onChange={e => setNewGroupDiscount(e.target.value)}
              placeholder="Discount %"
              className="bg-slate-50 border-slate-200 h-11 rounded-xl text-xs w-32"
            />
            <Button
              onClick={() => {
                if (!newGroupName.trim()) return toast.error("Please enter a group name");
                createGroupMutation.mutate({ name: newGroupName.trim(), discountPercent: Number(newGroupDiscount) || 0 });
              }}
              disabled={createGroupMutation.isPending}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl h-11 px-5 text-xs font-bold flex items-center gap-2"
            >
              {createGroupMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Group
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {customerGroups.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No custom customer groups created yet. Add one above to organize your customers.</div>
            ) : (
              customerGroups.map(group => (
                <div key={group.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#0f172a]">{group.name}</span>
                    <span className="rounded-lg bg-[#0f766e]/10 px-2.5 py-1 text-[11px] font-extrabold text-[#0f766e] border border-[#0f766e]/20">{group.discountPercent}% discount</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteGroupMutation.mutate({ id: group.id })} className="h-8 px-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg">
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
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
    <div className="w-full space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold tracking-[-0.015em] text-slate-900">Business settings</h3>
        <p className="mt-1 text-sm text-slate-500">Store identity, branding, tax and receipt preferences.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-12px_rgba(15,23,42,0.08)] lg:col-span-2 space-y-6">
          <h4 className="text-base font-bold text-slate-900">Business profile</h4>
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

        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-12px_rgba(15,23,42,0.08)] space-y-5">
          <h4 className="text-base font-bold text-slate-900">Store logo</h4>
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0f766e]">Platform administration</p><h3 className="mt-2 text-3xl font-black tracking-[-0.02em] text-[#0f172a]">Organization control center.</h3><p className="mt-1 text-sm text-slate-500">Monitor every workspace, keep access decisions clear, and protect tenant boundaries.</p></div><Badge className="w-fit rounded-full border border-[#d5eee8] bg-[#effaf7] text-[#0f766e]">Super Admin access</Badge></div>
      <div className="stat-grid">
        {[{ label: "Total businesses", value: stats?.tenants ?? 0, helper: "Registered workspaces", icon: Store, accent: "text-[#0f172a]" }, { label: "Active businesses", value: stats?.activeTenants ?? activeCount, helper: `${activeRate}% of organizations`, icon: CheckCircle, accent: "text-[#0f766e]" }, { label: "Platform users", value: stats?.users ?? 0, helper: "Across all workspaces", icon: Users, accent: "text-[#f9735b]" }, { label: "Gross revenue", value: money(Number(stats?.revenue ?? 0)), helper: "Completed transactions", icon: TrendingUp, accent: "text-[#0f766e]" }].map(({ label, value, helper, icon: Icon, accent }) => <Card key={label} className="rounded-2xl border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-slate-500">{label}</p><p className={`mt-3 text-2xl font-black tracking-tight ${accent}`}>{value}</p></div><div className="rounded-xl bg-slate-50 p-2.5"><Icon className="h-4 w-4 text-slate-500" /></div></div><p className="mt-4 text-[11px] font-medium text-slate-400">{helper}</p></Card>)}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-2xl border-slate-200 bg-[#0f172a] p-6 text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)]"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-400">Workspace health</p><h4 className="mt-1 text-xl font-black">Access distribution</h4></div><ShieldCheck className="h-5 w-5 text-[#f9735b]" /></div><p className="mt-9 text-4xl font-black">{activeRate}<span className="text-xl text-slate-400">%</span></p><p className="mt-1 text-xs text-slate-400">of organizations currently active</p><div className="mt-6 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#f9735b]" style={{ width: `${activeRate}%` }} /></div><div className="mt-7 space-y-3 text-xs"><div className="flex items-center justify-between"><span className="text-slate-400">Active</span><span className="font-black text-[#b9e4db]">{activeCount}</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Suspended</span><span className="font-black text-[#f9735b]">{suspendedCount}</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Pending approval</span><span className="font-black">{pendingCount}</span></div></div></Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"><div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold text-slate-500">Tenant directory</p><h4 className="mt-1 text-lg font-black text-[#0f172a]">Organization management</h4><p className="mt-1 text-xs text-slate-500">Approve, suspend, or reactivate workspaces without crossing their data boundaries.</p></div><Badge className="w-fit rounded-full border border-slate-200 bg-slate-50 text-slate-500">Live control</Badge></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-3 font-black">Business</th><th className="pb-3 font-black">Owner</th><th className="pb-3 font-black">Type</th><th className="pb-3 font-black">Status</th><th className="pb-3 font-black">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{tenants.map(({ tenant, owner }) => <tr key={tenant.id} className="transition hover:bg-slate-50"><td className="py-4 font-bold text-[#0f172a]">{tenant.name}</td><td className="py-4 text-xs text-slate-500">{owner.name}<br /><span className="text-[10px]">{owner.email}</span></td><td className="py-4 text-xs text-slate-500">{tenant.businessType}</td><td className="py-4"><Badge className={`rounded-full border ${tenant.status === "active" ? "border-[#d5eee8] bg-[#effaf7] text-[#0f766e]" : tenant.status === "suspended" ? "border-[#ffd9d2] bg-[#fff1ec] text-[#c2412d]" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{tenant.status}</Badge></td><td className="py-4"><Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ tenantId: tenant.id, status: tenant.status === "active" ? "suspended" : "active" })} className="rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50">{tenant.status === "active" ? "Suspend" : tenant.status === "suspended" ? "Reactivate" : "Approve"}</Button></td></tr>)}</tbody></table></div></Card>
      </div>
    </div>
  );
}
