import { Link } from "react-router-dom";

function Login(){

return(

<div className="min-h-screen flex items-center justify-center bg-gray-100">

<div className="bg-white p-8 rounded-xl shadow w-96">

<h1 className="text-3xl font-bold text-blue-900 mb-6">
Login
</h1>


<input 
className="border p-3 w-full mb-4 rounded"
placeholder="Email"
/>


<input 
className="border p-3 w-full mb-4 rounded"
placeholder="Password"
/>


<button className="bg-blue-900 text-white w-full py-3 rounded">
Login
</button>

<p className="mt-4 text-center">
	Need an account? <Link to="/register" className="text-blue-900 underline">Register</Link>
</p>
<p className="mt-2 text-center">
	<Link to="/" className="text-blue-900 underline">Back to home</Link>
</p>

</div>

</div>

)

}

export default Login;