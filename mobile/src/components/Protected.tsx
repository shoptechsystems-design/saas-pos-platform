import { KaryanoMark } from "~/components/Logo";
import { useEffect, useRef, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession, useAuthActions } from "~/lib/session";
import { setToken, useOnboarded } from "~/lib/platform";

function BootScreen() {
  return <div style={{ display: "grid", placeItems: "center", height: "100%", background: "#0b1220" }}><KaryanoMark size={76} className="boot-pulse" /></div>;
}

/** Onboarding first, then sign-in, then the app. Handles offline start-up and accounts without a workspace. */
export default function Protected({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded();
  const s = useSession();
  const { logout } = useAuthActions();
  const rechecked = useRef(false);
  // A dead token is only dropped after the server said "no session" twice in a row (one retry after 1.2 s).
  useEffect(() => {
    if (!s.invalid) { rechecked.current = false; return; }
    if (!rechecked.current) { rechecked.current = true; const t = setTimeout(s.retry, 1200); return () => clearTimeout(t); }
    setToken(null);
  }, [s.invalid, s.meUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!onboarded) return <Navigate to="/welcome" replace />;
  if (!s.token) return <Navigate to="/login" replace />;
  if (s.loading) return <BootScreen />;
  if (s.unreachable) {
    return (
      <div className="auth" style={{ justifyContent: "center", textAlign: "center" }}>
        <h2 className="h1">Can't reach the server</h2>
        <p className="muted">Check your connection and try again. Sales you ring up while offline are saved on this device and sent when you reconnect.</p>
        <button className="btn btn-primary btn-block" onClick={s.retry}>Try again</button>
        <button className="btn btn-block" onClick={() => setToken(null)}>Back to sign in</button>
      </div>
    );
  }
  if (s.noWorkspace) {
    return (
      <div className="auth" style={{ justifyContent: "center", textAlign: "center" }}>
        <h2 className="h1">No active workspace</h2>
        <p className="muted">This account isn't a member of an active business. Ask the business owner to add you, or sign in with a different account.</p>
        <button className="btn btn-primary btn-block" onClick={() => logout()}>Sign out</button>
      </div>
    );
  }
  if (!s.authed) return <BootScreen />;
  return <>{children}</>;
}
