import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/useLanguage";
import { apiRequest, getApiErrorMessage } from "../services/api";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "Combined Mathematics"];
const MEDIUMS = ["Sinhala", "English", "Tamil"];
const EMPTY_COURSE = {
  title: "",
  description: "",
  subject: "",
  medium: "",
  academicYear: new Date().getFullYear(),
  status: "draft",
};

function TeacherCoursesPage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const lock = useRef(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiRequest("/courses");
      if (!Array.isArray(data.data)) throw new Error(t("courses.invalidResponse"));
      setCourses(data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t, t("courses.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCourses(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCourses]);

  function editCourse(item) {
    setCourse(item);
    setForm({
      title: item.title,
      description: item.description,
      subject: item.subject,
      medium: item.medium,
      academicYear: item.academicYear,
      status: item.status,
    });
    setFormError("");
  }

  function resetForm() {
    setCourse(null);
    setForm(EMPTY_COURSE);
    setFormError("");
  }

  async function saveCourse(event) {
    event.preventDefault();
    if (lock.current) return;
    if (form.title.trim().length < 3 || !SUBJECTS.includes(form.subject) ||
      !MEDIUMS.includes(form.medium) || !Number.isInteger(Number(form.academicYear)) ||
      Number(form.academicYear) < 2000 || Number(form.academicYear) > 2100 ||
      !form.description.trim()) {
      setFormError(t("courses.validation"));
      return;
    }
    lock.current = true;
    setSaving(true);
    setFormError("");
    try {
      const { data } = await apiRequest(
        course ? `/courses/${encodeURIComponent(course._id)}` : "/courses",
        {
          method: course ? "PUT" : "POST",
          body: JSON.stringify({ ...form, academicYear: Number(form.academicYear) }),
        },
      );
      if (!data.data) throw new Error(t("courses.saveError"));
      resetForm();
      await loadCourses();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, t, t("courses.saveError")));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  async function deleteCourse(item) {
    if (!window.confirm(t("courses.confirmDelete", { title: item.title }))) return;
    try {
      await apiRequest(`/courses/${encodeURIComponent(item._id)}`, { method: "DELETE" });
      setCourses((items) => items.filter((candidate) => candidate._id !== item._id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t, t("courses.deleteError")));
    }
  }

  return (
    <div className="app-shell dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">{t("courses.teacherEyebrow")}</span>
            <h1 className="page-title">{t("courses.manageTitle")}</h1>
            <p className="dashboard-subtitle">{t("courses.manageCopy")}</p>
          </div>
        </header>

        <section className="course-management-panel glass-panel">
          <h2>{course ? t("courses.editTitle") : t("courses.createTitle")}</h2>
          <form onSubmit={saveCourse} className="course-form" noValidate>
            {formError && <p className="form-feedback form-feedback-error" role="alert">{formError}</p>}
            <label>{t("courses.title")}<input value={form.title} maxLength={150} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>{t("courses.subject")}<select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}><option value="">{t("courses.selectSubject")}</option>{SUBJECTS.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>{t("courses.medium")}<select value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })}><option value="">{t("courses.selectMedium")}</option>{MEDIUMS.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>{t("courses.academicYear")}<input type="number" min="2000" max="2100" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></label>
            <label className="course-form-wide">{t("courses.description")}<textarea rows="3" maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label>{t("courses.status")}<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">{t("courses.draft")}</option><option value="published">{t("courses.published")}</option></select></label>
            <div className="course-form-actions course-form-wide">
              {course && <button className="secondary-button" type="button" onClick={resetForm}>{t("teacher.cancel")}</button>}
              <button className="primary-button" disabled={saving}>{saving ? t("courses.saving") : course ? t("courses.save") : t("courses.create")}</button>
            </div>
          </form>
        </section>

        <section className="course-management-list" aria-labelledby="teacher-courses-heading">
          <h2 className="quick-actions-title" id="teacher-courses-heading">{t("courses.yourCourses")}</h2>
          {error && <p className="lessons-feedback lessons-feedback-error" role="alert">{error}</p>}
          {loading ? <p className="lessons-feedback" role="status">{t("courses.loading")}</p> :
            courses.length === 0 ? <p className="lessons-feedback">{t("courses.teacherEmpty")}</p> :
              <div className="course-card-grid">{courses.map((item) => (
                <article className="course-card glass-panel" key={item._id}>
                  <div className="course-card-meta"><span>{item.subject}</span><span>{item.medium}</span><strong className={`course-status course-status-${item.status}`}>{t(`courses.${item.status}`)}</strong></div>
                  <h3>{item.title}</h3><p>{item.description}</p>
                  <small>{t("courses.academicYear")}: {item.academicYear}</small>
                  <div className="course-card-actions">
                    <Link className="secondary-button" to={`/courses/${item._id}`}>{t("courses.viewCourse")}</Link>
                    <button className="secondary-button" type="button" onClick={() => editCourse(item)}>{t("teacher.edit")}</button>
                    <button className="secondary-button course-delete-button" type="button" onClick={() => deleteCourse(item)}>{t("teacher.delete")}</button>
                  </div>
                </article>
              ))}</div>}
        </section>
      </main>
    </div>
  );
}

export default TeacherCoursesPage;
