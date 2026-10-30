import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import DashboardCard from "./DashboardCard";

const LESSONS_API_URL = "http://localhost:5000/api/lessons";
const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Combined Mathematics",
];

function getApiError(data, fallback) {
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.join(" ");
  }

  return data.message || fallback;
}

function getSafeExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname
    ) {
      return url.href;
    }
  } catch {
    return null;
  }

  return null;
}

function formatCreatedDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function StudentDashboard() {
  const [lessons, setLessons] = useState([]);
  const [subject, setSubject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLessons() {
      setIsLoading(true);
      setError("");

      const url = new URL(LESSONS_API_URL);
      url.searchParams.set("status", "published");
      if (subject) url.searchParams.set("subject", subject);

      try {
        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(getApiError(data, "Unable to load published lessons."));
        }

        if (!Array.isArray(data.data)) {
          throw new Error("The server returned an invalid lessons response.");
        }

        if (!controller.signal.aborted) {
          setLessons(data.data.filter((lesson) => lesson.status === "published"));
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load published lessons.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadLessons();

    return () => controller.abort();
  }, [subject, retryCount]);

  return (
    <div className="app-shell dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Your learning at a glance</span>
            <h1 className="page-title">Student Dashboard</h1>
            <p className="dashboard-subtitle">
              Explore published lessons and continue learning.
            </p>
          </div>
        </header>

        <div className="metrics-grid student-metrics-grid">
          <DashboardCard
            title="Published Lessons"
            value={isLoading ? "…" : lessons.length}
          />
        </div>

        <section
          className="student-lessons-section"
          aria-labelledby="student-lessons-title"
        >
          <div className="student-lessons-heading">
            <div>
              <span className="eyebrow">Ready to learn</span>
              <h2 className="quick-actions-title" id="student-lessons-title">
                Published Lessons
              </h2>
            </div>

            <label className="student-subject-filter">
              <span>Subject</span>
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                aria-label="Filter published lessons by subject"
              >
                <option value="">All Subjects</option>
                {SUBJECTS.map((lessonSubject) => (
                  <option key={lessonSubject} value={lessonSubject}>
                    {lessonSubject}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <p className="lessons-feedback" role="status">
              Loading published lessons…
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
                Try again
              </button>
            </div>
          ) : lessons.length === 0 ? (
            <p className="lessons-feedback">
              {subject
                ? `No published ${subject} lessons are available yet.`
                : "No published lessons are available yet."}
            </p>
          ) : (
            <div className="student-lessons-list">
              {lessons.map((lesson) => {
                const lessonUrl = getSafeExternalUrl(lesson.lessonUrl);
                const notesUrl = getSafeExternalUrl(lesson.notesUrl);
                const createdDate = formatCreatedDate(lesson.createdAt);

                return (
                  <article
                    className="student-lesson-card glass-panel"
                    key={lesson._id}
                  >
                    <div className="student-lesson-header">
                      <div>
                        <p className="student-lesson-subject">{lesson.subject}</p>
                        <h3>{lesson.title}</h3>
                      </div>
                      {createdDate && (
                        <time
                          className="student-lesson-date"
                          dateTime={lesson.createdAt}
                        >
                          Published {createdDate}
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
                            Watch lesson
                          </a>
                        )}
                        {notesUrl && (
                          <a
                            href={notesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View notes
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
