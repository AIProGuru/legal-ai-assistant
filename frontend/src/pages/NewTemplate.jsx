import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NewTemplate() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState([
    {
      title: "",
      description: "",
      sample_draft: "",
      requires_vector_search: false,
      requires_meilisearch: false,
    },
  ]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, sections }),
    });

    if (res.ok) {
      alert("Template created!");
      navigate("/admin/templates");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New Template</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="w-full border px-3 py-2 rounded"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <h2 className="text-lg font-semibold">Sections</h2>
        {sections.map((s, i) => (
          <div key={i} className="border p-3 rounded space-y-2 mb-2 bg-gray-50">
            <input
              className="w-full border px-2 py-1 rounded"
              placeholder="Section Title"
              value={s.title}
              onChange={(e) =>
                setSections((prev) =>
                  prev.map((sec, idx) =>
                    idx === i ? { ...sec, title: e.target.value } : sec
                  )
                )
              }
            />
            <textarea
              className="w-full border px-2 py-1 rounded"
              placeholder="Section Description (optional)"
              value={s.description}
              onChange={(e) =>
                setSections((prev) =>
                  prev.map((sec, idx) =>
                    idx === i ? { ...sec, description: e.target.value } : sec
                  )
                )
              }
            />
            <textarea
              className="w-full border px-2 py-1 rounded"
              placeholder="Sample Draft (optional)"
              value={s.sample_draft}
              onChange={(e) =>
                setSections((prev) =>
                  prev.map((sec, idx) =>
                    idx === i ? { ...sec, sample_draft: e.target.value } : sec
                  )
                )
              }
            />
            <div className="flex space-x-4 items-center">
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={s.requires_meilisearch}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((sec, idx) =>
                        idx === i
                          ? { ...sec, requires_meilisearch: e.target.checked }
                          : sec
                      )
                    )
                  }
                />{" "}
                MeiliSearch
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setSections([
              ...sections,
              {
                title: "",
                description: "",
                sample_draft: "",
                requires_vector_search: false,
                requires_meilisearch: false,
              },
            ])
          }
          className="text-blue-600"
        >
          + Add Section
        </button>
        <button
          type="submit"
          className="block bg-green-600 text-white px-4 py-2 rounded"
        >
          Save Template
        </button>
      </form>
    </div>
  );
}
