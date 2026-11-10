import { useEffect, useState } from "react";
import { Package, Receipt, Search, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { moneyWhole } from "@/lib/format";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import SaleDrawer from "@/components/SaleDrawer";

export type NavTarget = { id: string; label: string; icon: React.ElementType };

export default function CommandPalette({ open, onOpenChange, pages, onNavigate }: { open: boolean; onOpenChange: (o: boolean) => void; pages: NavTarget[]; onNavigate: (tab: string) => void }) {
  const [q, setQ] = useState("");
  const [saleId, setSaleId] = useState<number | null>(null);
  const [debounced, setDebounced] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 200); return () => clearTimeout(t); }, [q]);
  useEffect(() => { if (!open) setQ(""); }, [open]);
  const res = trpc.search.global.useQuery({ q: debounced }, { enabled: open && debounced.length >= 2, placeholderData: p => p });

  const go = (tab: string) => { onNavigate(tab); onOpenChange(false); };
  const hasResults = !!res.data && (res.data.products.length || res.data.customers.length || res.data.sales.length);

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Jump to a page or find products, customers and sales">
        <CommandInput value={q} onValueChange={setQ} placeholder="Search products, customers, orders or jump to a page…" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>{debounced.length >= 2 && res.isFetching ? "Searching…" : "No results found."}</CommandEmpty>
          {debounced.length >= 2 && hasResults && <>
            {!!res.data!.products.length && <CommandGroup heading="Products">{res.data!.products.map(p => (
              <CommandItem key={`p${p.id}`} value={`product ${p.name} ${p.sku}`} onSelect={() => go("products")}><Package className="mr-2 h-4 w-4 text-slate-400" /><span className="flex-1 truncate">{p.name} <span className="font-mono text-xs text-slate-400">{p.sku}</span></span><span className="text-xs text-slate-500">{moneyWhole(p.price)} · {p.stock} in stock</span></CommandItem>))}</CommandGroup>}
            {!!res.data!.customers.length && <CommandGroup heading="Customers">{res.data!.customers.map(c => (
              <CommandItem key={`c${c.id}`} value={`customer ${c.name} ${c.email} ${c.phone}`} onSelect={() => go("customers")}><Users className="mr-2 h-4 w-4 text-slate-400" /><span className="flex-1 truncate">{c.name}</span><span className="text-xs text-slate-500">{c.phone || c.email}</span></CommandItem>))}</CommandGroup>}
            {!!res.data!.sales.length && <CommandGroup heading="Sales">{res.data!.sales.map(s => (
              <CommandItem key={`s${s.id}`} value={`sale ${s.saleNumber}`} onSelect={() => { onOpenChange(false); setSaleId(s.id); }}><Receipt className="mr-2 h-4 w-4 text-slate-400" /><span className="flex-1 font-mono text-xs">{s.saleNumber}</span><span className="text-xs text-slate-500">{moneyWhole(s.total)}</span></CommandItem>))}</CommandGroup>}
          </>}
          <CommandGroup heading="Go to">{pages.map(p => (
            <CommandItem key={p.id} value={`go ${p.label}`} onSelect={() => go(p.id)}><p.icon className="mr-2 h-4 w-4 text-slate-400" />{p.label}</CommandItem>))}</CommandGroup>
        </CommandList>
      </CommandDialog>
      <SaleDrawer saleId={saleId} onClose={() => setSaleId(null)} />
    </>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="group hidden h-10 w-64 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-400 shadow-sm transition hover:border-slate-300 md:flex lg:w-80" aria-label="Open search">
      <Search className="h-4 w-4" /><span className="flex-1 truncate">Search products, customers, orders…</span>
      <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">⌘K</kbd>
    </button>
  );
}
