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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Link to="/admin/templates/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          + New Template
        </Link>
      </div>
      {templates.map((t) => (
        <div key={t._id} className="border rounded p-4 mb-3">
          <div className="flex justify-between">
            <div>
              <h2 className="text-xl font-semibold">{t.name}</h2>
              <p className="text-sm text-gray-600">{t.description}</p>
            </div>
            <button onClick={() => deleteTemplate(t._id)} className="text-red-600 font-semibold">
              Delete
            </button>
          </div>
          <ul className="list-disc pl-5 mt-2">
            {t.sections.map((s, i) => (
              <li key={i}>
                {s.title} — V: {s.requires_vector_search ? "Y" : "N"}, M:{" "}
                {s.requires_meilisearch ? "Y" : "N"}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}