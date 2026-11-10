import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, type LucideIcon } from "lucide-react";

/* ───────── page scaffolding ───────── */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-2xl font-extrabold tracking-[-0.015em] text-slate-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatTile({ label, value, hint, icon: Icon, tone = "bg-teal-50 text-teal-600" }: { label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon; tone?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-12px_rgba(15,23,42,0.08)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${tone}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-2.5 truncate text-xl font-extrabold leading-none tracking-tight text-slate-900 sm:mt-3 sm:text-2xl">{value}</p>
      {hint && <p className="mt-2 text-[11px] font-medium leading-snug text-slate-400 sm:mt-2.5">{hint}</p>}
    </div>
  );
}

/* ───────── small visual helpers ───────── */

const AVATAR_TONES = [
  "bg-teal-100 text-teal-700", "bg-indigo-100 text-indigo-700", "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700", "bg-emerald-100 text-emerald-700", "bg-orange-100 text-orange-700",
];

export function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const parts = name.trim().split(/\s+/);
  const text = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return <span className={`flex shrink-0 items-center justify-center rounded-full font-bold ${size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs"} ${AVATAR_TONES[h % AVATAR_TONES.length]}`}>{text}</span>;
}

export function Pill({ children, tone = "slate", dot = false }: { children: ReactNode; tone?: "slate" | "teal" | "indigo" | "rose" | "amber" | "emerald" | "violet" | "sky"; dot?: boolean }) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600 ring-slate-200", teal: "bg-teal-50 text-teal-700 ring-teal-200", indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200", amber: "bg-amber-50 text-amber-700 ring-amber-200", emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200", sky: "bg-sky-50 text-sky-700 ring-sky-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${map[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function relativeTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const fmtTime = (d: Date | string) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/* ───────── search + toolbar ───────── */

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${value === o.value ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"}`}>{o.label}</button>
      ))}
    </div>
  );
}

/* ───────── data table ───────── */

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  sortValue?: (row: T) => string | number;
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
};

type ServerPaging = { page: number; pageSize: number; total: number; onPageChange: (p: number) => void };

const hideClass = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" } as const;

export function DataTable<T>({
  columns, rows, rowKey, loading, toolbar, empty, pageSize = 12, server, onRowClick, footer,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  toolbar?: ReactNode;
  empty: { icon: LucideIcon; title: string; hint: string; action?: ReactNode };
  pageSize?: number;
  server?: ServerPaging;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [clientPage, setClientPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort || server) return rows;
    const col = columns.find(c => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const f = col.sortValue;
    return [...rows].sort((a, b) => {
      const x = f(a), y = f(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, columns, server]);

  const size = server?.pageSize ?? pageSize;
  const total = server?.total ?? sorted.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(server?.page ?? clientPage, pages);
  const view = server ? sorted : sorted.slice((page - 1) * size, page * size);
  const goto = (p: number) => (server ? server.onPageChange(p) : setClientPage(p));
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const E = empty.icon;

  const toggleSort = (c: Column<T>) => {
    if (!c.sortValue || server) return;
    setClientPage(1);
    setSort(s => (s?.key !== c.key ? { key: c.key, dir: "asc" } : s.dir === "asc" ? { key: c.key, dir: "desc" } : null));
  };

  const pageNumbers = useMemo(() => {
    const set = new Set([1, pages, page - 1, page, page + 1]);
    const list = Array.from(set).filter(p => p >= 1 && p <= pages).sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    list.forEach((p, i) => { if (i && p - list[i - 1] > 1) out.push("…"); out.push(p); });
    return out;
  }, [page, pages]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-12px_rgba(15,23,42,0.08)]">
      {toolbar && <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">{toolbar}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map(c => {
                const active = sort?.key === c.key;
                const Icon = !c.sortValue || server ? null : active ? (sort!.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={c.key} className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""} ${c.hideBelow ? hideClass[c.hideBelow] : ""}`}>
                    {c.sortValue && !server ? (
                      <button type="button" onClick={() => toggleSort(c)} className={`inline-flex items-center gap-1.5 uppercase tracking-wider transition hover:text-slate-900 ${active ? "text-slate-900" : ""} ${c.align === "right" ? "flex-row-reverse" : ""}`}>
                        {c.header}{Icon && <Icon className={`h-3 w-3 ${active ? "text-teal-600" : "text-slate-300"}`} />}
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{columns.map(c => <td key={c.key} className={`px-5 py-4 ${c.hideBelow ? hideClass[c.hideBelow] : ""}`}><div className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${55 + ((i * 17 + c.key.length * 9) % 40)}%` }} /></td>)}</tr>
                ))
              : view.map(row => (
                  <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`transition-colors hover:bg-teal-50/40 ${onRowClick ? "cursor-pointer" : ""}`}>
                    {columns.map(c => <td key={c.key} className={`px-5 py-3.5 align-middle ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""} ${c.hideBelow ? hideClass[c.hideBelow] : ""} ${c.className ?? ""}`}>{c.cell(row)}</td>)}
                  </tr>
                ))}
          </tbody>
          {footer && !loading && view.length > 0 && <tfoot>{footer}</tfoot>}
        </table>
        {!loading && view.length === 0 && (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><E className="h-5 w-5 text-slate-400" /></span>
            <p className="mt-4 text-sm font-semibold text-slate-800">{empty.title}</p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">{empty.hint}</p>
            {empty.action && <div className="mt-5">{empty.action}</div>}
          </div>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">Showing <span className="font-semibold text-slate-800">{from.toLocaleString()}–{to.toLocaleString()}</span> of <span className="font-semibold text-slate-800">{total.toLocaleString()}</span></p>
          {pages > 1 && (
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button type="button" onClick={() => goto(page - 1)} disabled={page <= 1} aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              {pageNumbers.map((p, i) => p === "…"
                ? <span key={`e${i}`} className="px-1.5 text-xs text-slate-400">…</span>
                : <button key={p} type="button" onClick={() => goto(p)} aria-current={p === page ? "page" : undefined} className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${p === page ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{p}</button>)}
              <button type="button" onClick={() => goto(page + 1)} disabled={page >= pages} aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
