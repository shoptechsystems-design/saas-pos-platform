import { IonIcon } from "@ionic/react";
import { personAddOutline, peopleOutline, lockClosedOutline } from "ionicons/icons";
import { useState } from "react";
import { Async, Card, Empty, Field, Pill, Row, Screen, Seg, Sheet, useNotify } from "~/components/ui";
import { initials, roleLabel } from "~/lib/format";
import { tap } from "~/lib/native";
import { useAct, useList } from "~/lib/queries";
import { api } from "~/lib/rest";
import { useSession } from "~/lib/session";
import type { TeamRow } from "~/lib/types";

type InviteRole = "cashier" | "inventory_manager";

export default function Team() {
  const s = useSession(); const n = useNotify();
  const q = useList<TeamRow[]>(["team"], "/team", s.can.admin);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "" }); const [role, setRole] = useState<InviteRole>("cashier"); const [err, setErr] = useState("");
  const invite = useAct((b: object) => api.post("/team/invite", b), ["team"]);
  const submit = async () => {
    if (f.name.trim().length < 2) return setErr("Enter the person's name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setErr("Enter a valid email address.");
    setErr("");
    try { await invite.mutateAsync({ name: f.name.trim(), email: f.email.trim().toLowerCase(), role }); n.ok("Team member added"); setF({ name: "", email: "" }); setOpen(false); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not add this person."); }
  };
  if (!s.can.admin) return <Screen title="Team" back="/more"><Empty icon={lockClosedOutline} title="Owner access only" hint="Only the business owner / admin can manage the team." /></Screen>;
  return (
    <Screen title="Team" subtitle="Cashiers and inventory managers" back="/more" onRefresh={() => q.refetch()} right={<button className="icon-btn" aria-label="Invite" onClick={() => { tap(); setOpen(true); }}><IonIcon icon={personAddOutline} /></button>}>
      <Async q={q} empty={d => d.length ? null : <Empty icon={peopleOutline} title="No team members" />}>
        {d => <Card pad={false} className="divide">{d.map(m => (
          <div className="list-row" key={m.membership.id}>
            <div className="avatar round">{initials(m.user.name)}</div>
            <div className="grow"><div className="bold ellipsis" style={{ color: "var(--c-navy)" }}>{m.user.name ?? "Unnamed"}{m.user.id === s.user?.id ? " (you)" : ""}</div><div className="small muted ellipsis">{m.user.email}</div></div>
            <div className="stack" style={{ gap: 4, alignItems: "flex-end" }}><Pill tone={m.membership.role === "tenant_admin" ? "teal" : "info"}>{roleLabel(m.membership.role)}</Pill>{m.membership.status !== "active" && <Pill tone="warn">{m.membership.status}</Pill>}</div>
          </div>
        ))}</Card>}
      </Async>
      <div className="banner info"><span className="grow">Cashiers can sell and manage customers. Inventory managers handle products, stock and purchasing.</span></div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add team member">
        <div className="banner warn">The person must create their Karyano account first (Sign up in the app). Then add them here with the same email.</div>
        <Field label="Name"><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Full name" /></Field>
        <Field label="Email" error={err}><input className="input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} inputMode="email" autoCapitalize="none" placeholder="name@email.com" /></Field>
        <Field label="Role"><Seg value={role} onChange={setRole} options={[{ value: "cashier", label: "Cashier" }, { value: "inventory_manager", label: "Inventory" }]} /></Field>
        <button className="btn btn-primary btn-block" disabled={invite.isPending} onClick={submit}>{invite.isPending ? "Adding…" : "Add to team"}</button>
      </Sheet>
    </Screen>
  );
}
