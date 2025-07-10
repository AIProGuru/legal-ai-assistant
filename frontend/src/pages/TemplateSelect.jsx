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
      <h1 className="text-3xl font-bold mb-6">🧩 Select a Template</h1>

      <div className="space-y-4">
        {templates.map((tpl) => (
          <div key={tpl._id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
            <button
              onClick={() =>
                setExpandedId(expandedId === tpl._id ? null : tpl._id)
              }
              className="w-full text-left px-5 py-4 bg-gray-100 hover:bg-gray-200 font-medium text-lg flex justify-between items-center"
            >
              <span>{tpl.name}</span>
              <span className="text-sm text-blue-600">{expandedId === tpl._id ? "▲" : "▼"}</span>
            </button>

            {expandedId === tpl._id && (
              <div className="px-5 py-4 space-y-4 bg-white">
                {tpl.description && (
                  <p className="text-gray-700">{tpl.description}</p>
                )}

                <div className="space-y-3">
                  {tpl.sections.map((s, i) => (
                    <div key={i} className="border rounded p-3 bg-gray-50">
                      <h3 className="font-semibold">{s.title}</h3>
                      {s.description && (
                        <p className="text-sm text-gray-600 mt-1">{s.description}</p>
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

                <button
                  className="mt-3 text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
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
