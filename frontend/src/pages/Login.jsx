import { Link } from "react-router-dom";
import BrandLockup from "../components/BrandLockup";
import LanguageSelector from "../components/LanguageSelector";
import ThemeToggle from "../components/ThemeToggle";
import { useLanguage } from "../contexts/useLanguage";

function Login() {
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
        <span className="eyebrow">{t("auth.welcomeBack")}</span>
        <h1 className="auth-title">{t("auth.loginTitle")}</h1>
        <p className="auth-copy">{t("auth.loginCopy")}</p>

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
          autoComplete="current-password"
          className="form-control"
          placeholder={t("auth.passwordPlaceholder")}
        />

        <div className="auth-notice" role="note">{t("auth.loginNotice")}</div>
        <button className="primary-button auth-submit" type="button" disabled>
          {t("auth.loginSoon")}
        </button>
        <p className="auth-footer">
          {t("auth.needAccount")} <Link to="/register" className="text-link">{t("auth.register")}</Link>
        </p>
        <Link to="/" className="text-link auth-back">{t("auth.backHome")}</Link>
      </main>
    </div>
  );
}

export default Login;