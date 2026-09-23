import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";


function TeacherDashboard(){

return(

<div className="flex">


<Sidebar/>


<div className="flex-1 bg-gray-100 p-8">


<h1 className="text-3xl font-bold text-blue-900 mb-8">
Teacher Dashboard
</h1>


<div className="grid md:grid-cols-3 gap-6">


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


<div className="mt-10 bg-white p-6 rounded-xl shadow">


<h2 className="text-xl font-bold mb-4">
Quick Actions
</h2>


<div className="space-y-3">


<button className="bg-blue-900 text-white px-5 py-3 rounded block">
+ Create Course
</button>


<button className="bg-blue-900 text-white px-5 py-3 rounded block">
+ Upload Lesson
</button>


<button className="bg-blue-900 text-white px-5 py-3 rounded block">
+ Create Quiz
</button>


</div>


</div>


</div>


</div>

)

}

export default TeacherDashboard;