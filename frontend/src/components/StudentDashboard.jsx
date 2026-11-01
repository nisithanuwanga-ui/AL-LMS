import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentDashboardSidebar from "./StudentDashboardSidebar";
import DashboardCard from "./DashboardCard";
import { useLanguage } from "../contexts/useLanguage";
import { languageLocales } from "../i18n/translations";
import { useAuth } from "../contexts/useAuth";
import { apiRequest, getApiErrorMessage } from "../services/api";
import { getSafeExternalUrl } from "../services/safeUrl";

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Combined Mathematics",
];

function formatCreatedDate(value, locale) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function StudentDashboard() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const locale = languageLocales[language];
  const [lessons, setLessons] = useState([]);
  const [subject, setSubject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [enrollmentError, setEnrollmentError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLessons() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ status: "published" });
        const { data } = await apiRequest(`/lessons?${params}`, {
          signal: controller.signal,
        });

        if (!Array.isArray(data.data)) {
          throw new Error(t("student.invalidResponse"));
        }

        if (!controller.signal.aborted) {
          setLessons(data.data.filter((lesson) => lesson.status === "published"));
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            getApiErrorMessage(requestError, t, t("student.loadError")),
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadLessons();

    return () => controller.abort();
  }, [retryCount, t]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEnrollments() {
      if (!user) {
        setEnrollments([]);
        setEnrollmentLoading(false);
        return;
      }
      setEnrollmentLoading(true);
      setEnrollmentError("");
      try {
        const { data } = await apiRequest("/enrollments/mine", { signal: controller.signal });
        if (!Array.isArray(data.data)) throw new Error(t("courses.invalidResponse"));
        if (!controller.signal.aborted) setEnrollments(data.data);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setEnrollmentError(getApiErrorMessage(requestError, t, t("courses.loadError")));
        }
      } finally {
        if (!controller.signal.aborted) setEnrollmentLoading(false);
      }
    }
    loadEnrollments();
    return () => controller.abort();
  }, [user, t]);

  function getSubjectLabel(value) {
    const subjectKeys = {
      Physics: "subject.physics",
      Chemistry: "subject.chemistry",
      Biology: "subject.biology",
      "Combined Mathematics": "subject.maths",
    };
    return subjectKeys[value] ? t(subjectKeys[value]) : value;
  }

  const availableSubjects = [...new Set(lessons.map((lesson) => lesson.subject))];
  const visibleLessons = subject
    ? lessons.filter((lesson) => lesson.subject === subject)
    : lessons;

  return (
    <div className="app-shell dashboard-layout">
      <StudentDashboardSidebar />

      <main className="dashboard-main">
        <header className="dashboard-header student-dashboard-header">
          <div className="student-welcome-copy">
            <span className="eyebrow">{t("student.eyebrow")}</span>
            <h1 className="page-title">{t("student.welcomeHeading", { name: user?.name || "" })}</h1>
            <p className="dashboard-subtitle">
              {t("student.subtitle")}
            </p>
          </div>
          <div className="student-profile-chip">
            <span className="student-avatar" aria-hidden="true">
              {(user?.name || "S").trim().charAt(0).toUpperCase()}
            </span>
            <span>
              <strong>{user?.name || t("student.profile")}</strong>
              <small>{user?.email}</small>
              <small>{t("role.student")}</small>
            </span>
          </div>
        </header>

        <div className="metrics-grid student-metrics-grid">
          <DashboardCard
            title={t("student.publishedCount")}
            value={isLoading ? "…" : lessons.length}
          />
          <DashboardCard
            title={t("student.subjectsInView")}
            value={isLoading ? "…" : availableSubjects.length}
          />
          <DashboardCard
            title={t("student.learningProgress")}
            value={t("student.notAvailable")}
          />
        </div>

        <section className="student-section" id="my-courses" aria-labelledby="student-courses-title">
          <div className="student-section-heading">
            <div>
              <span className="eyebrow">{t("student.learningSpace")}</span>
              <h2 className="quick-actions-title" id="student-courses-title">{t("student.myCourses")}</h2>
            </div>
            <p>{t("student.coursesDescription")}</p>
          </div>
          {enrollmentLoading ? (
            <p className="lessons-feedback" role="status">{t("courses.loading")}</p>
          ) : enrollmentError ? (
            <p className="lessons-feedback lessons-feedback-error" role="alert">{enrollmentError}</p>
          ) : enrollments.length === 0 ? (
            <div className="lessons-feedback">
              <p>{t("courses.noEnrollments")}</p>
              <Link className="text-link" to="/courses">{t("courses.browseTitle")}</Link>
            </div>
          ) : (
            <div className="student-course-grid">
              {enrollments.map((item) => {
                const enrolledCourse = item.courseId;
                if (!enrolledCourse) return null;
                return (
                  <Link
                    className="student-course-card glass-panel"
                    key={item._id}
                    to={`/courses/${enrolledCourse._id}`}
                  >
                    <span className="student-course-symbol" aria-hidden="true">
                      {enrolledCourse.subject.slice(0, 1)}
                    </span>
                    <span className="student-course-name">{enrolledCourse.title}</span>
                    <span className="student-course-count">{getSubjectLabel(enrolledCourse.subject)} · {enrolledCourse.medium}</span>
                    <span className="student-course-action">{t("courses.continue")} <span aria-hidden="true">→</span></span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <div className="student-feature-grid">
          <section className="student-feature-card glass-panel" aria-labelledby="student-progress-title">
            <span className="student-feature-icon" aria-hidden="true">↗</span>
            <h2 id="student-progress-title">{t("student.progressTitle")}</h2>
            <p>{t("student.progressUnavailable")}</p>
            <span className="student-unavailable-value">{t("student.notAvailable")}</span>
          </section>
          <section className="student-feature-card glass-panel" id="live-classes" aria-labelledby="student-live-title">
            <span className="student-feature-icon" aria-hidden="true">◷</span>
            <h2 id="student-live-title">{t("student.liveClasses")}</h2>
            <p>{t("student.liveClassesEmpty")}</p>
          </section>
          <section className="student-feature-card glass-panel" id="study-packs" aria-labelledby="student-packs-title">
            <span className="student-feature-icon" aria-hidden="true">▧</span>
            <h2 id="student-packs-title">{t("student.studyPacks")}</h2>
            <p>{t("student.studyPacksEmpty")}</p>
          </section>
        </div>

        <section
          className="student-lessons-section"
          id="continue-learning"
          aria-labelledby="student-lessons-title"
        >
          <div className="student-lessons-heading">
            <div>
              <span className="eyebrow">{t("student.continueLearning")}</span>
              <h2 className="quick-actions-title" id="student-lessons-title">
                {t("student.publishedLessons")}
              </h2>
            </div>

            <label className="student-subject-filter">
              <span>{t("student.subject")}</span>
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                aria-label={t("student.filterLabel")}
              >
                <option value="">{t("subject.all")}</option>
                {SUBJECTS.map((lessonSubject) => (
                  <option key={lessonSubject} value={lessonSubject}>
                    {getSubjectLabel(lessonSubject)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <p className="lessons-feedback" role="status">
              {t("student.loading")}
            </p>
          ) : error ? (
            <div
              className="lessons-feedback lessons-feedback-error"
              role="alert"
            >
              <p>{error}</p>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                {t("student.retry")}
              </button>
            </div>
          ) : visibleLessons.length === 0 ? (
            <p className="lessons-feedback">
              {subject
                ? t("student.subjectEmpty", { subject: getSubjectLabel(subject) })
                : t("student.empty")}
            </p>
          ) : (
            <div className="student-lessons-list">
              {visibleLessons.map((lesson) => {
                const lessonUrl = getSafeExternalUrl(lesson.lessonUrl);
                const notesUrl = getSafeExternalUrl(lesson.notesUrl);
                const createdDate = formatCreatedDate(lesson.createdAt, locale);

                return (
                  <article
                    className="student-lesson-card glass-panel"
                    key={lesson._id}
                  >
                    <div className="student-lesson-header">
                      <div>
                        <p className="student-lesson-subject">{getSubjectLabel(lesson.subject)}</p>
                        <h3>{lesson.title}</h3>
                      </div>
                      {createdDate && (
                        <time
                          className="student-lesson-date"
                          dateTime={lesson.createdAt}
                        >
                          {t("student.publishedOn")} {createdDate}
                        </time>
                      )}
                    </div>
                    <p className="student-lesson-description">
                      {lesson.description}
                    </p>
                    {(lessonUrl || notesUrl) && (
                      <div className="student-lesson-links">
                        {lessonUrl && (
                          <a
                            href={lessonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("student.watch")}
                          </a>
                        )}
                        {notesUrl && (
                          <a
                            href={notesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("student.notes")}
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
