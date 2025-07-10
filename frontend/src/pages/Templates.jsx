import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const fetchTemplates = async () => {
    const res = await fetch(`${API_BASE}/templates`);
    const data = await res.json();
    setTemplates(data);
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    await fetch(`${API_BASE}/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📄 Templates</h1>
        <Link
          to="/admin/templates/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <p className="text-gray-500">No templates yet.</p>
      ) : (
        templates.map((t) => (
          <div key={t._id} className="border rounded-lg p-5 mb-6 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{t.name}</h2>
                {t.description && (
                  <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => deleteTemplate(t._id)}
                className="text-red-600 font-semibold hover:underline"
              >
                Delete
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {t.sections.map((s, i) => (
                <div key={i} className="border border-gray-200 rounded p-3 bg-gray-50">
                  <h3 className="font-medium">{s.title}</h3>
                  {s.description && (
                    <p className="text-sm text-gray-600">{s.description}</p>
                  )}
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {s.requires_vector_search && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Vector Search
                      </span>
                    )}
                    {s.requires_meilisearch && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        MeiliSearch
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
