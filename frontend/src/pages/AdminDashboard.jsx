import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import DashboardCard from "../components/DashboardCard";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/useLanguage";
import { apiRequest, getApiErrorMessage } from "../services/api";

function getSection(pathname) {
  if (pathname.endsWith("/approved")) return "approved";
  if (pathname.endsWith("/rejected")) return "rejected";
  if (pathname.endsWith("/pending")) return "pending";
  return "overview";
}

function AdminDashboard() {
  const { t } = useLanguage();
  const location = useLocation();
  const section = getSection(location.pathname);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [selectedAction, setSelectedAction] = useState(null);
  const [processingId, setProcessingId] = useState("");
  const [feedback, setFeedback] = useState(null);
  const approvalLock = useRef(false);

  useEffect(() => {
    if (section !== "overview" && section !== "pending") {
      return undefined;
    }

    const controller = new AbortController();
    async function loadPendingTeachers() {
      setIsLoading(true);
      setLoadError("");
      try {
        const { data } = await apiRequest("/admin/teachers/pending", {
          signal: controller.signal,
        });
        if (!Array.isArray(data?.data)) {
          throw new Error(t("admin.invalidResponse"));
        }
        if (!controller.signal.aborted) setPendingTeachers(data.data);
      } catch (error) {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setLoadError(getApiErrorMessage(error, t, t("admin.loadError")));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadPendingTeachers();
    return () => controller.abort();
  }, [section, retryCount, t]);

  async function submitApproval() {
    if (!selectedAction || approvalLock.current) return;
    const { user, action } = selectedAction;
    approvalLock.current = true;
    setProcessingId(user.id);
    setFeedback(null);
    try {
      await apiRequest(`/admin/teachers/${encodeURIComponent(user.id)}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setSelectedAction(null);
      setFeedback({
        type: "success",
        message: t(action === "approve" ? "admin.approveSuccess" : "admin.rejectSuccess", {
          name: user.name,
        }),
      });
      setRetryCount((count) => count + 1);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getApiErrorMessage(error, t, t("admin.actionError")),
      });
    } finally {
      approvalLock.current = false;
      setProcessingId("");
    }
  }

  const pageTitle =
    section === "pending"
      ? t("admin.pendingTitle")
      : section === "approved"
        ? t("admin.approvedTitle")
        : section === "rejected"
          ? t("admin.rejectedTitle")
          : t("admin.title");

  return (
    <div className="app-shell dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">{t("admin.eyebrow")}</span>
            <h1 className="page-title">{pageTitle}</h1>
            <p className="dashboard-subtitle">{t("admin.subtitle")}</p>
          </div>
        </header>

        <nav className="admin-tabs" aria-label={t("admin.navigation")}>
          <Link className={section === "overview" ? "admin-tab active" : "admin-tab"} to="/admin">
            {t("admin.overview")}
          </Link>
          <Link className={section === "pending" ? "admin-tab active" : "admin-tab"} to="/admin/teachers/pending">
            {t("admin.pendingTitle")}
          </Link>
          <Link className={section === "approved" ? "admin-tab active" : "admin-tab"} to="/admin/teachers/approved">
            {t("admin.approvedTitle")}
          </Link>
          <Link className={section === "rejected" ? "admin-tab active" : "admin-tab"} to="/admin/teachers/rejected">
            {t("admin.rejectedTitle")}
          </Link>
        </nav>

        {feedback && (
          <p
            className={`form-feedback ${feedback.type === "error" ? "form-feedback-error" : "form-feedback-success"}`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        )}

        {section === "overview" && (
          <>
            <div className="metrics-grid admin-metrics-grid">
              <DashboardCard
                title={t("admin.pendingCount")}
                value={isLoading ? "…" : loadError ? "—" : pendingTeachers.length}
              />
              <DashboardCard title={t("admin.approvedCount")} value="—" />
              <DashboardCard title={t("admin.rejectedCount")} value="—" />
            </div>
            <section className="glass-panel admin-info-panel">
              <h2>{t("admin.overviewInfoTitle")}</h2>
              <p>{t("admin.countsUnavailable")}</p>
              <Link className="primary-button" to="/admin/teachers/pending">
                {t("admin.reviewPending")}
              </Link>
            </section>
            {loadError && (
              <div className="lessons-feedback lessons-feedback-error" role="alert">
                <p>{loadError}</p>
                <button className="secondary-button" type="button" onClick={() => setRetryCount((count) => count + 1)}>
                  {t("student.retry")}
                </button>
              </div>
            )}
          </>
        )}

        {section === "pending" && (
          <section className="admin-content-section" aria-labelledby="pending-list-title">
            <div className="admin-section-heading">
              <div>
                <span className="eyebrow">{t("admin.reviewQueue")}</span>
                <h2 className="quick-actions-title" id="pending-list-title">
                  {t("admin.pendingTitle")}
                </h2>
              </div>
              {!isLoading && !loadError && (
                <span className="lessons-count">
                  {t("admin.applicationCount", { count: pendingTeachers.length })}
                </span>
              )}
            </div>

            {isLoading ? (
              <p className="lessons-feedback" role="status">{t("admin.loading")}</p>
            ) : loadError ? (
              <div className="lessons-feedback lessons-feedback-error" role="alert">
                <p>{loadError}</p>
                <button className="secondary-button" type="button" onClick={() => setRetryCount((count) => count + 1)}>
                  {t("student.retry")}
                </button>
              </div>
            ) : pendingTeachers.length === 0 ? (
              <div className="glass-panel admin-empty-state">
                <h3>{t("admin.emptyTitle")}</h3>
                <p>{t("admin.emptyCopy")}</p>
              </div>
            ) : (
              <div className="admin-applications">
                {pendingTeachers.map((teacher) => (
                  <article className="glass-panel admin-application-card" key={teacher.id}>
                    <div className="admin-application-details">
                      <h3>{teacher.name}</h3>
                      <a href={`mailto:${teacher.email}`}>{teacher.email}</a>
                    </div>
                    <span className="pending-status-badge">{t("admin.pendingStatus")}</span>
                    <div className="admin-application-actions">
                      <button
                        className="primary-button"
                        type="button"
                        disabled={Boolean(processingId)}
                        onClick={() => setSelectedAction({ user: teacher, action: "approve" })}
                      >
                        {t("admin.approve")}
                      </button>
                      <button
                        className="secondary-button admin-reject-button"
                        type="button"
                        disabled={Boolean(processingId)}
                        onClick={() => setSelectedAction({ user: teacher, action: "reject" })}
                      >
                        {t("admin.reject")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {(section === "approved" || section === "rejected") && (
          <section className="glass-panel admin-empty-state">
            <h2>{t(section === "approved" ? "admin.approvedTitle" : "admin.rejectedTitle")}</h2>
            <p>{t("admin.historyUnavailable")}</p>
          </section>
        )}
      </main>

      {selectedAction && (
        <div className="confirmation-backdrop">
          <section
            className="glass-panel confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="approval-dialog-title"
            aria-describedby="approval-dialog-copy"
          >
            <span className="eyebrow">{t("admin.confirmation")}</span>
            <h2 id="approval-dialog-title">
              {t(selectedAction.action === "approve" ? "admin.confirmApproveTitle" : "admin.confirmRejectTitle")}
            </h2>
            <p id="approval-dialog-copy">
              {t(selectedAction.action === "approve" ? "admin.confirmApproveCopy" : "admin.confirmRejectCopy", {
                name: selectedAction.user.name,
              })}
            </p>
            <div className="confirmation-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setSelectedAction(null)}
                disabled={Boolean(processingId)}
              >
                {t("auth.cancel")}
              </button>
              <button
                className={selectedAction.action === "approve" ? "primary-button" : "primary-button admin-danger-button"}
                type="button"
                onClick={submitApproval}
                disabled={Boolean(processingId)}
              >
                {processingId ? t("admin.processing") : t("admin.confirmAction")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
