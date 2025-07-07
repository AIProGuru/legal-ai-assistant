// File: src/pages/TemplateSelect.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TemplateSelect() {
  const [templates, setTemplates] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE}/templates`)
      .then((res) => res.json())
      .then(setTemplates);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Select a Template</h1>

      <div className="space-y-4">
        {templates.map((tpl) => (
          <div key={tpl._id} className="border rounded">
            <button
              onClick={() =>
                setExpandedId(expandedId === tpl._id ? null : tpl._id)
              }
              className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 font-medium"
            >
              {tpl.name}
            </button>

            {expandedId === tpl._id && (
              <div className="px-4 py-3 space-y-2">
                <p className="text-gray-700">{tpl.description}</p>
                <ul className="text-sm list-disc pl-6 text-gray-600">
                  {tpl.sections.map((s, i) => (
                    <li key={i}>{s.title}</li>
                  ))}
                </ul>
                <button
                  className="mt-2 text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                  onClick={() => navigate(`/draft/${tpl._id}`)}
                >
                  Use This Template
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
