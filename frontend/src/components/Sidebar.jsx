import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";


function Sidebar(){

    return(

        <aside className="sidebar">
            <Link to="/" className="brand">
                <span className="brand-mark" aria-hidden="true">A</span>
                <span>AL Learning Hub</span>
            </Link>

            <span className="sidebar-label">Workspace</span>
            <nav className="sidebar-nav" aria-label="Main navigation">
                <NavLink to="/" end className="sidebar-link">Home</NavLink>
                <NavLink to="/student/dashboard" className="sidebar-link">Student Dashboard</NavLink>
                <NavLink to="/teacher/dashboard" className="sidebar-link">Teacher Dashboard</NavLink>
                <NavLink to="/login" className="sidebar-link">Login</NavLink>
                <NavLink to="/register" className="sidebar-link">Register</NavLink>
            </nav>

            <div className="sidebar-bottom">
                <span className="sidebar-caption">Appearance</span>
                <ThemeToggle />
            </div>
        </aside>

    )

}

export default Sidebar;