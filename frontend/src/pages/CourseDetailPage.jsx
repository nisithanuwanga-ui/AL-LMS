import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";
import { apiRequest, getApiErrorMessage } from "../services/api";
import { getCourseLessonsPath } from "../services/courseLessons";
import { getSafeExternalUrl } from "../services/safeUrl";

function CourseDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user, status: authStatus } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [courseResult, lessonResult] = await Promise.all([
          apiRequest(`/courses/${encodeURIComponent(id)}`, { signal: controller.signal }),
          apiRequest(getCourseLessonsPath(id), { signal: controller.signal }),
        ]);
        if (!courseResult.data.data || !Array.isArray(lessonResult.data.data)) {
          throw new Error(t("courses.invalidResponse"));
        }
        setCourse(courseResult.data.data);
        setLessons(lessonResult.data.data);
        if (user?.role === "student") {
          const enrollmentResult = await apiRequest("/enrollments/mine", { signal: controller.signal });
          const found = enrollmentResult.data.data?.find(
            (item) => item.courseId?._id === id || item.courseId === id,
          );
          setEnrollment(found || null);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(requestError, t, t("courses.loadError")));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [id, user?.role, t]);

  async function handleEnrollment() {
    if (authStatus !== "authenticated" || !user) {
      navigate("/login");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (enrollment) {
        await apiRequest(`/enrollments/${encodeURIComponent(enrollment._id)}/cancel`, { method: "PATCH" });
        setEnrollment(null);
        setMessage(t("courses.cancelled"));
      } else {
        const { data } = await apiRequest(`/enrollments/courses/${encodeURIComponent(id)}`, { method: "POST" });
        setEnrollment(data.data);
        setMessage(t("courses.enrolled"));
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t, t("courses.enrollmentError")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <SiteNav />
      <main className="page-width course-detail-page">
        {loading ? <p className="lessons-feedback" role="status">{t("courses.loading")}</p> :
          error && !course ? <p className="lessons-feedback lessons-feedback-error" role="alert">{error}</p> :
            <>
              {course && <header className="course-detail-header glass-panel">
                <div className="course-card-meta"><span>{course.subject}</span><span>{course.medium}</span><span>{course.academicYear}</span></div>
                <h1>{course.title}</h1><p>{course.description}</p>
                {(user?.role === "student" || authStatus === "unauthenticated") &&
                  course.status === "published" &&
                  <button className="primary-button" type="button" disabled={saving} onClick={handleEnrollment}>
                    {saving ? t("courses.saving") : enrollment ? t("courses.cancelEnrollment") : t("courses.enroll")}
                  </button>}
                {enrollment && <span className="course-status course-status-published">{t("courses.enrolledStatus")}</span>}
                {message && <p role="status" className="form-feedback form-feedback-success">{message}</p>}
                {error && <p role="alert" className="form-feedback form-feedback-error">{error}</p>}
              </header>}
              <section className="course-detail-lessons">
                <h2>{t("courses.courseLessons")}</h2>
                {lessons.length === 0 ? <p className="lessons-feedback">{t("courses.noLessons")}</p> :
                  <div className="student-lessons-list">{lessons.map((lesson) => {
                    const lessonUrl = getSafeExternalUrl(lesson.lessonUrl);
                    const notesUrl = getSafeExternalUrl(lesson.notesUrl);
                    return (
                      <article className="student-lesson-card glass-panel" key={lesson._id}>
                            <p className="student-lesson-subject">{lesson.subject}</p>
                            <h3>{lesson.title}</h3>
                            <p className="student-lesson-description">{lesson.description}</p>
                            <div className="student-lesson-links">
                              {lessonUrl && <a href={lessonUrl} target="_blank" rel="noopener noreferrer">{t("student.watch")}</a>}
                              {notesUrl && <a href={notesUrl} target="_blank" rel="noopener noreferrer">{t("student.notes")}</a>}
                            </div>
                      </article>
                    );
                  })}</div>}
                <Link className="text-link" to="/courses">{t("courses.backToCourses")}</Link>
              </section>
            </>}
      </main>
    </div>
  );
}

export default CourseDetailPage;
