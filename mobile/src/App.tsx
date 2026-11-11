import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { cartOutline, cubeOutline, ellipsisHorizontalCircleOutline, homeOutline, receiptOutline } from "ionicons/icons";
import { useEffect, type ReactElement } from "react";
import { Navigate, Route, useLocation } from "react-router-dom";
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "./theme.css";
import Protected from "~/components/Protected";
import { startQueueRunner, useQueue } from "~/lib/offline";
import { useSession } from "~/lib/session";
import Activity from "~/pages/Activity";
import { Login, Signup } from "~/pages/Auth";
import Categories from "~/pages/Categories";
import Customers from "~/pages/Customers";
import Expenses from "~/pages/Expenses";
import Home from "~/pages/Home";
import Inventory from "~/pages/Inventory";
import More from "~/pages/More";
import Onboarding from "~/pages/Onboarding";
import Orders from "~/pages/Orders";
import Purchases from "~/pages/Purchases";
import Reports from "~/pages/Reports";
import Sell from "~/pages/Sell";
import Settings from "~/pages/Settings";
import Shifts from "~/pages/Shifts";
import Suppliers from "~/pages/Suppliers";
import Team from "~/pages/Team";

setupIonicReact({ mode: "md" });

const guard = (page: ReactElement) => <Protected>{page}</Protected>;

function Shell() {
  const { pathname } = useLocation();
  const s = useSession();
  const queue = useQueue().length;
  const flow = ["/welcome", "/login", "/signup"].some(p => pathname.startsWith(p));
  useEffect(() => startQueueRunner(), []);
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/welcome" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={guard(<Home />)} />
        <Route path="/sell" element={guard(<Sell />)} />
        <Route path="/orders" element={guard(<Orders />)} />
        <Route path="/inventory" element={guard(<Inventory />)} />
        <Route path="/more" element={guard(<More />)} />
        <Route path="/more/customers" element={guard(<Customers />)} />
        <Route path="/more/expenses" element={guard(<Expenses />)} />
        <Route path="/more/shifts" element={guard(<Shifts />)} />
        <Route path="/more/reports" element={guard(<Reports />)} />
        <Route path="/more/team" element={guard(<Team />)} />
        <Route path="/more/activity" element={guard(<Activity />)} />
        <Route path="/more/settings" element={guard(<Settings />)} />
        <Route path="/more/categories" element={guard(<Categories />)} />
        <Route path="/more/suppliers" element={guard(<Suppliers />)} />
        <Route path="/more/purchases" element={guard(<Purchases />)} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom" style={flow ? { display: "none" } : undefined}>
        <IonTabButton tab="home" href="/home"><IonIcon icon={homeOutline} /><IonLabel>Home</IonLabel></IonTabButton>
        <IonTabButton tab="sell" href="/sell" style={s.role && !s.can.sell ? { display: "none" } : undefined}><IonIcon icon={cartOutline} /><IonLabel>Sell</IonLabel></IonTabButton>
        <IonTabButton tab="orders" href="/orders"><IonIcon icon={receiptOutline} /><IonLabel>Orders</IonLabel></IonTabButton>
        <IonTabButton tab="inventory" href="/inventory"><IonIcon icon={cubeOutline} /><IonLabel>Inventory</IonLabel></IonTabButton>
        <IonTabButton tab="more" href="/more"><IonIcon icon={ellipsisHorizontalCircleOutline} /><IonLabel>More{queue ? ` (${queue})` : ""}</IonLabel></IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

export default function MobileApp() {
  return (
    <IonApp>
      <IonReactRouter>
        <Shell />
      </IonReactRouter>
    </IonApp>
  );
}
