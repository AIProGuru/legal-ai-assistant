import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, token } = useAuth();
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token);
        alert("Logged in!");
        navigate("/dashboard");
      } else {
        alert("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Server error. Please try again later.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>

        {token && (
          <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4 text-sm">
            You're already logged in.{" "}
            <Link to="/dashboard" className="text-blue-600 underline">Go to Dashboard</Link>
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200"
        >
          Login
        </button>

        <p className="mt-4 text-center text-sm">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 underline">Create one</Link>
        </p>
      </form>
    </div>
  );
}
