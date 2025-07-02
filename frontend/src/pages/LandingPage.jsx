import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-50 text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Legal AI Assistant</h1>
      <p className="text-lg text-gray-700 mb-8">
        Generate legal documents using AI. Fast, accurate, and secure.
      </p>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="px-6 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
