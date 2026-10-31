import { NavLink } from "react-router-dom";
import BrandLockup from "./BrandLockup";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";
import { useLanguage } from "../contexts/useLanguage";

function Sidebar() {
  const { t } = useLanguage();

  return (
    <aside className="sidebar">
      <BrandLockup className="sidebar-brand" />

      <span className="sidebar-label">{t("nav.workspace")}</span>
      <nav className="sidebar-nav" aria-label={t("nav.main")}>
        <NavLink to="/" end className="sidebar-link">{t("nav.home")}</NavLink>
        <NavLink to="/student/dashboard" className="sidebar-link">{t("nav.studentDashboard")}</NavLink>
        <NavLink to="/teacher/dashboard" className="sidebar-link">{t("nav.teacherDashboard")}</NavLink>
        <NavLink to="/login" className="sidebar-link">{t("nav.login")}</NavLink>
        <NavLink to="/register" className="sidebar-link">{t("nav.register")}</NavLink>
      </nav>

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