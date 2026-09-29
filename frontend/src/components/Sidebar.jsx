import { Link } from "react-router-dom";


function Sidebar(){

    return(

        <div className="w-64 min-h-screen bg-blue-900 text-white p-6">

            <h2 className="text-2xl font-bold mb-8">
                AL LMS
            </h2>


            <div className="space-y-4">

                <Link
                to="/"
                className="block hover:text-blue-300">
                    Home
                </Link>

                <Link
                to="/student/dashboard"
                className="block hover:text-blue-300">
                    Student Dashboard
                </Link>

                <Link
                to="/teacher/dashboard"
                className="block hover:text-blue-300">
                    Teacher Dashboard
                </Link>

                <Link
                to="/login"
                className="block hover:text-blue-300">
                    Login
                </Link>

                <Link
                to="/register"
                className="block hover:text-blue-300">
                    Register
                </Link>


            </div>


        </div>

    )

}

export default Sidebar;