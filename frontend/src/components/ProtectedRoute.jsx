import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";
import { getProtectedRouteDecision, getRoleHome } from "../auth/access";

function AuthLoading() {
  const { t } = useLanguage();
  return (
    <main className="auth-state-page">
      <div className="glass-panel auth-state-card" role="status">
        <span className="eyebrow">{t("brand.name")}</span>
        <p>{t("route.checkingSession")}</p>
      </div>
    </main>
  );
}

export default function ProtectedRoute({
  roles,
  allowPendingTeacher = false,
  allowPublic = false,
  children,
}) {
  const { user, status, authError, refreshSession } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  const decision = getProtectedRouteDecision(status, user, roles, {
    allowPendingTeacher,
    allowPublic,
  });

  if (decision.type === "loading") return <AuthLoading />;
  if (decision.type === "error") {
    return (
      <main className="auth-state-page">
        <div className="glass-panel auth-state-card" role="alert">
          <h1>{t("route.sessionErrorTitle")}</h1>
          <p>{authError}</p>
          <button className="primary-button" type="button" onClick={refreshSession}>
            {t("route.retry")}
          </button>
        </div>
      </main>
    );
  }
  if (decision.type === "redirect") {
    return (
      <Navigate
        to={decision.to}
        replace
        state={decision.to === "/login" ? { from: location } : undefined}
      />
    );
  }
  return children;
}

export function AuthenticatedRedirect() {
  const { user, status } = useAuth();
  if (status === "loading") return <AuthLoading />;
  if (status === "authenticated" && user) {
    return <Navigate to={getRoleHome(user)} replace />;
  }
  return <Navigate to="/login" replace />;
}
