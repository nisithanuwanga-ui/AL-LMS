import { Link } from "react-router-dom";


function Sidebar(){

    return(

        <div className="w-64 min-h-screen bg-blue-900 text-white p-6">

            <h2 className="text-2xl font-bold mb-8">
                AL LMS
            </h2>


            <div className="space-y-4">

                <Link 
                to="/student/dashboard"
                className="block hover:text-blue-300">
                    Dashboard
                </Link>


                <Link 
                to="/courses"
                className="block hover:text-blue-300">
                    My Courses
                </Link>


                <Link 
                to="/quiz"
                className="block hover:text-blue-300">
                    Quizzes
                </Link>


                <Link 
                to="/profile"
                className="block hover:text-blue-300">
                    Profile
                </Link>


            </div>


        </div>

    )

}

export default Sidebar;