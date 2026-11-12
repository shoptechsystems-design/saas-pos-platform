import { IonIcon } from "@ionic/react";
import { chevronForward, barChartOutline, bookOutline, businessOutline, cashOutline, cubeOutline, documentTextOutline, logOutOutline, peopleOutline, pricetagsOutline, settingsOutline, shieldCheckmarkOutline, timeOutline, walletOutline } from "ionicons/icons";
import { useNavigate } from "react-router-dom";
import QueueBanner from "~/components/QueueBanner";
import { Card, Row, Screen, useNotify } from "~/components/ui";
import { KaryanoMark } from "~/components/Logo";
import { initials, roleLabel } from "~/lib/format";
import { getApiBase } from "~/lib/platform";
import { useAuthActions, useSession } from "~/lib/session";

export default function More() {
  const s = useSession(); const nav = useNavigate(); const { logout } = useAuthActions(); const { confirm } = useNotify();
  const item = (icon: string, tone: string, title: string, sub: string, to: string) => <Row key={to} icon={icon} tone={tone} title={title} sub={sub} onClick={() => nav(to)} right={<IonIcon icon={chevronForward} className="chev" />} />;
  return (
    <Screen title="More">
      <div className="profile">
        <div className="av">{initials(s.user?.name)}</div>
        <div className="grow"><div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }} className="ellipsis">{s.user?.name ?? "Account"}</div>
          <div className="small ellipsis" style={{ color: "rgba(226,232,240,.8)" }}>{s.user?.email}</div>
          <div style={{ marginTop: 6, display: "inline-block", padding: "2px 10px", borderRadius: 99, background: "rgba(94,234,212,.16)", color: "#5eead4", fontSize: 11.5, fontWeight: 800 }}>{roleLabel(s.role)}{s.tenant?.name ? ` · ${s.tenant.name}` : ""}</div></div>
      </div>
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
      </div></Card>
      <button className="btn btn-danger btn-block" onClick={() => confirm("Sign out?", "Sales saved offline stay on this phone and sync after you sign in again.", "Sign out", () => logout(), true)}><IonIcon icon={logOutOutline} /> Sign out</button>
      <div className="about"><KaryanoMark size={30} /><span>Karyano Mobile · Version 1.0.0</span><span className="tiny">Same data as your web portal</span></div>
    </Screen>
  );
}
