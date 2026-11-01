import { Link } from "react-router-dom";
import BrandLockup from "../components/BrandLockup";
import LanguageSelector from "../components/LanguageSelector";
import ThemeToggle from "../components/ThemeToggle";
import { useLanguage } from "../contexts/useLanguage";

const pathways = [
  {
    id: "courses",
    number: "01",
    titleKey: "home.courseTitle",
    descriptionKey: "home.courseDescription",
    statusKey: "home.learningPreview",
    available: true,
    href: "/courses",
    actionKey: "home.explorePublished",
  },
  {
    id: "study-packs",
    number: "02",
    titleKey: "home.studyPackTitle",
    descriptionKey: "home.studyPackDescription",
    statusKey: "home.comingSoon",
    available: false,
  },
  {
    id: "printed-books",
    number: "03",
    titleKey: "home.booksTitle",
    descriptionKey: "home.booksDescription",
    statusKey: "home.comingSoon",
    available: false,
  },
  {
    id: "teachers",
    number: "04",
    titleKey: "home.teacherTitle",
    descriptionKey: "home.teacherDescription",
    statusKey: "home.comingSoon",
    available: false,
  },
];

function Home() {
  const { t } = useLanguage();

  return (
    <div className="app-shell public-site">
      <header className="site-nav">
        <nav className="site-nav-inner page-width" aria-label={t("nav.main")}>
          <BrandLockup className="public-brand" />

          <div className="public-nav-links">
            <Link className="nav-link" to="/courses">{t("nav.courses")}</Link>
            <a className="nav-link" href="#study-packs">{t("nav.studyPacks")}</a>
            <a className="nav-link" href="#printed-books">{t("nav.books")}</a>
            <a className="nav-link" href="#teachers">{t("nav.teachers")}</a>
          </div>

          <div className="nav-actions">
            <LanguageSelector />
            <ThemeToggle />
            <Link to="/login" className="nav-link nav-login">{t("nav.login")}</Link>
            <Link to="/student/dashboard" className="primary-button nav-cta">
              {t("nav.exploreLessons")}
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="home-hero-wrap">
          <div className="home-hero page-width">
            <div className="home-hero-copy">
              <span className="eyebrow">{t("home.eyebrow")}</span>
              <h1 className="hero-title">
                {t("home.titleStart")} <span>{t("home.titleEnd")}</span>
              </h1>
              <p className="hero-copy">{t("home.intro")}</p>
              <div className="hero-actions">
                <Link to="/student/dashboard" className="primary-button hero-cta">
                  {t("home.browseLessons")} <span aria-hidden="true">→</span>
                </Link>
                <a href="#learning-options" className="hero-secondary-link">
                  {t("home.explorePlatform")}
                </a>
              </div>
              <p className="hero-caption">{t("home.caption")}</p>
            </div>

            <div className="hero-visual" aria-label={t("home.previewCopy")}>
              <div className="hero-visual-topline">
                <span className="hero-visual-kicker">{t("home.previewLabel")}</span>
                <span className="hero-visual-mark" aria-hidden="true">A/L</span>
              </div>
              <div className="hero-visual-intro">
                <span className="hero-visual-overline">{t("home.learnIntentionally")}</span>
                <h2>{t("home.oneStep")}</h2>
                <p>{t("home.previewCopy")}</p>
              </div>
              <div className="hero-path-list">
                <div className="hero-path-row">
                  <span className="hero-path-icon" aria-hidden="true">01</span>
                  <span className="hero-path-name">{t("home.publishedLessons")}</span>
                  <span className="hero-path-state">{t("home.explore")}</span>
                </div>
                <div className="hero-path-row">
                  <span className="hero-path-icon" aria-hidden="true">02</span>
                  <span className="hero-path-name">{t("home.studyPackTitle")}</span>
                  <span className="hero-path-state hero-path-state-soon">{t("home.soon")}</span>
                </div>
                <div className="hero-path-row">
                  <span className="hero-path-icon" aria-hidden="true">03</span>
                  <span className="hero-path-name">{t("home.booksTitle")}</span>
                  <span className="hero-path-state hero-path-state-soon">{t("home.soon")}</span>
                </div>
              </div>
              <div className="hero-visual-footer">
                <span className="hero-footer-dot" aria-hidden="true" />
                <span>{t("home.keepGoals")}</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="learning-section page-width"
          id="learning-options"
          aria-labelledby="learning-heading"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("home.sectionEyebrow")}</span>
              <h2 className="section-title" id="learning-heading">
                {t("home.sectionTitle")}
              </h2>
            </div>
            <p className="section-intro">
              {t("home.sectionIntro")}
            </p>
          </div>

          <div className="pathway-grid">
            {pathways.map((pathway) => (
              <article
                className={`pathway-card ${pathway.available ? "pathway-card-featured" : ""}`}
                id={pathway.id}
                key={pathway.id}
              >
                <div className="pathway-card-topline">
                  <span className="pathway-number">{pathway.number}</span>
                  <span
                    className={`pathway-status ${pathway.available ? "pathway-status-live" : ""}`}
                  >
                    {t(pathway.statusKey)}
                  </span>
                </div>
                <h3>{t(pathway.titleKey)}</h3>
                <p>{t(pathway.descriptionKey)}</p>
                {pathway.available ? (
                  <Link className="pathway-link" to={pathway.href}>
                    {t(pathway.actionKey)} <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <span className="pathway-note">{t("home.detailsSoon")}</span>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="learning-note-wrap">
          <div className="learning-note page-width">
            <div className="learning-note-mark" aria-hidden="true">A</div>
            <div>
              <span className="eyebrow">{t("home.longRun")}</span>
              <h2>{t("home.progressTitle")}</h2>
              <p>{t("home.progressCopy")}</p>
            </div>
            <Link to="/student/dashboard" className="secondary-button note-link">
              {t("home.studentPreview")}
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner page-width">
          <BrandLockup className="footer-brand" />
          <p>{t("home.footer")}</p>
          <span className="footer-note">
            <span>{t("home.developedBy")}</span>
            <strong>Nisitha Sandanayake</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
