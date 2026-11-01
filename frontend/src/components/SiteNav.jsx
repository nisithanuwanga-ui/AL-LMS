import { Link } from "react-router-dom";
import BrandLockup from "./BrandLockup";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";
import { useLanguage } from "../contexts/useLanguage";

function SiteNav() {
  const { t } = useLanguage();
  return (
    <header className="site-nav">
      <nav className="site-nav-inner page-width" aria-label={t("nav.main")}>
        <BrandLockup className="public-brand" />
        <div className="public-nav-links">
          <Link className="nav-link" to="/courses">{t("nav.courses")}</Link>
          <Link className="nav-link" to="/">{t("nav.home")}</Link>
        </div>
        <div className="nav-actions">
          <LanguageSelector />
          <ThemeToggle />
          <Link to="/login" className="nav-link nav-login">{t("nav.login")}</Link>
          <Link to="/courses" className="primary-button nav-cta">{t("courses.browseTitle")}</Link>
        </div>
      </nav>
    </header>
  );
}

export default SiteNav;
