import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AuthPageLayout from "../components/AuthPageLayout";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";
import { getApiErrorMessage } from "../services/api";

function Register() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionLock.current) return;
    setError("");
    setSuccess("");

    if (name.trim().length < 2 || name.trim().length > 100) {
      setError(t("auth.nameValidation"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t("auth.emailValidation"));
      return;
    }
    if (
      !password.trim() ||
      password.length < 8 ||
      password.length > 128 ||
      new TextEncoder().encode(password).length > 72
    ) {
      setError(t("auth.passwordValidation"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    try {
      const data = await register(role, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setSuccess(
        role === "teacher"
          ? t("auth.teacherPendingSuccess")
          : data.message || t("auth.studentRegisterSuccess"),
      );
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t, t("auth.registerError")));
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout pageClassName="register-experience">
      <div className="auth-panel">
        <span className="eyebrow">{t("auth.startChapter")}</span>
        <h2 className="auth-title">{t("auth.registerTitle")}</h2>
        <p className="auth-copy">{t("auth.registerCopy")}</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <p className="form-feedback form-feedback-error" role="alert">{error}</p>}
          {success && <p className="form-feedback form-feedback-success" role="status">{success}</p>}

          <label className="form-label" htmlFor="name">{t("auth.name")}</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className="form-control"
            placeholder={t("auth.namePlaceholder")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            disabled={isSubmitting}
          />

          <label className="form-label" htmlFor="role">{t("auth.accountType")}</label>
          <select
            id="role"
            name="role"
            className="form-control"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            disabled={isSubmitting}
          >
            <option value="student">{t("auth.studentRole")}</option>
            <option value="teacher">{t("auth.teacherRole")}</option>
          </select>
          {role === "teacher" && (
            <p className="auth-teacher-notice" role="note">{t("auth.teacherApprovalNote")}</p>
          )}

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

          <label className="form-label" htmlFor="password">{t("auth.password")}</label>
          <div className="auth-password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="form-control"
              placeholder={t("auth.createPasswordPlaceholder")}
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

          <label className="form-label" htmlFor="confirm-password">{t("auth.confirmPassword")}</label>
          <input
            id="confirm-password"
            name="confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="form-control"
            placeholder={t("auth.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={isSubmitting}
          />

          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("auth.registering") : t("auth.createAccount")}
          </button>
        </form>

        <p className="auth-footer">
          {t("auth.alreadyRegistered")} <Link to="/login" className="text-link">{t("auth.login")}</Link>
        </p>
        <Link to="/" className="text-link auth-back">{t("auth.backHome")}</Link>
      </div>
    </AuthPageLayout>
  );
}

export default Register;
