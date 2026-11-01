export function getCourseLessonsPath(courseId) {
  return `/lessons?courseId=${encodeURIComponent(courseId)}`;
}
