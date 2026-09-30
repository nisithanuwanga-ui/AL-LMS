import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

function Login(){

return(

<div className="app-shell auth-layout">
	<div className="auth-topbar">
		<Link to="/" className="brand">
			<span className="brand-mark" aria-hidden="true">A</span>
			<span>AL Learning Hub</span>
		</Link>
		<ThemeToggle />
	</div>

	<main className="auth-panel glass-panel">
		<span className="eyebrow">Good to have you back</span>
		<h1 className="auth-title">Login</h1>
		<p className="auth-copy">Pick up where your learning left off.</p>

		<label className="form-label" htmlFor="email">Email</label>
		<input
			id="email"
			name="email"
			type="email"
			autoComplete="email"
			className="form-control"
			placeholder="you@example.com"
		/>

		<label className="form-label" htmlFor="password">Password</label>
		<input
			id="password"
			name="password"
			type="password"
			autoComplete="current-password"
			className="form-control"
			placeholder="Enter your password"
		/>

		<button className="primary-button auth-submit">Login</button>
		<p className="auth-footer">
			Need an account? <Link to="/register" className="text-link">Register</Link>
		</p>
		<Link to="/" className="text-link auth-back">Back to home</Link>
	</main>
</div>

)

}

export default Login;