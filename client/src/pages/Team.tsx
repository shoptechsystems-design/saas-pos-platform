import { useMemo, useState } from "react";
import { Loader2, Plus, ShieldCheck, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, Initials, PageHeader, Pill, SearchBox, StatTile, fmtDate, type Column } from "@/components/data/kit";

type Row = RouterOutputs["team"]["list"][number];

const ROLE_META: Record<string, { label: string; tone: "teal" | "indigo" | "amber"; blurb: string }> = {
  tenant_admin: { label: "Tenant admin", tone: "teal", blurb: "Full access to every area of the workspace." },
  cashier: { label: "Cashier", tone: "indigo", blurb: "Runs the POS terminal and manages customers." },
  inventory_manager: { label: "Inventory manager", tone: "amber", blurb: "Manages products, stock and purchase orders." },
};

export default function TeamView() {
  const { user } = useAuth();
  const q = trpc.team.list.useQuery();
  const utils = trpc.useUtils();
  const team = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "cashier" as "cashier" | "inventory_manager" });
  const [search, setSearch] = useState("");

  const invite = trpc.team.invite.useMutation({
    onSuccess: async () => {
      toast.success("Team member added.");
      setOpen(false);
      setForm({ name: "", email: "", role: "cashier" });
      await utils.team.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return team.filter(({ user: u }) => !s || (u.name ?? "").toLowerCase().includes(s) || (u.email ?? "").toLowerCase().includes(s));
  }, [team, search]);

  const columns: Column<Row>[] = [
    { key: "member", header: "Team member", sortValue: r => (r.user.name ?? "").toLowerCase(), cell: r => (
      <div className="flex items-center gap-3"><Initials name={r.user.name ?? "?"} />
        <div className="min-w-0"><p className="flex items-center gap-2 font-semibold text-slate-900">{r.user.name}{r.user.id === user?.id && <Pill tone="slate">You</Pill>}</p><p className="truncate text-xs text-slate-500">{r.user.email}</p></div></div>) },
    { key: "role", header: "Role", sortValue: r => r.membership.role, cell: r => { const m = ROLE_META[r.membership.role]; return <div><Pill tone={m?.tone ?? "slate"}>{m?.label ?? r.membership.role}</Pill><p className="mt-1 hidden text-[11px] text-slate-400 lg:block">{m?.blurb}</p></div>; } },
    { key: "status", header: "Status", cell: r => <Pill tone={r.membership.status === "active" ? "emerald" : "slate"} dot>{r.membership.status === "active" ? "Active" : r.membership.status}</Pill> },
    { key: "since", header: "Added", align: "right", hideBelow: "md", sortValue: r => new Date(r.membership.createdAt).getTime(), cell: r => <span className="text-xs text-slate-500">{fmtDate(r.membership.createdAt)}</span> },
  ];

  const inputCls = "mt-1.5 h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900";
  const admins = team.filter(t => t.membership.role === "tenant_admin").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Team & roles" description="Control who can access your workspace and what they can do." actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="h-10 rounded-xl bg-slate-900 px-4 font-semibold text-white hover:bg-slate-700"><Plus className="mr-2 h-4 w-4" /> Add team member</Button></DialogTrigger>
          <DialogContent className="rounded-2xl border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
            <DialogHeader><DialogTitle className="text-xl font-bold">Add team member</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><label className="text-xs font-semibold text-slate-600">Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sarah Khan" className={inputCls} /></div>
              <div><label className="text-xs font-semibold text-slate-600">Email (must have registered already)</label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="sarah@example.com" className={inputCls} /></div>
              <div><label className="text-xs font-semibold text-slate-600">Role</label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as typeof form.role })}>
                  <SelectTrigger className={`${inputCls} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900"><SelectItem value="cashier">Cashier</SelectItem><SelectItem value="inventory_manager">Inventory manager</SelectItem></SelectContent>
                </Select>
                <p className="mt-1.5 text-[11px] text-slate-500">{ROLE_META[form.role].blurb}</p></div>
              <Button onClick={() => invite.mutate(form)} disabled={invite.isPending || form.name.trim().length < 2 || !form.email} className="mt-2 h-11 w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-700">
                {invite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{invite.isPending ? "Adding…" : "Add to workspace"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>} />

      <div className="stat-grid cols-3">
        <StatTile label="Team members" value={team.length} hint="with access to this workspace" icon={Users} />
        <StatTile label="Administrators" value={admins} hint="full access" icon={ShieldCheck} tone="bg-indigo-50 text-indigo-600" />
        <StatTile label="Staff" value={team.length - admins} hint="cashiers & inventory managers" icon={UserCog} tone="bg-orange-50 text-orange-600" />
      </div>

      <DataTable columns={columns} rows={filtered} rowKey={r => r.membership.id} loading={q.isLoading} pageSize={10}
        toolbar={<SearchBox value={search} onChange={setSearch} placeholder="Search team…" />}
        empty={{ icon: Users, title: "No team members found", hint: "Add cashiers and inventory managers to share the workload." }} />
    </div>
  );
}
