import { useInfiniteQuery } from "@tanstack/react-query";
import { lockClosedOutline, pulseOutline } from "ionicons/icons";
import { useState } from "react";
import { Async, Card, Empty, Row, Screen } from "~/components/ui";
import { dateTime, titleCase } from "~/lib/format";
import { api, qs } from "~/lib/rest";
import { useSession } from "~/lib/session";
import type { ActivityRow } from "~/lib/types";

const ENTITIES = ["", "sale", "product", "purchase", "shift", "tenant_settings"];
const PAGE = 20;

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`; if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  return dateTime(iso);
}
/** Show a few useful metadata values without ever throwing on bad JSON. */
function detail(raw: string | null) {
  if (!raw) return "";
  try {
    const m = JSON.parse(raw);
    if (!m || typeof m !== "object") return "";
    return Object.entries(m).filter(([, v]) => v !== null && v !== undefined && typeof v !== "object").slice(0, 3).map(([k, v]) => `${titleCase(k.replace(/([A-Z])/g, " $1").toLowerCase())}: ${String(v)}`).join(" · ");
  } catch { return ""; }
}
const tone = (a: string) => (/delet|refund|cancel/.test(a) ? "red" : /creat|complet|receiv|open/.test(a) ? "green" : /updat|adjust|clos/.test(a) ? "amber" : "navy");

export default function Activity() {
  const s = useSession();
  const [entity, setEntity] = useState("");
  const q = useInfiniteQuery({
    queryKey: ["activity", entity], enabled: s.can.admin, initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<{ rows: ActivityRow[]; total: number }>(`/activity${qs({ page: pageParam, pageSize: PAGE, entity: entity || undefined })}`),
    getNextPageParam: (last, all) => (all.reduce((n, p) => n + p.rows.length, 0) < last.total ? all.length + 1 : undefined),
  });
  if (!s.can.admin) return <Screen title="Activity" back="/more"><Empty icon={lockClosedOutline} title="Owner access only" hint="The audit log is available to the business owner / admin." /></Screen>;
  const rows = q.data?.pages.flatMap(p => p.rows) ?? [];
  return (
    <Screen title="Activity" back="/more" onRefresh={() => q.refetch()}>
      <div className="chips">{ENTITIES.map(e => <button key={e || "all"} className={`chip ${entity === e ? "on" : ""}`} onClick={() => setEntity(e)}>{e ? titleCase(e) : "All"}</button>)}</div>
      <Async q={{ isLoading: q.isLoading, isError: q.isError, error: q.error, data: q.data ? rows : undefined, refetch: q.refetch }} empty={d => d.length ? null : <Empty icon={pulseOutline} title="No activity" hint="Actions taken in the app will appear here." />}>
        {d => <>
          <Card pad={false} className="divide">{d.map(({ log, user }) => (
            <Row key={log.id} icon={pulseOutline} tone={tone(log.action)} title={`${titleCase(log.action)} ${log.entity.replace(/_/g, " ")}${log.entityId ? ` #${log.entityId}` : ""}`}
              sub={[user?.name ?? "System", ago(log.createdAt), detail(log.metadata)].filter(Boolean).join(" · ")} />
          ))}</Card>
          {q.hasNextPage && <button className="btn btn-block" disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>{q.isFetchingNextPage ? "Loading…" : "Load more"}</button>}
        </>}
      </Async>
    </Screen>
  );
}
