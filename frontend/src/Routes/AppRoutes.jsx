import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../Pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import StudentDashboard from "../components/StudentDashboard";

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

            </Routes>

        </BrowserRouter>
    )

}

export default AppRoutes;