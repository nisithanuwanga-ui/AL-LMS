import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";


function TeacherDashboard(){

return(

<div className="app-shell dashboard-layout">


<Sidebar/>


<main className="dashboard-main">


<header className="dashboard-header">
	<div>
		<span className="eyebrow">Teaching workspace</span>
		<h1 className="page-title">Teacher Dashboard</h1>
		<p className="dashboard-subtitle">Your classes and course tools, together.</p>
	</div>
</header>


<div className="metrics-grid">


<DashboardCard
title="Total Students"
value="250"
/>


<DashboardCard
title="My Courses"
value="5"
/>


<DashboardCard
title="Total Quizzes"
value="20"
/>


</div>


<section className="quick-actions glass-panel">


<h2 className="quick-actions-title">
Quick Actions
</h2>


<div className="actions-list">


<button className="secondary-button">
+ Create Course
</button>


<button className="secondary-button">
+ Upload Lesson
</button>


<button className="secondary-button">
+ Create Quiz
</button>

</div>

</section>


</main>

</div>

)

}

export default TeacherDashboard;