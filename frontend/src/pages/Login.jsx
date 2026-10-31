import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthPageLayout from "../components/AuthPageLayout";
import { AuthenticatedRedirect } from "../components/ProtectedRoute";
import { getRoleHome } from "../auth/access";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";
import { getApiErrorMessage } from "../services/api";

function Login() {
  const { t } = useLanguage();
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => {
    try {
      return window.localStorage.getItem("nisova-remembered-email") || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(Boolean(email));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);

  if (status === "loading") {
    return (
      <main className="auth-state-page">
        <p role="status">{t("route.checkingSession")}</p>
      </main>
    );
  }
  if (status === "authenticated") return <AuthenticatedRedirect />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionLock.current) return;
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError(t("auth.emailValidation"));
      return;
    }
    if (!password || !password.trim()) {
      setError(t("auth.passwordRequired"));
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    setNotice("");
    try {
      try {
        if (rememberEmail) {
          window.localStorage.setItem("nisova-remembered-email", normalizedEmail);
        } else {
          window.localStorage.removeItem("nisova-remembered-email");
        }
      } catch {
        setNotice(t("auth.rememberUnavailable"));
      }
      const user = await login({ email: normalizedEmail, password });
      navigate(getRoleHome(user), { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t, t("auth.loginError")));
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout pageClassName="login-experience">
      <div className="auth-panel">
        <span className="eyebrow">{t("auth.welcomeBack")}</span>
        <h2 className="auth-title">{t("auth.loginTitle")}</h2>
        <p className="auth-copy">{t("auth.loginCopy")}</p>

        <form onSubmit={handleSubmit} noValidate>
          {location.state?.notice && (
            <p className="form-feedback form-feedback-error" role="status">
              {location.state.notice}
            </p>
          )}
          {error && <p className="form-feedback form-feedback-error" role="alert">{error}</p>}
          {notice && <p className="form-feedback" role="status">{notice}</p>}
          <label className="form-label" htmlFor="email">{t("auth.email")}</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="form-control"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isSubmitting}
          />

          <div className="auth-field-heading">
            <label className="form-label" htmlFor="password">{t("auth.password")}</label>
            <button
              className="text-button"
              type="button"
              onClick={() => setNotice(t("auth.forgotPasswordUnavailable"))}
            >
              {t("auth.forgotPassword")}
            </button>
          </div>
          <div className="auth-password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="form-control"
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="password-visibility-button"
              aria-label={t(showPassword ? "auth.hidePassword" : "auth.showPassword")}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={isSubmitting}
            >
              {t(showPassword ? "auth.hidePassword" : "auth.showPassword")}
            </button>
          </div>

          <label className="auth-remember-option">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(event) => setRememberEmail(event.target.checked)}
              disabled={isSubmitting}
            />
            <span>{t("auth.rememberEmail")}</span>
          </label>

          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("auth.signingIn") : t("auth.login")}
          </button>
        </form>

        <p className="auth-footer">
          {t("auth.needAccount")} <Link to="/register" className="text-link">{t("auth.register")}</Link>
        </p>
        <Link to="/" className="text-link auth-back">{t("auth.backHome")}</Link>
      </div>
    </AuthPageLayout>
  );
}

export default Login;
