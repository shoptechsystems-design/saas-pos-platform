import { IonContent, IonIcon, IonPage } from "@ionic/react";
import { barChartOutline, cartOutline, cloudOfflineOutline, cubeOutline } from "ionicons/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KaryanoLogo, KaryanoMark } from "~/components/Logo";
import { setOnboarded } from "~/lib/platform";
import { tap } from "~/lib/native";

const SLIDES = [
  { icon: cartOutline, title: "Sell in seconds", body: "Search or scan products, build the cart, take cash, card or transfer — and share a receipt in one tap." },
  { icon: cloudOfflineOutline, title: "Keeps selling offline", body: "No signal? Sales are saved on your phone and sent automatically when you reconnect — never duplicated." },
  { icon: cubeOutline, title: "Stock under control", body: "Live inventory, low-stock alerts, stock adjustments, suppliers and purchase orders — all in your pocket." },
  { icon: barChartOutline, title: "Know your numbers", body: "Daily sales, profit, expenses, shifts and PDF reports — the same data as your Karyano portal, always in sync." },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const last = i === SLIDES.length - 1;
  const finish = (to: string) => { setOnboarded(true); nav(to, { replace: true }); };
  const s = SLIDES[i];
  return (
    <IonPage>
      <IonContent scrollY={false}>
        <div className="ob">
          <div className="row between" style={{ padding: "14px 20px 0" }}>
            <div style={{ color: "var(--c-navy)" }}><KaryanoLogo height={34} /></div>
            {!last && <button className="link" onClick={() => finish("/login")}>Skip</button>}
          </div>
          <div className="ob-art" key={i}>{i === 0 ? <KaryanoMark size={132} className="ob-mark" /> : <div className="badge"><IonIcon icon={s.icon} /></div>}</div>
          <div className="ob-body">
            <div className="dots">{SLIDES.map((_, n) => <i key={n} className={n === i ? "on" : ""} />)}</div>
            <h1>{s.title}</h1>
            <p>{s.body}</p>
            {last ? (
              <div className="stack">
                <button className="btn btn-primary btn-block" onClick={() => { tap(); finish("/signup"); }}>Create your business account</button>
                <button className="btn btn-block" onClick={() => { tap(); finish("/login"); }}>I already have an account</button>
              </div>
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => { tap(); setI(i + 1); }}>Continue</button>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
