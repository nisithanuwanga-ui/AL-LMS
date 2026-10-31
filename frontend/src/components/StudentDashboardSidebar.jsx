import { NavLink, useNavigate } from "react-router-dom";
import BrandLockup from "./BrandLockup";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";
import { getApiErrorMessage } from "../services/api";

function StudentDashboardSidebar() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      navigate("/login", {
        replace: true,
        state: { notice: getApiErrorMessage(error, t, t("auth.logoutError")) },
      });
      return;
    }
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar student-sidebar">
      <BrandLockup className="sidebar-brand" />
      <span className="sidebar-label">{t("nav.workspace")}</span>
      <nav className="sidebar-nav" aria-label={t("nav.main")}>
        <NavLink to="/student/dashboard" end className="sidebar-link">
          <span aria-hidden="true">⌂</span>{t("student.navOverview")}
        </NavLink>
        <a className="sidebar-link" href="#my-courses">
          <span aria-hidden="true">▤</span>{t("student.myCourses")}
        </a>
        <a className="sidebar-link" href="#study-packs">
          <span aria-hidden="true">▧</span>{t("student.studyPacks")}
        </a>
        <a className="sidebar-link" href="#live-classes">
          <span aria-hidden="true">◷</span>{t("student.liveClasses")}
        </a>
      </nav>

      <div className="student-sidebar-account">
        <span className="student-avatar" aria-hidden="true">
          {(user?.name || "S").trim().charAt(0).toUpperCase()}
        </span>
        <span className="student-account-copy">
          <strong>{user?.name || t("student.profile")}</strong>
          <span>{user?.email}</span>
          <span>{t("role.student")}</span>
        </span>
        <button className="student-signout" type="button" onClick={handleLogout}>
          {t("auth.logout")}
        </button>
      </div>

      <div className="sidebar-bottom">
        <span className="sidebar-caption">{t("nav.appearance")}</span>
        <div className="sidebar-preferences">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

export default StudentDashboardSidebar;
