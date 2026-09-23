function Home() {
  return (
    <div className="min-h-screen bg-gray-100">

      <nav className="bg-blue-900 text-white px-8 py-4 flex justify-between">
        <h1 className="text-2xl font-bold">
          AL Learning Hub
        </h1>

        <div>
          <button className="mr-4">
            Login
          </button>

          <button className="bg-white text-blue-900 px-4 py-2 rounded">
            Register
          </button>
        </div>
      </nav>


      <section className="text-center py-20">

        <h2 className="text-5xl font-bold text-blue-900">
          Learn. Practice. Achieve.
        </h2>

        <p className="mt-5 text-gray-600 text-lg">
          A complete learning platform for A/L students
        </p>


        <button className="mt-8 bg-blue-900 text-white px-8 py-3 rounded-lg">
          Get Started
        </button>

      </section>


      <section className="grid md:grid-cols-3 gap-6 px-10">

        <div className="bg-white p-6 rounded-xl shadow">
          📚
          <h3 className="text-xl font-bold">
            Online Lessons
          </h3>
          <p>
            Access lessons anytime.
          </p>
        </div>


        <div className="bg-white p-6 rounded-xl shadow">
          📝
          <h3 className="text-xl font-bold">
            Practice Quizzes
          </h3>
          <p>
            Test your knowledge.
          </p>
        </div>


        <div className="bg-white p-6 rounded-xl shadow">
          📊
          <h3 className="text-xl font-bold">
            Track Progress
          </h3>
          <p>
            Monitor your improvement.
          </p>
        </div>

      </section>


    </div>
  )
}

export default Home;