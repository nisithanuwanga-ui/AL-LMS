import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import StudentDashboard from "../components/StudentDashboard";
import TeacherDashboard from "../pages/TeacherDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import PendingTeacherPage from "../pages/PendingTeacherPage";
import ProtectedRoute from "../components/ProtectedRoute";

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
                    element={
                        <ProtectedRoute roles={["student"]} allowPublic>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/teacher/dashboard"
                    element={
                        <ProtectedRoute roles={["teacher"]}>
                            <TeacherDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/teacher/pending"
                    element={
                        <ProtectedRoute roles={["teacher"]} allowPendingTeacher>
                            <PendingTeacherPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute roles={["admin"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    )

}

export default AppRoutes;