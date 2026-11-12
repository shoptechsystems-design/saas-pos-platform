import { IonIcon } from "@ionic/react";
import { add, createOutline, pricetagsOutline, trashOutline } from "ionicons/icons";
import { useState } from "react";
import { Async, Card, Empty, Field, Screen, Sheet, useNotify } from "~/components/ui";
import { useAct, useCategories } from "~/lib/queries";
import { api } from "~/lib/rest";
import type { Category } from "~/lib/types";

const PALETTE = ["#5B6CFF", "#0F766D", "#14B8A6", "#16A34A", "#CA8A04", "#EA580C", "#DC2626", "#DB2777", "#9333EA", "#0EA5E9", "#475569", "#0F172A"];

function CategoryForm({ initial, onClose }: { initial: Category | null; onClose: () => void }) {
  const n = useNotify();
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState((initial?.color ?? PALETTE[0]).toUpperCase());
  const [error, setError] = useState("");
  const save = useAct((b: { name: string; color: string }) => (initial ? api.put(`/categories/${initial.id}`, b) : api.post("/categories", b)), ["categories", "products"]);
  const submit = async () => {
    if (name.trim().length < 2) return setError("Enter a name (at least 2 characters).");
    try { await save.mutateAsync({ name: name.trim(), color }); n.ok(initial ? "Category updated" : "Category added"); onClose(); } catch (e) { n.fail(e); }
  };
  return (
    <>
      <Field label="Name" error={error}><input className="input" value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="e.g. Beverages" autoFocus /></Field>
      <Field label="Colour">
        <div className="row wrap" style={{ gap: 10 }}>
          {PALETTE.map(c => (
            <button key={c} type="button" aria-label={c} onClick={() => setColor(c)} style={{ width: 38, height: 38, borderRadius: 12, border: color === c ? "3px solid var(--c-navy)" : "3px solid transparent", background: c, outline: "1px solid var(--c-line)" }} />
          ))}
        </div>
      </Field>
      <button className="btn btn-primary btn-block" disabled={save.isPending} onClick={submit}>{save.isPending ? "Saving…" : initial ? "Save changes" : "Add category"}</button>
    </>
  );
}

export default function Categories() {
  const q = useCategories();
  const n = useNotify();
  const [form, setForm] = useState<Category | "new" | null>(null);
  const del = useAct((id: number) => api.delete(`/categories/${id}`), ["categories", "products"]);
  const remove = (c: Category) => n.confirm("Delete category?", `"${c.name}" will be removed. Products in it become uncategorised.`, "Delete", async () => { try { await del.mutateAsync(c.id); n.ok("Category deleted"); } catch (e) { n.fail(e); } }, true);

  return (
    <Screen title="Categories" subtitle="Organise your catalog" back="/more" onRefresh={() => q.refetch()} right={<button className="icon-btn" aria-label="Add category" onClick={() => setForm("new")}><IonIcon icon={add} /></button>}>
      <Async q={q} empty={rows => rows.length ? null : <Empty icon={pricetagsOutline} title="No categories yet" hint="Group products so they're quicker to find at the till." action={<button className="btn btn-primary" onClick={() => setForm("new")}>Add category</button>} />}>
        {rows => (
          <Card pad={false}>
            <div className="divide">
              {rows.map(c => (
                <div className="list-row" key={c.id}>
                  <div className="icon-chip" style={{ background: c.color + "22", color: c.color }}><IonIcon icon={pricetagsOutline} /></div>
                  <div className="grow bold ellipsis" style={{ color: "var(--c-navy)" }}>{c.name}</div>
                  <button className="icon-btn" aria-label={`Edit ${c.name}`} onClick={() => setForm(c)}><IonIcon icon={createOutline} /></button>
                  <button className="icon-btn" aria-label={`Delete ${c.name}`} style={{ color: "var(--c-red)" }} onClick={() => remove(c)}><IonIcon icon={trashOutline} /></button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Async>
      <Sheet open={form !== null} onClose={() => setForm(null)} title={form && form !== "new" ? "Edit category" : "New category"}>
        {form !== null && <CategoryForm initial={form === "new" ? null : form} onClose={() => setForm(null)} />}
      </Sheet>
    </Screen>
  );
}
