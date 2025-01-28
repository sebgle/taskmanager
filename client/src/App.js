import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import TaskPage from "./components/TaskPage";
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Welcome Page */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/tasks" />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white-500 to-indigo-700 text-white">
                <div className="text-center max-w-lg bg-white text-gray-800 p-8 rounded-xl shadow-lg">
                  <h1 className="text-4xl font-bold mb-6">
                    Welcome to TaskMaster
                  </h1>
                  <p className="text-lg mb-8">
                    Stay organized and manage your tasks with ease. Sign up
                    today and boost your productivity.
                  </p>
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => (window.location.href = "/register")}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition duration-300"
                    >
                      Get Started
                    </button>
                    <p className="text-gray-600 text-sm">
                      Already have an account?{" "}
                      <span
                        onClick={() => (window.location.href = "/login")}
                        className="text-blue-500 cursor-pointer hover:underline"
                      >
                        Log in here.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )
          }
        />

        {/* Login Page */}
        <Route path="/login" element={<Login setUser={setUser} />} />

        {/* Register Page */}
        <Route path="/register" element={<Register />} />

        {/* Protected Route for Tasks */}
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <TaskPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
