import { IonIcon } from "@ionic/react";
import { barChartOutline, bookOutline, businessOutline, cashOutline, cubeOutline, documentTextOutline, logOutOutline, peopleOutline, pricetagsOutline, settingsOutline, shieldCheckmarkOutline, timeOutline, walletOutline } from "ionicons/icons";
import { useNavigate } from "react-router-dom";
import QueueBanner from "~/components/QueueBanner";
import { Card, Row, Screen, useNotify } from "~/components/ui";
import { initials, roleLabel } from "~/lib/format";
import { getApiBase } from "~/lib/platform";
import { useAuthActions, useSession } from "~/lib/session";

export default function More() {
  const s = useSession(); const nav = useNavigate(); const { logout } = useAuthActions(); const { confirm } = useNotify();
  const item = (icon: string, tone: string, title: string, sub: string, to: string) => <Row key={to} icon={icon} tone={tone} title={title} sub={sub} onClick={() => nav(to)} right={<span className="faint">›</span>} />;
  return (
    <Screen title="More">
      <Card><div className="row"><div className="avatar round" style={{ width: 54, height: 54, fontSize: 18 }}>{initials(s.user?.name)}</div>
        <div className="grow"><div className="h2">{s.user?.name ?? "Account"}</div><div className="small muted ellipsis">{s.user?.email}</div><div className="small" style={{ color: "var(--c-teal)", fontWeight: 700 }}>{roleLabel(s.role)} · {s.tenant?.name}</div></div></div></Card>
      <QueueBanner currency={s.tenant?.currency} />

      <div className="section-title">Sales & customers</div>
      <Card pad={false}><div className="divide">
        {item(peopleOutline, "blue", "Customers", "Contacts, groups and statements", "/more/customers")}
        {item(cashOutline, "green", "Shifts", "Open and close the register", "/more/shifts")}
        {item(walletOutline, "amber", "Expenses", "Track business spending", "/more/expenses")}
      </div></Card>

      {s.can.catalog && <>
        <div className="section-title">Stock & purchasing</div>
        <Card pad={false}><div className="divide">
          {item(bookOutline, "navy", "Purchase orders", "Order and receive stock", "/more/purchases")}
          {item(businessOutline, "blue", "Suppliers", "Vendors you buy from", "/more/suppliers")}
          {s.can.admin && item(pricetagsOutline, "teal", "Categories", "Organise your catalog", "/more/categories")}
        </div></Card>
      </>}

      {s.can.admin && <>
        <div className="section-title">Business</div>
        <Card pad={false}><div className="divide">
          {item(barChartOutline, "green", "Reports", "Profit, sales and PDF reconciliation", "/more/reports")}
          {item(shieldCheckmarkOutline, "navy", "Team", "Cashiers and inventory managers", "/more/team")}
          {item(timeOutline, "amber", "Activity log", "Who changed what", "/more/activity")}
        </div></Card>
      </>}

      <div className="section-title">Settings</div>
      <Card pad={false}><div className="divide">
        {item(settingsOutline, "teal", "Business settings", "Name, tax, receipt footer, logo", "/more/settings")}
        <Row icon={cubeOutline} tone="navy" title="Server" sub={getApiBase() || "Not set"} />
        <Row icon={documentTextOutline} tone="navy" title="OmniPOS Mobile" sub="Version 1.0.0 · same data as the web portal" />
      </div></Card>
      <button className="btn btn-danger btn-block" onClick={() => confirm("Sign out?", "Sales saved offline stay on this phone and sync after you sign in again.", "Sign out", () => logout(), true)}><IonIcon icon={logOutOutline} /> Sign out</button>
    </Screen>
  );
}
