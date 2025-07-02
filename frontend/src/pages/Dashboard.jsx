import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <p className="text-gray-700 mb-4">Welcome to your legal assistant dashboard.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white shadow rounded">
          <h2 className="font-semibold text-lg mb-2">Coming Soon</h2>
          <p className="text-sm text-gray-600">
            Features like case creation, document drafting, and feedback system will be added here.
          </p>
        </div>
      </div>
    </div>
  );
}
