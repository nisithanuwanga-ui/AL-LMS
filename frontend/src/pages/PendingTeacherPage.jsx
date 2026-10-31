import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";

function PendingTeacherPage() {
  const { user, refreshSession } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="app-shell dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">{t("route.teacherAccess")}</span>
            <h1 className="page-title">{t("route.pendingTitle")}</h1>
            <p className="dashboard-subtitle">
              {t("route.pendingCopy", { name: user?.name || "" })}
            </p>
          </div>
        </header>
        <section className="glass-panel pending-notice">
          <span className="pending-status-badge">{t("route.pendingBadge")}</span>
          <h2>{t("route.pendingHeading")}</h2>
          <p>{t("route.pendingDetails")}</p>
          <button className="secondary-button" type="button" onClick={refreshSession}>
            {t("route.checkApproval")}
          </button>
        </section>
      </main>
    </div>
  );
}

export default PendingTeacherPage;
