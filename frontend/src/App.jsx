import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./ProtectedRoute";
import Templates from "./pages/Templates";
import NewTemplate from "./pages/NewTemplate";
import AdminUpload from "./pages/AdminUpload";
import CaseDrafting from "./pages/CaseDrafting";
import TemplateSelect from "./pages/TemplateSelect";

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/templates" element={<Templates />} />
        <Route path="/templates/new" element={<ProtectedRoute><NewTemplate /></ProtectedRoute>} />
        <Route path="/admin/upload" element={<ProtectedRoute><AdminUpload /></ProtectedRoute>} />
        <Route path="/draft/start" element={<TemplateSelect />} />
        <Route path="/draft/:templateId" element={<CaseDrafting />} />
        {/* // to see how it works */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;