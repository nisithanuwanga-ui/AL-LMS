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


</div>

</div>

)

}

export default Login;