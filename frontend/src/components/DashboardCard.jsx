function DashboardCard({ title, value, icon = title.slice(0, 1) }) {
  return (
    <article className="metric-card glass-panel">
      <div className="metric-heading">
        <span className="metric-label">{title}</span>
        <span className="metric-icon" aria-hidden="true">{icon}</span>
      </div>
      <p className="metric-value">{value}</p>
    </article>
  );
}

export default DashboardCard;