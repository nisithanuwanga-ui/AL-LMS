import { NavLink, useNavigate } from "react-router-dom";
import BrandLockup from "./BrandLockup";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";
import { getApiErrorMessage } from "../services/api";

function Sidebar() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      navigate("/login", {
        replace: true,
        state: { notice: getApiErrorMessage(error, t, t("auth.logoutError")) },
      });
    }
  }

  return (
    <aside className="sidebar">
      <BrandLockup className="sidebar-brand" />

      <span className="sidebar-label">{t("nav.workspace")}</span>
      <nav className="sidebar-nav" aria-label={t("nav.main")}>
        <NavLink to="/" end className="sidebar-link">{t("nav.home")}</NavLink>
        {user?.role === "student" && (
          <>
            <NavLink to="/student/dashboard" className="sidebar-link">{t("nav.studentDashboard")}</NavLink>
            <NavLink to="/student/courses" className="sidebar-link">{t("courses.myCourses")}</NavLink>
            <NavLink to="/courses" className="sidebar-link">{t("courses.browseTitle")}</NavLink>
          </>
        )}
        {user?.role === "teacher" && user.approvalStatus === "approved" && (
          <>
            <NavLink to="/teacher/dashboard" className="sidebar-link">{t("nav.teacherDashboard")}</NavLink>
            <NavLink to="/teacher/courses" className="sidebar-link">{t("courses.manageTitle")}</NavLink>
          </>
        )}
        {user?.role === "teacher" && user.approvalStatus === "pending" && (
          <NavLink to="/teacher/pending" className="sidebar-link">{t("route.pendingTitle")}</NavLink>
        )}
        {user?.role === "admin" && (
          <>
            <NavLink to="/admin" end className="sidebar-link">{t("nav.adminDashboard")}</NavLink>
            <NavLink to="/admin/teachers/pending" className="sidebar-link">{t("admin.pendingTitle")}</NavLink>
            <NavLink to="/admin/teachers/approved" className="sidebar-link">{t("admin.approvedTitle")}</NavLink>
            <NavLink to="/admin/teachers/rejected" className="sidebar-link">{t("admin.rejectedTitle")}</NavLink>
          </>
        )}
        {!user && (
          <>
            <NavLink to="/login" className="sidebar-link">{t("nav.login")}</NavLink>
            <NavLink to="/register" className="sidebar-link">{t("nav.register")}</NavLink>
          </>
        )}
      </nav>

      {user && (
        <div className="sidebar-account">
          <span className="sidebar-caption">{t("nav.signedInAs")}</span>
          <strong>{user.name}</strong>
          <span className="sidebar-account-email">{user.email}</span>
          <span className="sidebar-role-badge">{t(`role.${user.role}`)}</span>
          <button className="secondary-button sidebar-logout" type="button" onClick={handleLogout}>
            {t("auth.logout")}
          </button>
        </div>
      )}

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

export default Sidebar;