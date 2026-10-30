import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";

const LESSONS_API_URL = "http://localhost:5000/api/lessons";
const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Combined Mathematics",
];
const EMPTY_FORM = {
  title: "",
  subject: "",
  description: "",
  lessonUrl: "",
  notesUrl: "",
  status: "draft",
};

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

function getApiError(data, fallback) {
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.join(" ");
  }

  return data.message || fallback;
}

function lessonMatchesFilters(lesson, search, subject) {
  const matchesTitle = lesson.title
    .toLocaleLowerCase()
    .includes(search.trim().toLocaleLowerCase());
  return matchesTitle && (!subject || lesson.subject === subject);
}

function TeacherDashboard() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lessonError, setLessonError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState("");
  const submissionLock = useRef(false);
  const deletionLocks = useRef(new Set());

  const requestLessons = useCallback(async (searchTerm, subject, signal) => {
    const url = new URL(LESSONS_API_URL);
    if (searchTerm.trim()) url.searchParams.set("search", searchTerm.trim());
    if (subject) url.searchParams.set("subject", subject);

    const response = await fetch(url, { signal });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(getApiError(data, "Unable to load lessons."));
    }

    if (!Array.isArray(data.data)) {
      throw new Error("The server returned an invalid lessons response.");
    }

    return data.data;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setLessonError("");
      try {
        const loadedLessons = await requestLessons(
          search,
          subjectFilter,
          controller.signal,
        );
        if (!controller.signal.aborted) setLessons(loadedLessons);
      } catch (error) {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setLessonError(getErrorMessage(error, "Unable to load lessons."));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, search.trim() ? 300 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestLessons, search, subjectFilter, refreshKey]);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormData((currentForm) => ({ ...currentForm, [name]: value }));
    setFormError("");
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingLesson(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  }

  function openCreateForm() {
    setEditingLesson(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(lesson) {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title || "",
      subject: lesson.subject || "",
      description: lesson.description || "",
      lessonUrl: lesson.lessonUrl || "",
      notesUrl: lesson.notesUrl || "",
      status: lesson.status || "draft",
    });
    setFormError("");
    setIsFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionLock.current) return;

    const title = formData.title.trim();
    const description = formData.description.trim();
    const errors = [];

    if (title.length < 3 || title.length > 150) {
      errors.push("Title must contain between 3 and 150 characters.");
    }

    if (!SUBJECTS.includes(formData.subject)) {
      errors.push("Please select a valid subject.");
    }

    if (description.length === 0 || description.length > 2000) {
      errors.push("Description is required and cannot exceed 2000 characters.");
    }

    for (const [label, value] of [
      ["Lesson URL", formData.lessonUrl],
      ["Notes URL", formData.notesUrl],
    ]) {
      if (value.trim()) {
        try {
          const url = new URL(value.trim());
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            errors.push(`${label} must use http or https.`);
          }
        } catch {
          errors.push(`${label} must be a valid URL.`);
        }
      }
    }

    if (errors.length > 0) {
      setFormError(errors.join(" "));
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(
        editingLesson
          ? `${LESSONS_API_URL}/${encodeURIComponent(editingLesson._id)}`
          : LESSONS_API_URL,
        {
          method: editingLesson ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            title,
            description,
            lessonUrl: formData.lessonUrl.trim(),
            notesUrl: formData.notesUrl.trim(),
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            `Unable to ${editingLesson ? "update" : "create"} the lesson.`,
          ),
        );
      }

      if (!data.data || typeof data.data !== "object") {
        throw new Error("The server did not return the saved lesson.");
      }

      const savedLesson = data.data;
      setLessons((currentLessons) => {
        const remainingLessons = currentLessons.filter(
          (lesson) => lesson._id !== savedLesson._id,
        );
        if (!lessonMatchesFilters(savedLesson, search, subjectFilter)) {
          return remainingLessons;
        }
        return [savedLesson, ...remainingLessons];
      });
      setLessonError("");
      setActionError("");
      setRefreshKey((key) => key + 1);
      closeForm();
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          `Unable to ${editingLesson ? "update" : "create"} the lesson.`,
        ),
      );
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleDelete(lesson) {
    if (deletionLocks.current.size > 0) return;
    const confirmed = window.confirm(
      `Delete "${lesson.title}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    deletionLocks.current.add(lesson._id);
    setDeletingLessonId(lesson._id);
    setActionError("");

    try {
      const response = await fetch(
        `${LESSONS_API_URL}/${encodeURIComponent(lesson._id)}`,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getApiError(data, "Unable to delete the lesson."));
      }

      setLessons((currentLessons) =>
        currentLessons.filter((currentLesson) => currentLesson._id !== lesson._id),
      );
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to delete the lesson."));
    } finally {
      deletionLocks.current.delete(lesson._id);
      setDeletingLessonId("");
    }
  }

  return (
    <div className="app-shell dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Teaching workspace</span>
            <h1 className="page-title">Teacher Dashboard</h1>
            <p className="dashboard-subtitle">
              Your classes and course tools, together.
            </p>
          </div>
        </header>

        <div className="metrics-grid">
          <DashboardCard title="Total Students" value="250" />
          <DashboardCard title="Total Lessons" value={isLoading ? "…" : lessons.length} />
          <DashboardCard title="Total Quizzes" value="20" />
        </div>

        <section className="quick-actions glass-panel" aria-labelledby="quick-actions-title">
          <h2 className="quick-actions-title" id="quick-actions-title">
            Quick Actions
          </h2>
          <div className="actions-list">
            <button className="secondary-button" type="button">
              + Create Course
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={openCreateForm}
              disabled={isSubmitting}
            >
              + Upload Lesson
            </button>
            <button className="secondary-button" type="button">
              + Create Quiz
            </button>
          </div>

          {isFormOpen && (
            <form className="lesson-form" onSubmit={handleSubmit} noValidate>
              <div className="lesson-form-heading">
                <h3>{editingLesson ? "Edit lesson" : "Upload a lesson"}</h3>
                <button
                  className="lesson-form-close"
                  type="button"
                  onClick={closeForm}
                  aria-label="Close lesson form"
                  disabled={isSubmitting}
                >
                  Close
                </button>
              </div>

              {formError && (
                <p className="form-feedback form-feedback-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="lesson-form-grid">
                <label className="lesson-form-field">
                  <span>Lesson title</span>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    minLength={3}
                    maxLength={150}
                    required
                    disabled={isSubmitting}
                  />
                </label>

                <label className="lesson-form-field">
                  <span>Subject</span>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select a subject</option>
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="lesson-form-field lesson-form-field-wide">
                  <span>Description</span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    maxLength={2000}
                    required
                    rows={4}
                    disabled={isSubmitting}
                  />
                </label>

                <label className="lesson-form-field">
                  <span>Lesson URL (optional)</span>
                  <input
                    name="lessonUrl"
                    type="url"
                    value={formData.lessonUrl}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                  />
                </label>

                <label className="lesson-form-field">
                  <span>Notes URL (optional)</span>
                  <input
                    name="notesUrl"
                    type="url"
                    value={formData.notesUrl}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                  />
                </label>

                <label className="lesson-form-field">
                  <span>Status</span>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>

              <div className="lesson-form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={closeForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? editingLesson ? "Saving…" : "Uploading…"
                    : editingLesson ? "Save Changes" : "Upload Lesson"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="lessons-section" aria-labelledby="lessons-title">
          <div className="lessons-heading">
            <div>
              <span className="eyebrow">Your teaching library</span>
              <h2 className="quick-actions-title" id="lessons-title">
                Lessons
              </h2>
            </div>
            <span className="lessons-count">
              {!isLoading && !lessonError &&
                `${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}`}
            </span>
          </div>

          <div className="lesson-filters">
            <label className="lesson-filter-field">
              <span>Search by title</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search lessons"
                aria-label="Search lessons by title"
              />
            </label>
            <label className="lesson-filter-field">
              <span>Filter by subject</span>
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                aria-label="Filter lessons by subject"
              >
                <option value="">All subjects</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {actionError && (
            <p className="form-feedback form-feedback-error" role="alert">
              {actionError}
            </p>
          )}

          {isLoading ? (
            <p className="lessons-feedback" role="status">Loading lessons…</p>
          ) : lessonError ? (
            <div className="lessons-feedback lessons-feedback-error" role="alert">
              <p>{lessonError}</p>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
              >
                Try again
              </button>
            </div>
          ) : lessons.length === 0 ? (
            <p className="lessons-feedback">
              {search.trim() || subjectFilter
                ? "No lessons match your search or subject filter."
                : "No lessons yet. Use “Upload Lesson” to add your first lesson."}
            </p>
          ) : (
            <div className="lessons-list">
              {lessons.map((lesson) => (
                <article className="lesson-card glass-panel" key={lesson._id}>
                  <div className="lesson-card-content">
                    <div className="lesson-card-heading">
                      <h3>{lesson.title}</h3>
                      <span className={`lesson-badge lesson-badge-${lesson.status}`}>
                        {lesson.status}
                      </span>
                      <div className="lesson-card-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => openEditForm(lesson)}
                          disabled={isSubmitting || Boolean(deletingLessonId)}
                        >
                          Edit
                        </button>
                        <button
                          className="secondary-button lesson-delete-button"
                          type="button"
                          onClick={() => handleDelete(lesson)}
                          disabled={Boolean(deletingLessonId) || isSubmitting || isFormOpen}
                        >
                          {deletingLessonId === lesson._id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                    <p className="lesson-card-subject">{lesson.subject}</p>
                    <p className="lesson-card-description">{lesson.description}</p>
                    {(lesson.lessonUrl || lesson.notesUrl) && (
                      <div className="lesson-card-links">
                        {lesson.lessonUrl && (
                          <a href={lesson.lessonUrl} target="_blank" rel="noreferrer">
                            Open lesson
                          </a>
                        )}
                        {lesson.notesUrl && (
                          <a href={lesson.notesUrl} target="_blank" rel="noreferrer">
                            Open notes
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default TeacherDashboard;
