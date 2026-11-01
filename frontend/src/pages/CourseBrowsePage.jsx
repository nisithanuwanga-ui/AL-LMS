import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { useLanguage } from "../contexts/useLanguage";
import { apiRequest, getApiErrorMessage } from "../services/api";
import { createCourseSearchParams } from "../services/courseFilters";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "Combined Mathematics"];
const MEDIUMS = ["Sinhala", "English", "Tamil"];

function CourseBrowsePage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [medium, setMedium] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = createCourseSearchParams({
          search,
          subject,
          medium,
          academicYear: year,
        });
        const { data } = await apiRequest(`/courses${params.size ? `?${params}` : ""}`, { signal: controller.signal });
        if (!Array.isArray(data.data)) throw new Error(t("courses.invalidResponse"));
        setCourses(data.data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(getApiErrorMessage(requestError, t, t("courses.loadError")));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search.trim() ? 250 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, subject, medium, year, t]);

  return (
    <div className="app-shell">
      <SiteNav />
      <main className="page-width courses-browse-page">
        <header className="courses-browse-heading"><span className="eyebrow">{t("courses.browseEyebrow")}</span><h1>{t("courses.browseTitle")}</h1><p>{t("courses.browseCopy")}</p></header>
        <div className="course-filters">
          <label>{t("courses.search")}<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("courses.searchPlaceholder")} /></label>
          <label>{t("courses.subject")}<select value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">{t("subject.all")}</option>{SUBJECTS.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>{t("courses.medium")}<select value={medium} onChange={(e) => setMedium(e.target.value)}><option value="">{t("courses.allMediums")}</option>{MEDIUMS.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>{t("courses.academicYear")}<input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)} /></label>
        </div>
        {error && <p className="lessons-feedback lessons-feedback-error" role="alert">{error}</p>}
        {loading ? <p className="lessons-feedback" role="status">{t("courses.loading")}</p> :
          courses.length === 0 ? <p className="lessons-feedback">{t("courses.publicEmpty")}</p> :
            <div className="course-card-grid">{courses.map((course) => (
              <article className="course-card glass-panel" key={course._id}>
                <div className="course-card-meta"><span>{course.subject}</span><span>{course.medium}</span><span>{course.academicYear}</span></div>
                <h2>{course.title}</h2><p>{course.description}</p>
                <Link className="primary-button" to={`/courses/${course._id}`}>{t("courses.viewCourse")}</Link>
              </article>
            ))}</div>}
      </main>
    </div>
  );
}

export default CourseBrowsePage;
