import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";
import { useLanguage } from "../contexts/useLanguage";
import { apiRequest, getApiErrorMessage } from "../services/api";

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
  courseId: "",
};

function getErrorMessage(error, t, fallback) {
  return getApiErrorMessage(error, t, fallback);
}

function lessonMatchesFilters(lesson, search, subject) {
  const matchesTitle = lesson.title
    .toLocaleLowerCase()
    .includes(search.trim().toLocaleLowerCase());
  return matchesTitle && (!subject || lesson.subject === subject);
}

function TeacherDashboard() {
  const { t } = useLanguage();
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseLoadError, setCourseLoadError] = useState("");
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
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (subject) params.set("subject", subject);
    const query = params.toString();
    const { data } = await apiRequest(`/lessons${query ? `?${query}` : ""}`, {
      signal,
    });

    if (!Array.isArray(data.data)) {
      throw new Error(t("teacher.invalidResponse"));
    }

    return data.data;
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/courses", { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data.data)) throw new Error(t("courses.invalidResponse"));
        setCourses(data.data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setCourseLoadError(getErrorMessage(error, t, t("courses.loadError")));
        }
      });
    return () => controller.abort();
  }, [t]);

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
          setLessonError(getErrorMessage(error, t, t("teacher.loadError")));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, search.trim() ? 300 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestLessons, search, subjectFilter, refreshKey, t]);

  function getSubjectLabel(value) {
    const subjectKeys = {
      Physics: "subject.physics",
      Chemistry: "subject.chemistry",
      Biology: "subject.biology",
      "Combined Mathematics": "subject.maths",
    };
    return subjectKeys[value] ? t(subjectKeys[value]) : value;
  }

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
      courseId: lesson.courseId || "",
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
      errors.push(t("teacher.titleValidation"));
    }

    if (!SUBJECTS.includes(formData.subject)) {
      errors.push(t("teacher.subjectValidation"));
    }
    if (!formData.courseId && !editingLesson) errors.push(t("teacher.courseRequired"));

    if (description.length === 0 || description.length > 2000) {
      errors.push(t("teacher.descriptionValidation"));
    }

    for (const [label, value] of [
      ["Lesson URL", formData.lessonUrl],
      ["Notes URL", formData.notesUrl],
    ]) {
      if (value.trim()) {
        try {
          const url = new URL(value.trim());
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            errors.push(t("teacher.urlHttpValidation", {
              label: t(label === "Lesson URL" ? "teacher.urlLessonLabel" : "teacher.urlNotesLabel"),
            }));
          }
        } catch {
          errors.push(t("teacher.urlValidation", {
            label: t(label === "Lesson URL" ? "teacher.urlLessonLabel" : "teacher.urlNotesLabel"),
          }));
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
      const lessonData = {
        ...formData,
        title,
        description,
        lessonUrl: formData.lessonUrl.trim(),
        notesUrl: formData.notesUrl.trim(),
      };
      if (editingLesson && !formData.courseId) delete lessonData.courseId;
      const { data } = await apiRequest(
        editingLesson
          ? `/lessons/${encodeURIComponent(editingLesson._id)}`
          : "/lessons",
        {
          method: editingLesson ? "PUT" : "POST",
          body: JSON.stringify(lessonData),
        },
      );
      if (!data.data || typeof data.data !== "object") {
        throw new Error(t("teacher.savedError"));
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
          t,
          t(editingLesson ? "teacher.updateError" : "teacher.createError"),
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
      t("teacher.confirmDelete", { title: lesson.title }),
    );
    if (!confirmed) return;

    deletionLocks.current.add(lesson._id);
    setDeletingLessonId(lesson._id);
    setActionError("");

    try {
      await apiRequest(`/lessons/${encodeURIComponent(lesson._id)}`, {
        method: "DELETE",
      });

      setLessons((currentLessons) =>
        currentLessons.filter((currentLesson) => currentLesson._id !== lesson._id),
      );
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setActionError(getErrorMessage(error, t, t("teacher.deleteError")));
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
            <span className="eyebrow">{t("teacher.eyebrow")}</span>
            <h1 className="page-title">{t("teacher.title")}</h1>
            <p className="dashboard-subtitle">{t("teacher.subtitle")}</p>
          </div>
        </header>

        <div className="metrics-grid">
          <DashboardCard title={t("teacher.totalStudents")} value="250" />
          <DashboardCard title={t("teacher.totalLessons")} value={isLoading ? "…" : lessons.length} />
          <DashboardCard title={t("teacher.totalQuizzes")} value="20" />
        </div>

        <section className="quick-actions glass-panel" aria-labelledby="quick-actions-title">
          <h2 className="quick-actions-title" id="quick-actions-title">
            {t("teacher.quickActions")}
          </h2>
          <div className="actions-list">
            <Link className="secondary-button" to="/teacher/courses">
              {t("teacher.createCourse")}
            </Link>
            <button
              className="secondary-button"
              type="button"
              onClick={openCreateForm}
              disabled={isSubmitting}
            >
              {t("teacher.uploadLesson")}
            </button>
            <button className="secondary-button" type="button">
              {t("teacher.createQuiz")}
            </button>
          </div>

          {isFormOpen && (
            <form className="lesson-form" onSubmit={handleSubmit} noValidate>
              <div className="lesson-form-heading">
                <h3>{editingLesson ? t("teacher.editLesson") : t("teacher.uploadTitle")}</h3>
                <button
                  className="lesson-form-close"
                  type="button"
                  onClick={closeForm}
                  aria-label={t("teacher.closeForm")}
                  disabled={isSubmitting}
                >
                  {t("teacher.close")}
                </button>
              </div>

              {formError && (
                <p className="form-feedback form-feedback-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="lesson-form-grid">
                <label className="lesson-form-field">
                  <span>{t("teacher.lessonTitle")}</span>
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
                  <span>{t("teacher.subject")}</span>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">{t("teacher.selectSubject")}</option>
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>
                        {getSubjectLabel(subject)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="lesson-form-field">
                  <span>{t("teacher.course")}</span>
                  <select
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleFormChange}
                    required={!editingLesson}
                    disabled={isSubmitting || courses.length === 0}
                  >
                    <option value="">{t("teacher.selectCourse")}</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                  </select>
                </label>
                {courseLoadError && (
                  <p className="form-feedback form-feedback-error lesson-form-field-wide" role="alert">
                    {courseLoadError}
                  </p>
                )}
                {!courseLoadError && courses.length === 0 && (
                  <p className="lesson-form-field-wide">{t("teacher.noCourses")} <Link className="text-link" to="/teacher/courses">{t("courses.manageTitle")}</Link></p>
                )}

                <label className="lesson-form-field lesson-form-field-wide">
                  <span>{t("teacher.description")}</span>
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
                  <span>{t("teacher.lessonUrl")}</span>
                  <input
                    name="lessonUrl"
                    type="url"
                    value={formData.lessonUrl}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                  />
                </label>

                <label className="lesson-form-field">
                  <span>{t("teacher.notesUrl")}</span>
                  <input
                    name="notesUrl"
                    type="url"
                    value={formData.notesUrl}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                  />
                </label>

                <label className="lesson-form-field">
                  <span>{t("teacher.status")}</span>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                  >
                    <option value="draft">{t("teacher.draft")}</option>
                    <option value="published">{t("teacher.published")}</option>
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
                  {t("teacher.cancel")}
                </button>
                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? editingLesson ? t("teacher.saving") : t("teacher.uploading")
                    : editingLesson ? t("teacher.saveChanges") : t("teacher.uploadSubmit")}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="lessons-section" aria-labelledby="lessons-title">
          <div className="lessons-heading">
            <div>
              <span className="eyebrow">{t("teacher.library")}</span>
              <h2 className="quick-actions-title" id="lessons-title">
                {t("teacher.lessons")}
              </h2>
            </div>
            <span className="lessons-count">
              {!isLoading && !lessonError &&
                t(lessons.length === 1 ? "teacher.lessonCountOne" : "teacher.lessonCount", {
                  count: lessons.length,
                })}
            </span>
          </div>

          <div className="lesson-filters">
            <label className="lesson-filter-field">
              <span>{t("teacher.searchLabel")}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("teacher.searchPlaceholder")}
                aria-label={t("teacher.searchAria")}
              />
            </label>
            <label className="lesson-filter-field">
              <span>{t("teacher.filterSubject")}</span>
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                aria-label={t("teacher.filterAria")}
              >
                <option value="">{t("subject.all")}</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {getSubjectLabel(subject)}
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
            <p className="lessons-feedback" role="status">{t("teacher.loading")}</p>
          ) : lessonError ? (
            <div className="lessons-feedback lessons-feedback-error" role="alert">
              <p>{lessonError}</p>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
              >
                {t("teacher.retry")}
              </button>
            </div>
          ) : lessons.length === 0 ? (
            <p className="lessons-feedback">
              {search.trim() || subjectFilter
                ? t("teacher.emptyFiltered")
                : t("teacher.empty")}
            </p>
          ) : (
            <div className="lessons-list">
              {lessons.map((lesson) => (
                <article className="lesson-card glass-panel" key={lesson._id}>
                  <div className="lesson-card-content">
                    <div className="lesson-card-heading">
                      <h3>{lesson.title}</h3>
                      <span className={`lesson-badge lesson-badge-${lesson.status}`}>
                        {t(`teacher.${lesson.status}`)}
                      </span>
                      <div className="lesson-card-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => openEditForm(lesson)}
                          disabled={isSubmitting || Boolean(deletingLessonId)}
                        >
                          {t("teacher.edit")}
                        </button>
                        <button
                          className="secondary-button lesson-delete-button"
                          type="button"
                          onClick={() => handleDelete(lesson)}
                          disabled={Boolean(deletingLessonId) || isSubmitting || isFormOpen}
                        >
                          {deletingLessonId === lesson._id ? t("teacher.deleting") : t("teacher.delete")}
                        </button>
                      </div>
                    </div>
                    <p className="lesson-card-subject">{getSubjectLabel(lesson.subject)}</p>
                    <p className="lesson-card-description">{lesson.description}</p>
                    {(lesson.lessonUrl || lesson.notesUrl) && (
                      <div className="lesson-card-links">
                        {lesson.lessonUrl && (
                          <a href={lesson.lessonUrl} target="_blank" rel="noreferrer">
                            {t("teacher.openLesson")}
                          </a>
                        )}
                        {lesson.notesUrl && (
                          <a href={lesson.notesUrl} target="_blank" rel="noreferrer">
                            {t("teacher.openNotes")}
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
