import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Store,
  ShieldCheck,
  Zap,
  Layers,
  BarChart3,
  Users,
  ShoppingBag,
  Package,
  Receipt,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Search,
  Printer,
  Settings,
  Truck,
  CreditCard,
  QrCode,
  Tag
} from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("pos");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Store className="h-10 w-10 text-indigo-500 animate-bounce" />
          <p className="text-sm font-medium tracking-wide">Loading OmniPOS Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-50 flex flex-col justify-between">
        <header className="container mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              OmniPOS SaaS
            </span>
          </div>
          <Button onClick={() => startLogin()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 shadow-lg shadow-indigo-600/30">
            Sign In / Register
          </Button>
        </header>

        <main className="container mx-auto px-6 py-20 flex-1 flex flex-col items-center text-center">
          <Badge className="mb-6 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
            Multi-Tenant Retail & Restaurant SaaS
          </Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
            The Modern Point of Sale Built for Scale & Speed
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl">
            Run multi-location retail shops, restaurants, and inventory businesses with lightning-fast checkout, strict tenant data isolation, granular RBAC, and real-time analytics.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => startLogin()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 text-base font-medium shadow-xl shadow-indigo-600/30">
              Launch Cashier Terminal
            </Button>
            <Button size="lg" variant="outline" onClick={() => startLogin()} className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 px-8 h-12 text-base">
              Explore Super Admin
            </Button>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full max-w-5xl">
            <Card className="bg-slate-900/60 border-slate-800 p-6 backdrop-blur">
              <Zap className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-semibold text-white">Blazing Fast POS</h3>
              <p className="mt-2 text-sm text-slate-400">Optimized grid, barcode scanner lookup, instant cart calculations, and flexible payment workflows.</p>
            </Card>
            <Card className="bg-slate-900/60 border-slate-800 p-6 backdrop-blur">
              <ShieldCheck className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-semibold text-white">Strict Tenant Isolation</h3>
              <p className="mt-2 text-sm text-slate-400">Every business operates in its own secure data boundary with role-based access control.</p>
            </Card>
            <Card className="bg-slate-900/60 border-slate-800 p-6 backdrop-blur">
              <BarChart3 className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-semibold text-white">Real-Time Analytics</h3>
              <p className="mt-2 text-sm text-slate-400">Track daily revenue, low stock alerts, top products, and automated inventory valuation.</p>
            </Card>
          </div>
        </main>

        <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
          © 2026 OmniPOS SaaS Platform. Production-Ready Multi-Tenant Architecture.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow">
            OP
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">OmniPOS Workspace</h2>
            <p className="text-xs text-slate-400">Signed in as {user.name} ({user.role})</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "admin" && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Super Admin Mode</Badge>
          )}
          <Button variant="outline" size="sm" onClick={logout} className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger value="pos" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <ShoppingBag className="h-4 w-4 mr-2" /> POS Terminal
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="catalog" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" /> Products & Inventory
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" /> Customers
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" /> Settings
            </TabsTrigger>
            {user.role === "admin" && (
              <TabsTrigger value="superadmin" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <ShieldCheck className="h-4 w-4 mr-2" /> Super Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="pos">
            <POSTerminal />
          </TabsContent>
          <TabsContent value="dashboard">
            <TenantDashboard />
          </TabsContent>
          <TabsContent value="catalog">
            <ProductCatalogView />
          </TabsContent>
          <TabsContent value="customers">
            <CustomerDirectoryView />
          </TabsContent>
          <TabsContent value="settings">
            <TenantSettingsView />
          </TabsContent>
          {user.role === "admin" && (
            <TabsContent value="superadmin">
              <SuperAdminView />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function POSTerminal() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [cart, setCart] = useState<Array<{ product: any; quantity: number }>>([]);
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | "other">("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  const { data: categories = [] } = trpc.catalog.categories.useQuery();
  const { data: products = [] } = trpc.catalog.products.useQuery({ query: search, categoryId: selectedCategory });
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const checkoutMutation = trpc.pos.checkout.useMutation({
    onSuccess: (res) => {
      setCheckoutResult(res);
      setCart([]);
      setAmountReceived("");
      toast.success(`Sale completed successfully! (${res.saleNumber})`);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.product.discountPrice ?? item.product.sellingPrice) * item.quantity, 0), [cart]);
  const discountVal = Number(discount) || 0;
  const taxable = Math.max(0, subtotal - discountVal);
  const tax = taxable * 0.0825; // 8.25% default tax
  const total = taxable + tax;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products by name, SKU, or barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-white"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(undefined)}
            className={selectedCategory === undefined ? "bg-indigo-600 text-white" : "border-slate-800 bg-slate-900 text-slate-300"}
          >
            All Categories
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? "bg-indigo-600 text-white" : "border-slate-800 bg-slate-900 text-slate-300"}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
          {products.map(product => (
            <Card
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-slate-900/80 border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all p-3 flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="h-28 rounded-lg bg-slate-800/80 mb-3 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Tag className="h-8 w-8 text-slate-600" />
                  )}
                </div>
                <h4 className="font-medium text-sm text-slate-200 line-clamp-1">{product.name}</h4>
                <p className="text-xs text-slate-400 mt-1">SKU: {product.sku}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-indigo-400">${Number(product.sellingPrice).toFixed(2)}</span>
                <Badge variant={product.stockQuantity <= product.minStockLevel ? "destructive" : "secondary"} className="text-[10px]">
                  Stock: {product.stockQuantity}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-indigo-400" /> Current Order
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-slate-400 hover:text-red-400">
            Clear
          </Button>
        </div>

        <div className="flex-1 max-h-[320px] overflow-y-auto py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Cart is empty. Click products to add.
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-medium text-slate-200 truncate">{item.product.name}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">${Number(item.product.sellingPrice).toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="h-7 w-7 rounded bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700">-</button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="h-7 w-7 rounded bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700">+</button>
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
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Payment Method</span>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
            >
              <option value="cash">Cash</option>
              <option value="card">Credit Card</option>
              <option value="transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {paymentMethod === "cash" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Amount Received ($)</span>
              <Input
                type="number"
                value={amountReceived}
                onChange={e => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="w-32 bg-slate-950 border-slate-800 h-8 text-right text-white"
              />
            </div>
          )}

          <div className="space-y-1 pt-2 border-t border-slate-800 text-sm">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-400"><span>Tax (8.25%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg text-white pt-1"><span>Total</span><span className="text-indigo-400">${total.toFixed(2)}</span></div>
          </div>

          <Button
            onClick={() => checkoutMutation.mutate({ items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })), discount: Number(discount), paymentMethod, amountReceived: Number(amountReceived) || total, customerId: selectedCustomerId })}
            disabled={cart.length === 0 || checkoutMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-12 shadow-lg shadow-indigo-600/30 mt-3"
          >
            Complete Sale (${total.toFixed(2)})
          </Button>
        </div>
      </div>

      <Dialog open={!!checkoutResult} onOpenChange={() => setCheckoutResult(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-400">
              <Printer className="h-5 w-5" /> Receipt / Sale Completed
            </DialogTitle>
          </DialogHeader>
          {checkoutResult && (
            <div className="space-y-4 font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-center pb-3 border-b border-slate-800">
                <p className="font-bold text-sm">OmniPOS Retail Receipt</p>
                <p className="text-slate-400">{checkoutResult.saleNumber}</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>${checkoutResult.subtotal}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>${checkoutResult.tax}</span></div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-800"><span>Total</span><span>${checkoutResult.total}</span></div>
                <div className="flex justify-between text-indigo-400 pt-1"><span>Change Due</span><span>${checkoutResult.change}</span></div>
              </div>
              {checkoutResult.footer && (
                <div className="text-center pt-3 border-t border-slate-800 text-slate-400">
                  {checkoutResult.footer}
                </div>
              )}
              <Button onClick={() => setCheckoutResult(null)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-sans mt-4">
                Done & New Sale
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TenantDashboard() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: lowStock = [] } = trpc.dashboard.lowStock.useQuery();
  const { data: recentSales = [] } = trpc.dashboard.recentSales.useQuery();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <p className="text-xs text-slate-400 font-medium">Today's Sales</p>
          <h3 className="text-2xl font-bold text-indigo-400 mt-2">${Number(stats?.todaySales ?? 0).toFixed(2)}</h3>
          <p className="text-xs text-slate-500 mt-1">{stats?.todayOrders ?? 0} orders today</p>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <p className="text-xs text-slate-400 font-medium">Month-to-Date Revenue</p>
          <h3 className="text-2xl font-bold text-indigo-400 mt-2">${Number(stats?.monthSales ?? 0).toFixed(2)}</h3>
          <p className="text-xs text-slate-500 mt-1">Active billing period</p>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <p className="text-xs text-slate-400 font-medium">Active Products</p>
          <h3 className="text-2xl font-bold text-white mt-2">{stats?.products ?? 0}</h3>
          <p className="text-xs text-amber-400 mt-1">{stats?.lowStock ?? 0} low stock alerts</p>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <p className="text-xs text-slate-400 font-medium">Registered Customers</p>
          <h3 className="text-2xl font-bold text-white mt-2">{stats?.customers ?? 0}</h3>
          <p className="text-xs text-slate-500 mt-1">Loyalty enabled</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Low Stock Alerts
          </h3>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">All stock levels are optimal.</p>
            ) : (
              lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-slate-400">SKU: {p.sku}</p>
                  </div>
                  <Badge variant="destructive">Stock: {p.stockQuantity}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" /> Recent Sales Transactions
          </h3>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No sales recorded yet today.</p>
            ) : (
              recentSales.map(item => (
                <div key={item.sale.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-sm font-medium text-white">{item.sale.saleNumber}</p>
                    <p className="text-xs text-slate-400">{item.customer?.name ?? "Walk-in"} • {item.sale.paymentMethod.toUpperCase()}</p>
                  </div>
                  <span className="font-bold text-indigo-400">${Number(item.sale.total).toFixed(2)}</span>
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
  const { data: categories = [] } = trpc.catalog.categories.useQuery();
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
          <h3 className="text-lg font-bold text-white">Product Catalog & Inventory</h3>
          <p className="text-xs text-slate-400">Manage pricing, SKUs, and stock thresholds.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-400">Product Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Organic Coffee" className="bg-slate-950 border-slate-800 mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-400">SKU</label>
                <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU-COF-01" className="bg-slate-950 border-slate-800 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Selling Price ($)</label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="9.99" className="bg-slate-950 border-slate-800 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Initial Stock</label>
                  <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="50" className="bg-slate-950 border-slate-800 mt-1" />
                </div>
              </div>
              <Button
                onClick={() => createMutation.mutate({ name, sku, costPrice: 0, sellingPrice: Number(price) || 0, stockQuantity: Number(stock) || 0, minStockLevel: 5 })}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-4"
              >
                Save Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map(p => (
                <tr key={p.id}>
                  <td className="py-3 font-medium text-white">{p.name}</td>
                  <td className="py-3 text-slate-400">{p.sku}</td>
                  <td className="py-3 text-indigo-400 font-semibold">${Number(p.sellingPrice).toFixed(2)}</td>
                  <td className="py-3">{p.stockQuantity}</td>
                  <td className="py-3">
                    <Badge variant={p.stockQuantity <= p.minStockLevel ? "destructive" : "secondary"}>
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
          <h3 className="text-lg font-bold text-white">Customer Directory & Loyalty</h3>
          <p className="text-xs text-slate-400">Track purchase history and customer reward points.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-400">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className="bg-slate-950 border-slate-800 mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Email Address</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="bg-slate-950 border-slate-800 mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Phone Number</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555-0192" className="bg-slate-950 border-slate-800 mt-1" />
              </div>
              <Button onClick={() => createMutation.mutate({ name, email, phone })} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-4">
                Save Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs">
                <th className="pb-3 font-medium">Customer Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Phone</th>
                <th className="pb-3 font-medium">Loyalty Points</th>
                <th className="pb-3 font-medium">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="py-3 font-medium text-white">{c.name}</td>
                  <td className="py-3 text-slate-400">{c.email || "-"}</td>
                  <td className="py-3 text-slate-400">{c.phone || "-"}</td>
                  <td className="py-3 font-semibold text-indigo-400">{c.loyaltyPoints} pts</td>
                  <td className="py-3 font-bold text-white">${Number(c.totalSpent).toFixed(2)}</td>
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
    onSuccess: () => toast.success("Tenant settings updated successfully!"),
    onError: err => toast.error(err.message)
  });

  return (
    <Card className="bg-slate-900/90 border-slate-800 p-6 max-w-2xl">
      <h3 className="text-lg font-bold text-white mb-2">Business Settings & Branding</h3>
      <p className="text-xs text-slate-400 mb-6">Configure receipt footer, tax rates, currency, and store details.</p>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400">Business Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="bg-slate-950 border-slate-800 mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400">Business Type</label>
            <Input value={businessType} onChange={e => setBusinessType(e.target.value)} className="bg-slate-950 border-slate-800 mt-1" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Currency</label>
            <Input value={currency} onChange={e => setCurrency(e.target.value)} className="bg-slate-950 border-slate-800 mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">Default Tax Rate (%)</label>
          <Input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="bg-slate-950 border-slate-800 mt-1" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Receipt Footer Message</label>
          <Input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} placeholder="Thank you for shopping with us!" className="bg-slate-950 border-slate-800 mt-1" />
        </div>
        <Button onClick={() => updateMutation.mutate({ name, businessType, currency, taxRate: Number(taxRate) || 0, receiptFooter })} className="bg-indigo-600 hover:bg-indigo-500 text-white mt-4">
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <p className="text-xs text-slate-400 font-medium">Total Tenants</p>
          <h3 className="text-2xl font-bold text-indigo-400 mt-2">{stats?.tenants ?? 0}</h3>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <p className="text-xs text-slate-400 font-medium">Active Tenants</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">{stats?.activeTenants ?? 0}</h3>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <p className="text-xs text-slate-400 font-medium">Total Users</p>
          <h3 className="text-2xl font-bold text-white mt-2">{stats?.users ?? 0}</h3>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-5">
          <p className="text-xs text-slate-400 font-medium">Platform Revenue</p>
          <h3 className="text-2xl font-bold text-indigo-400 mt-2">${Number(stats?.revenue ?? 0).toFixed(2)}</h3>
        </Card>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 p-4">
        <h3 className="font-semibold text-white mb-4">Tenant Management</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs">
                <th className="pb-3 font-medium">Tenant Name</th>
                <th className="pb-3 font-medium">Owner</th>
                <th className="pb-3 font-medium">Business Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenants.map(({ tenant, owner }) => (
                <tr key={tenant.id}>
                  <td className="py-3 font-medium text-white">{tenant.name}</td>
                  <td className="py-3 text-slate-400">{owner.name} ({owner.email})</td>
                  <td className="py-3">{tenant.businessType}</td>
                  <td className="py-3">
                    <Badge variant={tenant.status === "active" ? "default" : "destructive"}>
                      {tenant.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => statusMutation.mutate({ tenantId: tenant.id, status: tenant.status === "active" ? "suspended" : "active" })}
                      className="border-slate-700 bg-slate-800 text-xs"
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
