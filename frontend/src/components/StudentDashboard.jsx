import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";


function StudentDashboard(){

return(

<div className="flex">

<Sidebar/>


<div className="flex-1 bg-gray-100 p-8">


<h1 className="text-3xl font-bold text-blue-900 mb-8">
Student Dashboard
</h1>


<div className="grid md:grid-cols-3 gap-6">


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


</div>

</div>

)

}

export default StudentDashboard;