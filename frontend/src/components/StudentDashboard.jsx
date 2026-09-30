import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";


function StudentDashboard(){

return(

<div className="app-shell dashboard-layout">

<Sidebar/>


<main className="dashboard-main">


<header className="dashboard-header">
	<div>
		<span className="eyebrow">Your learning at a glance</span>
		<h1 className="page-title">Student Dashboard</h1>
		<p className="dashboard-subtitle">Keep your focus on the next step.</p>
	</div>
</header>


<div className="metrics-grid">


<DashboardCard
title="My Courses"
value="3"
/>


<DashboardCard
title="Completed Lessons"
value="25"
/>


<DashboardCard
title="Average Marks"
value="85%"
/>


</div>


</main>

</div>

)

}

export default StudentDashboard;