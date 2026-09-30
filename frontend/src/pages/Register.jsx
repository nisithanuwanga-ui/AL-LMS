import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

function Register(){

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
		<span className="eyebrow">Start your next chapter</span>
		<h1 className="auth-title">Create account</h1>
		<p className="auth-copy">Set up your learning space and get started.</p>

		<label className="form-label" htmlFor="name">Name</label>
		<input
			id="name"
			name="name"
			type="text"
			autoComplete="name"
			className="form-control"
			placeholder="Your name"
		/>

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
			autoComplete="new-password"
			className="form-control"
			placeholder="Create a password"
		/>

		<button className="primary-button auth-submit">Create account</button>
		<p className="auth-footer">
			Already registered? <Link to="/login" className="text-link">Login</Link>
		</p>
		<Link to="/" className="text-link auth-back">Back to home</Link>
	</main>
</div>

)

}

export default Register;