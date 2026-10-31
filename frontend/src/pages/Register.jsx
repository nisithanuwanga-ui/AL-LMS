import { Link } from "react-router-dom";
import BrandLockup from "../components/BrandLockup";
import LanguageSelector from "../components/LanguageSelector";
import ThemeToggle from "../components/ThemeToggle";
import { useLanguage } from "../contexts/useLanguage";

function Register() {
  const { t } = useLanguage();

  return (
    <div className="app-shell auth-layout">
      <div className="auth-topbar">
        <BrandLockup />
        <div className="auth-preferences">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      <main className="auth-panel glass-panel">
        <span className="eyebrow">{t("auth.startChapter")}</span>
        <h1 className="auth-title">{t("auth.registerTitle")}</h1>
        <p className="auth-copy">{t("auth.registerCopy")}</p>

        <label className="form-label" htmlFor="name">{t("auth.name")}</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          className="form-control"
          placeholder={t("auth.namePlaceholder")}
        />

        <label className="form-label" htmlFor="email">{t("auth.email")}</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="form-control"
          placeholder={t("auth.emailPlaceholder")}
        />

        <label className="form-label" htmlFor="password">{t("auth.password")}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="form-control"
          placeholder={t("auth.createPasswordPlaceholder")}
        />

        <div className="auth-notice" role="note">{t("auth.registerNotice")}</div>
        <button className="primary-button auth-submit" type="button" disabled>
          {t("auth.registerSoon")}
        </button>
        <p className="auth-footer">
          {t("auth.alreadyRegistered")} <Link to="/login" className="text-link">{t("auth.login")}</Link>
        </p>
        <Link to="/" className="text-link auth-back">{t("auth.backHome")}</Link>
      </main>
    </div>
  );
}

export default Register;