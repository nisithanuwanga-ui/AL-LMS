import BrandLockup from "./BrandLockup";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";
import LearningIllustration from "./LearningIllustration";
import { useLanguage } from "../contexts/useLanguage";

function AuthPageLayout({ children, pageClassName = "" }) {
  const { t } = useLanguage();

  return (
    <div className={`app-shell auth-experience ${pageClassName}`.trim()}>
      <header className="auth-experience-header">
        <BrandLockup />
        <div className="auth-preferences">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </header>
      <main className="auth-experience-main">
        <section className="auth-story-panel" aria-label={t("auth.storyLabel")}>
          <div className="auth-story-copy">
            <span className="auth-story-kicker">{t("auth.storyKicker")}</span>
            <h1>{t("auth.storyTitle")}</h1>
            <p>{t("auth.storyCopy")}</p>
            <div className="auth-story-points">
              <span><i aria-hidden="true">01</i>{t("auth.storyPointOne")}</span>
              <span><i aria-hidden="true">02</i>{t("auth.storyPointTwo")}</span>
            </div>
          </div>
          <LearningIllustration />
          <p className="auth-story-tagline">{t("brand.tagline")}</p>
        </section>
        <section className="auth-form-panel">
          {children}
        </section>
      </main>
    </div>
  );
}

export default AuthPageLayout;
