import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/templates`)
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading templates...</p>;
  if (templates.length === 0) return <p>No templates found</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Legal Templates</h1>
      <ul>
        {templates.map((t) => (
          <li key={t.id} className="border p-4 rounded mb-2">
            <h2 className="text-xl font-semibold">{t.name}</h2>
            <p>{t.description}</p>
            <p className="mt-2 font-semibold">Sections:</p>
            <ul className="list-disc list-inside">
              {t.sections.map((s, i) => (
                <li key={i}>
                  {s.title} (Vector: {s.requires_vector_search ? "Yes" : "No"}, 
                  Meili: {s.requires_meilisearch ? "Yes" : "No"})
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}