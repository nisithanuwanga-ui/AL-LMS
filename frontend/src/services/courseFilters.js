export function createCourseSearchParams({ search, subject, medium, academicYear }) {
  const params = new URLSearchParams();
  if (typeof search === "string" && search.trim()) params.set("search", search.trim());
  if (subject) params.set("subject", subject);
  if (medium) params.set("medium", medium);
  if (academicYear) params.set("academicYear", String(academicYear));
  return params;
}
