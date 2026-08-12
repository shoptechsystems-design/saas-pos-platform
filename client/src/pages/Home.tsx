import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { startLogin } from "@/const";
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
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("pos");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl animate-pulse">
            <Store className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium tracking-wide text-slate-400">Loading OmniPOS Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-50 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
        <header className="container mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              OmniPOS <span className="text-indigo-400">SaaS</span>
            </span>
          </div>
          <Button onClick={() => startLogin()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 shadow-lg shadow-indigo-600/30 rounded-xl">
            Sign In / Register
          </Button>
        </header>

        <main className="container mx-auto px-6 py-20 flex-1 flex flex-col items-center text-center">
          <Badge className="mb-6 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full">
            Commercial Multi-Tenant POS Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
            The Next-Generation Point of Sale for Modern Businesses
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl font-normal leading-relaxed">
            Power multi-location retail stores, specialty cafés, and inventory enterprises with high-speed cashier terminals, strict tenant data isolation, granular RBAC, and real-time revenue analytics.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => startLogin()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 text-base font-medium shadow-xl shadow-indigo-600/30 rounded-xl">
              Launch Cashier Terminal
            </Button>
            <Button size="lg" variant="outline" onClick={() => startLogin()} className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 px-8 h-12 text-base rounded-xl">
              Explore Super Admin Console
            </Button>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full max-w-5xl">
            <Card className="bg-slate-900/60 border-slate-800 p-6 backdrop-blur rounded-2xl shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Lightning-Fast POS</h3>
              <p className="mt-2 text-sm text-slate-400">Optimized grid, barcode scanner lookup, instant cart calculations, and flexible payment workflows designed for high-volume cashiers.</p>
            </Card>
            <Card className="bg-slate-900/60 border-slate-800 p-6 backdrop-blur rounded-2xl shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Strict Tenant Isolation</h3>
              <p className="mt-2 text-sm text-slate-400">Every business operates in its own secure data boundary with four exact roles: Super Admin, Tenant Admin, Cashier, and Inventory Manager.</p>
            </Card>
            <Card className="bg-slate-900/60 border-slate-800 p-6 backdrop-blur rounded-2xl shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Real-Time Analytics</h3>
              <p className="mt-2 text-sm text-slate-400">Track daily revenue, low stock alerts, customer loyalty points, expense tracking, and automated inventory valuation instantly.</p>
            </Card>
          </div>
        </main>

        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          © 2026 OmniPOS SaaS Platform. Professional Multi-Tenant Architecture.
        </footer>
      </div>
    );
  }

  const navItems = [
    { id: "pos", label: "POS Terminal", icon: ShoppingBag },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "products", label: "Products", icon: Package },
    { id: "inventory", label: "Inventory & POs", icon: Truck },
    { id: "customers", label: "Customers", icon: Users },
    { id: "sales", label: "Sales History", icon: Receipt },
    { id: "expenses", label: "Expenses", icon: DollarSign },
    { id: "team", label: "Team & Roles", icon: ShieldCheck },
    { id: "settings", label: "Business Settings", icon: Settings },
    ...(user.role === "admin" ? [{ id: "superadmin", label: "Super Admin", icon: Store }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Persistent Sidebar */}
      <aside className={`border-r border-slate-800 bg-slate-900/90 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}>
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-indigo-600/30">
              OP
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <h1 className="font-bold text-sm text-white tracking-tight">Aura Coffee</h1>
                <p className="text-xs text-indigo-400">Tenant Admin</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className={`w-full mt-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 justify-start gap-2 h-9 ${sidebarCollapsed ? "justify-center px-0" : ""}`}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span className="text-xs">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight capitalize">
                {activeTab === "pos" ? "POS Cashier Terminal" : activeTab.replace("-", " & ")}
              </h2>
              <p className="text-xs text-slate-400">Aura Coffee & Gourmet Market • Tenant Isolation Active</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Global search products, orders..."
                className="pl-9 bg-slate-950 border-slate-800 w-64 text-xs text-white"
              />
            </div>
            <Button variant="outline" size="icon" className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
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
  const tax = taxable * 0.0825;
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Left / Main Product Grid Area */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, SKU, or barcode (e.g. COF-ETH-01)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-800 text-white h-11 rounded-xl shadow-sm"
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
            className={selectedCategory === undefined ? "bg-indigo-600 text-white rounded-xl" : "border-slate-800 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800"}
          >
            All Categories
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? "bg-indigo-600 text-white rounded-xl" : "border-slate-800 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800"}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[580px] overflow-y-auto pr-1">
          {products.map(product => (
            <Card
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-slate-900/90 border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all p-3.5 flex flex-col justify-between group shadow-lg rounded-2xl"
            >
              <div>
                <div className="h-32 rounded-xl bg-slate-950 mb-3 flex items-center justify-center overflow-hidden border border-slate-800/80">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Tag className="h-8 w-8 text-slate-600" />
                  )}
                </div>
                <h4 className="font-semibold text-sm text-slate-100 line-clamp-1">{product.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">SKU: {product.sku}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-indigo-400">${Number(product.sellingPrice).toFixed(2)}</span>
                <Badge variant={product.stockQuantity <= product.minStockLevel ? "destructive" : "secondary"} className="text-[10px] rounded-lg">
                  Stock: {product.stockQuantity}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Cart & Checkout Area */}
      <div className="lg:col-span-5 flex flex-col bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl justify-between">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-indigo-400" /> Current Order
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Order #{Date.now().toString(36).toUpperCase()}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={holdCurrentOrder} disabled={cart.length === 0} className="border-slate-700 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700">
                Hold
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-slate-400 hover:text-red-400 text-xs">
                Clear
              </Button>
            </div>
          </div>

          <div className="flex-1 max-h-[300px] overflow-y-auto py-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm flex flex-col items-center gap-2">
                <ShoppingBag className="h-8 w-8 text-slate-700" />
                <p>Cart is empty. Click products to add.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 shadow-sm">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-semibold text-slate-200 truncate">{item.product.name}</p>
                    <p className="text-xs text-indigo-400 mt-1">${Number(item.product.sellingPrice).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 font-bold">-</button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 font-bold">+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3 mt-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Customer</span>
              <select
                value={selectedCustomerId ?? ""}
                onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.loyaltyPoints} pts)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-800 text-sm">
              <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-400"><span>Tax (8.25%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-extrabold text-xl text-white pt-2 border-t border-slate-800">
                <span>TOTAL</span>
                <span className="text-indigo-400">${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={() => setPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/30 rounded-xl text-base mt-2"
            >
              Pay ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-400" /> Complete Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Amount Due</p>
              <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">${total.toFixed(2)}</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {(["cash", "card", "transfer", "other"] as const).map(m => (
                  <Button
                    key={m}
                    variant={paymentMethod === m ? "default" : "outline"}
                    onClick={() => setPaymentMethod(m)}
                    className={paymentMethod === m ? "bg-indigo-600 text-white capitalize" : "border-slate-800 bg-slate-950 text-slate-300 capitalize hover:bg-slate-800"}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">Cash Received ($)</label>
                <Input
                  type="number"
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-950 border-slate-800 h-11 text-lg font-bold text-white"
                />
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-slate-400">Change Due:</span>
                  <span className="font-bold text-emerald-400">${changeDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              onClick={() => checkoutMutation.mutate({ items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })), discount: 0, paymentMethod, amountReceived: receivedNum || total, customerId: selectedCustomerId })}
              disabled={checkoutMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/30 rounded-xl"
            >
              Confirm & Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!checkoutResult} onOpenChange={() => setCheckoutResult(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-400">
              <Printer className="h-5 w-5" /> Receipt Generated
            </DialogTitle>
          </DialogHeader>
          {checkoutResult && (
            <div className="space-y-4 font-mono text-xs bg-slate-950 p-5 rounded-xl border border-slate-800">
              <div className="text-center pb-3 border-b border-slate-800">
                <p className="font-bold text-sm text-white">Aura Coffee & Gourmet</p>
                <p className="text-slate-400 mt-1">{checkoutResult.saleNumber}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{new Date().toLocaleString()}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>${checkoutResult.subtotal}</span></div>
                <div className="flex justify-between text-slate-300"><span>Tax (8.25%)</span><span>${checkoutResult.tax}</span></div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-800 text-white"><span>TOTAL</span><span>${checkoutResult.total}</span></div>
                <div className="flex justify-between text-emerald-400 pt-1 font-semibold"><span>Change Returned</span><span>${checkoutResult.change}</span></div>
              </div>
              <div className="text-center pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                {checkoutResult.footer}
              </div>
              <Button onClick={() => setCheckoutResult(null)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold mt-4 rounded-xl">
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
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Today's Sales</p>
          <h3 className="text-3xl font-extrabold text-indigo-400 mt-2">${Number(stats?.todaySales ?? 0).toFixed(2)}</h3>
          <p className="text-xs text-slate-500 mt-1.5">{stats?.todayOrders ?? 0} orders completed today</p>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Month-to-Date Revenue</p>
          <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">${Number(stats?.monthSales ?? 0).toFixed(2)}</h3>
          <p className="text-xs text-slate-500 mt-1.5">Active billing period</p>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Active Products</p>
          <h3 className="text-3xl font-extrabold text-white mt-2">{stats?.products ?? 0}</h3>
          <p className="text-xs text-amber-400 mt-1.5">{stats?.lowStock ?? 0} low stock warnings</p>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Registered Customers</p>
          <h3 className="text-3xl font-extrabold text-white mt-2">{stats?.customers ?? 0}</h3>
          <p className="text-xs text-slate-500 mt-1.5">Loyalty points enabled</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" /> Low Stock Alerts
          </h3>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">All inventory levels are optimal.</p>
            ) : (
              lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-slate-400">SKU: {p.sku}</p>
                  </div>
                  <Badge variant="destructive" className="rounded-lg">Stock: {p.stockQuantity}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" /> Recent Transactions
          </h3>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No sales recorded today.</p>
            ) : (
              recentSales.map(item => (
                <div key={item.sale.id} className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.sale.saleNumber}</p>
                    <p className="text-xs text-slate-400">{item.customer?.name ?? "Walk-in Customer"} • {item.sale.paymentMethod.toUpperCase()}</p>
                  </div>
                  <span className="font-extrabold text-indigo-400">${Number(item.sale.total).toFixed(2)}</span>
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
          <h3 className="text-xl font-bold text-white">Product Catalog Management</h3>
          <p className="text-xs text-slate-400 mt-1">Manage pricing, SKUs, and stock thresholds across inventory.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Product Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Organic Espresso Beans" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">SKU</label>
                <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU-ESP-01" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Selling Price ($)</label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="14.99" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Initial Stock</label>
                  <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="50" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
                </div>
              </div>
              <Button
                onClick={() => createMutation.mutate({ name, sku, costPrice: 0, sellingPrice: Number(price) || 0, stockQuantity: Number(stock) || 0, minStockLevel: 5 })}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/30 rounded-xl mt-4"
              >
                Save Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Product</th>
                <th className="pb-3 font-semibold">SKU</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold">Stock</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 font-semibold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : <Tag className="h-4 w-4 text-slate-500" />}
                    </div>
                    <span>{p.name}</span>
                  </td>
                  <td className="py-4 text-slate-400 font-mono text-xs">{p.sku}</td>
                  <td className="py-4 font-bold text-indigo-400">${Number(p.sellingPrice).toFixed(2)}</td>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Low Stock Items</p>
          <h3 className="text-3xl font-extrabold text-amber-400 mt-2">{lowStock.length}</h3>
          <p className="text-xs text-slate-500 mt-1.5">Require replenishment</p>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Active Suppliers</p>
          <h3 className="text-3xl font-extrabold text-white mt-2">{suppliers.length}</h3>
          <p className="text-xs text-slate-500 mt-1.5">Wholesale partners</p>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Purchase Orders</p>
          <h3 className="text-3xl font-extrabold text-indigo-400 mt-2">{purchases.length}</h3>
          <p className="text-xs text-slate-500 mt-1.5">Logged in system</p>
        </Card>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-indigo-400" /> Purchase Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">PO Number</th>
                <th className="pb-3 font-semibold">Supplier</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Total Cost</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {purchases.map(({ purchase, supplier }) => (
                <tr key={purchase.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 font-semibold text-white">{purchase.purchaseNumber}</td>
                  <td className="py-4 text-slate-300">{supplier?.name ?? "Direct Supplier"}</td>
                  <td className="py-4">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg capitalize">
                      {purchase.status}
                    </Badge>
                  </td>
                  <td className="py-4 font-bold text-indigo-400">${Number(purchase.total).toFixed(2)}</td>
                  <td className="py-4 text-slate-400 text-xs">{new Date(purchase.createdAt).toLocaleDateString()}</td>
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
          <h3 className="text-xl font-bold text-white">Customer Directory & Loyalty</h3>
          <p className="text-xs text-slate-400 mt-1">Track reward points, lifetime spend, and contact details.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30">
              <Plus className="h-4 w-4 mr-2" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Eleanor Vance" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Email Address</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="eleanor@example.com" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Phone Number</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555-0191" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
              </div>
              <Button onClick={() => createMutation.mutate({ name, email, phone })} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/30 rounded-xl mt-4">
                Save Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Customer Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Phone</th>
                <th className="pb-3 font-semibold">Loyalty Points</th>
                <th className="pb-3 font-semibold">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 font-semibold text-white">{c.name}</td>
                  <td className="py-4 text-slate-400">{c.email || "-"}</td>
                  <td className="py-4 text-slate-400">{c.phone || "-"}</td>
                  <td className="py-4 font-bold text-indigo-400">{c.loyaltyPoints} pts</td>
                  <td className="py-4 font-extrabold text-white">${Number(c.totalSpent).toFixed(2)}</td>
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
        <h3 className="text-xl font-bold text-white">Sales History & Transactions</h3>
        <p className="text-xs text-slate-400 mt-1">Audit completed transactions, payment methods, and receipts.</p>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Order Number</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Payment Method</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {recentSales.map(item => (
                <tr key={item.sale.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 font-semibold text-white">{item.sale.saleNumber}</td>
                  <td className="py-4 text-slate-300">{item.customer?.name ?? "Walk-in Customer"}</td>
                  <td className="py-4 uppercase text-xs font-semibold text-indigo-400">{item.sale.paymentMethod}</td>
                  <td className="py-4 font-extrabold text-white">${Number(item.sale.total).toFixed(2)}</td>
                  <td className="py-4 text-slate-400 text-xs">{new Date(item.sale.createdAt).toLocaleString()}</td>
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
          <h3 className="text-xl font-bold text-white">Business Expense Tracker</h3>
          <p className="text-xs text-slate-400 mt-1">Monitor operational overhead and category expenses.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30">
              <Plus className="h-4 w-4 mr-2" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Record Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white mt-1"
                >
                  <option value="Rent & Utilities">Rent & Utilities</option>
                  <option value="Marketing & Ads">Marketing & Ads</option>
                  <option value="Equipment Maintenance">Equipment Maintenance</option>
                  <option value="Staff Payroll">Staff Payroll</option>
                  <option value="Packaging & Supplies">Packaging & Supplies</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Amount ($)</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="250.00" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Notes</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Monthly utility bill" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
              </div>
              <Button onClick={() => createMutation.mutate({ category, amount: Number(amount) || 0, notes })} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/30 rounded-xl mt-4">
                Save Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Notes</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 font-semibold text-white">{e.category}</td>
                  <td className="py-4 text-slate-400">{e.notes || "-"}</td>
                  <td className="py-4 font-bold text-red-400">${Number(e.amount).toFixed(2)}</td>
                  <td className="py-4 text-slate-400 text-xs">{new Date(e.expenseDate).toLocaleDateString()}</td>
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
          <h3 className="text-xl font-bold text-white">Team & Role Permissions</h3>
          <p className="text-xs text-slate-400 mt-1">Manage staff access across Tenant Admin, Cashier, and Inventory Manager roles.</p>
        </div>
        <Dialog open={openInvite} onOpenChange={setOpenInvite}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30">
              <Plus className="h-4 w-4 mr-2" /> Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Assign Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">User Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Connor" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Email (Must have signed in once)</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Assigned Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white mt-1"
                >
                  <option value="cashier">Cashier</option>
                  <option value="inventory_manager">Inventory Manager</option>
                </select>
              </div>
              <Button onClick={() => inviteMutation.mutate({ name, email, role })} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/30 rounded-xl mt-4">
                Assign Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Staff Member</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Assigned Role</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {team.map(({ membership, user }) => (
                <tr key={membership.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 font-semibold text-white">{user.name}</td>
                  <td className="py-4 text-slate-400">{user.email}</td>
                  <td className="py-4 font-semibold text-indigo-400 uppercase text-xs">{membership.role.replace("_", " ")}</td>
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
    <Card className="bg-slate-900/90 border-slate-800 p-8 max-w-2xl rounded-2xl shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Business Settings & Branding</h3>
      <p className="text-xs text-slate-400 mb-6">Configure receipt footer messages, tax rates, currency, and store details.</p>
      <div className="space-y-5">
        <div>
          <label className="text-xs text-slate-400 font-medium">Business Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 font-medium">Business Type</label>
            <Input value={businessType} onChange={e => setBusinessType(e.target.value)} className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Currency</label>
            <Input value={currency} onChange={e => setCurrency(e.target.value)} className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 font-medium">Default Tax Rate (%)</label>
          <Input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
        </div>
        <div>
          <label className="text-xs text-slate-400 font-medium">Receipt Footer Message</label>
          <Input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} placeholder="Thank you for your visit!" className="bg-slate-950 border-slate-800 mt-1 rounded-xl h-11" />
        </div>
        <Button onClick={() => updateMutation.mutate({ name, businessType, currency, taxRate: Number(taxRate) || 0, receiptFooter })} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/30 rounded-xl mt-4">
          Save Settings
        </Button>
      </div>
    </Card>
  );
}

function SuperAdminView() {
  const { data: stats } = trpc.admin.platformStats.useQuery();
  const { data: tenants = [] } = trpc.admin.tenants.useQuery();
  const statusMutation = trpc.admin.setTenantStatus.useMutation({
    onSuccess: () => toast.success("Tenant status updated!"),
    onError: err => toast.error(err.message)
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Total Businesses</p>
          <h3 className="text-3xl font-extrabold text-indigo-400 mt-2">{stats?.tenants ?? 0}</h3>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Active Businesses</p>
          <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">{stats?.activeTenants ?? 0}</h3>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Platform Users</p>
          <h3 className="text-3xl font-extrabold text-white mt-2">{stats?.users ?? 0}</h3>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 font-medium">Platform Gross Revenue</p>
          <h3 className="text-3xl font-extrabold text-indigo-400 mt-2">${Number(stats?.revenue ?? 0).toFixed(2)}</h3>
        </Card>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
        <h3 className="font-bold text-white mb-4">Super Admin - Tenant Management</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Business Name</th>
                <th className="pb-3 font-semibold">Owner</th>
                <th className="pb-3 font-semibold">Business Type</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tenants.map(({ tenant, owner }) => (
                <tr key={tenant.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 font-semibold text-white">{tenant.name}</td>
                  <td className="py-4 text-slate-400">{owner.name} ({owner.email})</td>
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
                      className="border-slate-700 bg-slate-800 text-xs rounded-xl"
                    >
                      {tenant.status === "active" ? "Suspend" : "Activate"}
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
