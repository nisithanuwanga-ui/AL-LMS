import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../Pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import StudentDashboard from "../components/StudentDashboard";
import TeacherDashboard from "../pages/TeacherDashboard";

function AppRoutes(){

    return(
        <BrowserRouter>

            <Routes>

                <Route 
                    path="/" 
                    element={<Home />} 
                />

                <Route 
                    path="/login" 
                    element={<Login />} 
                />

                <Route 
                    path="/register" 
                    element={<Register />} 
                />

                <Route 
                    path="/student/dashboard"
                    element={<StudentDashboard/>}
                />

                <Route
                    path="/teacher/dashboard"
                    element={<TeacherDashboard/>}
                />

            </Routes>

        </BrowserRouter>
    )

}

export default AppRoutes;