import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

function Home() {
  return (
    <div className="app-shell">
      <nav className="site-nav">
        <div className="site-nav-inner page-width">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">A</span>
            <span>AL Learning Hub</span>
          </Link>

          <div className="nav-actions">
            <ThemeToggle />
            <Link to="/login" className="nav-link nav-login">Log in</Link>
            <Link to="/register" className="primary-button">Join the hub</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="home-hero page-width">
          <div>
            <span className="eyebrow">Your A/L study space</span>
            <h1 className="hero-title">
              Make every study session <span>count.</span>
            </h1>
            <p className="hero-copy">
              A calmer place to learn, practise, and see how far you have come.
              Keep your lessons and progress moving in one direction.
            </p>
            <Link to="/register" className="primary-button">Start learning <span aria-hidden="true">&nbsp;→</span></Link>
          </div>

          <div className="hero-visual glass-panel">
            <div className="visual-topline">
              <span className="visual-kicker">STUDY PLAN / THIS WEEK</span>
              <span className="live-dot">On track</span>
            </div>
            <h2 className="visual-heading">A little progress, daily.</h2>
            <p className="visual-subtitle">Your next steps are ready when you are.</p>

            <div className="lesson-row">
              <span className="lesson-index">01</span>
              <div>
                <div className="lesson-name">Functions &amp; graphs</div>
                <div className="lesson-detail">Combined Mathematics · 18 min</div>
              </div>
              <span className="lesson-status">Ready</span>
            </div>
            <div className="lesson-row">
              <span className="lesson-index">02</span>
              <div>
                <div className="lesson-name">Cell structure</div>
                <div className="lesson-detail">Biology · 12 min</div>
              </div>
              <span className="lesson-status">Next</span>
            </div>
            <div className="lesson-row">
              <span className="lesson-index">03</span>
              <div>
                <div className="lesson-name">Electric fields</div>
                <div className="lesson-detail">Physics · 15 min</div>
              </div>
              <span className="lesson-status">Later</span>
            </div>
          </div>
        </section>

        <section className="page-width" aria-labelledby="features-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Built for steady progress</span>
              <h2 className="section-title" id="features-heading">Study with a little more clarity.</h2>
            </div>
          </div>

          <div className="feature-grid">
            <article className="feature-panel glass-panel">
              <span className="feature-number">01 / Learn</span>
              <h3 className="feature-title">Lessons that fit your day</h3>
              <p className="feature-copy">Return to your subjects and pick up right where you left off.</p>
            </article>
            <article className="feature-panel glass-panel">
              <span className="feature-number">02 / Practise</span>
              <h3 className="feature-title">Make knowledge stick</h3>
              <p className="feature-copy">Use focused quizzes to turn revision into a repeatable habit.</p>
            </article>
            <article className="feature-panel glass-panel">
              <span className="feature-number">03 / Reflect</span>
              <h3 className="feature-title">See your progress clearly</h3>
              <p className="feature-copy">Track completed lessons and keep your next goal in view.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;