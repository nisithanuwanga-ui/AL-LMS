import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/useLanguage";
import { apiRequest, getApiErrorMessage } from "../services/api";

function MyCoursesPage() {
  const { t } = useLanguage();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/enrollments/mine", { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data.data)) throw new Error(t("courses.invalidResponse"));
        setEnrollments(data.data);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(requestError, t, t("courses.loadError")));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [t]);

  return (
    <div className="app-shell dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header"><div><span className="eyebrow">{t("courses.studentEyebrow")}</span><h1 className="page-title">{t("courses.myCourses")}</h1></div></header>
        {error && <p className="lessons-feedback lessons-feedback-error" role="alert">{error}</p>}
        {loading ? <p className="lessons-feedback" role="status">{t("courses.loading")}</p> :
          enrollments.length === 0 ? <div className="lessons-feedback"><p>{t("courses.noEnrollments")}</p><Link className="text-link" to="/courses">{t("courses.browseTitle")}</Link></div> :
            <div className="course-card-grid">{enrollments.map((item) => item.courseId && (
              <article className="course-card glass-panel" key={item._id}>
                <div className="course-card-meta"><span>{item.courseId.subject}</span><span>{item.courseId.medium}</span><span>{item.courseId.academicYear}</span></div>
                <h2>{item.courseId.title}</h2><p>{item.courseId.description}</p>
                <Link className="primary-button" to={`/courses/${item.courseId._id}`}>{t("courses.continue")}</Link>
              </article>
            ))}</div>}
      </main>
    </div>
  );
}

export default MyCoursesPage;
