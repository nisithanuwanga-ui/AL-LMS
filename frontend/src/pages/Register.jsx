import { Link } from "react-router-dom";

function Register(){

return(

<div className="min-h-screen flex items-center justify-center bg-gray-100">

<div className="bg-white p-8 rounded-xl shadow w-96">

<h1 className="text-3xl font-bold text-blue-900 mb-6">
Create Account
</h1>


<input 
className="border p-3 w-full mb-4 rounded"
placeholder="Name"
/>


<input 
className="border p-3 w-full mb-4 rounded"
placeholder="Email"
/>


<input 
className="border p-3 w-full mb-4 rounded"
placeholder="Password"
/>


<button className="bg-blue-900 text-white w-full py-3 rounded">
Register
</button>

<p className="mt-4 text-center">
	Already registered? <Link to="/login" className="text-blue-900 underline">Login</Link>
</p>
<p className="mt-2 text-center">
	<Link to="/" className="text-blue-900 underline">Back to home</Link>
</p>

</div>

</div>

)

}

export default Register;