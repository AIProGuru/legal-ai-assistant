// File: src/pages/admin/EditTemplate.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

export default function EditTemplate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/templates/${id}`)
      .then((res) => res.json())
      .then(setTemplate);
  }, [id]);

  const updateTemplateField = (field, value) => {
    setTemplate((prev) => ({ ...prev, [field]: value }));
  };

  const updateSectionField = (index, field, value) => {
    const updatedSections = [...template.sections];
    updatedSections[index][field] = value;
    setTemplate((prev) => ({ ...prev, sections: updatedSections }));
  };

  const addSection = () => {
    setTemplate((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title: "",
          description: "",
          requires_vector_search: false,
          requires_meilisearch: false,
        },
      ],
    }));
  };

  const removeSection = (index) => {
    const updatedSections = [...template.sections];
    updatedSections.splice(index, 1);
    setTemplate((prev) => ({ ...prev, sections: updatedSections }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      navigate("/admin/templates");
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!template) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">✏️ Edit Template</h2>

      {/* Template Details */}
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Template Name</label>
          <Input
            value={template.name}
            onChange={(e) => updateTemplateField("name", e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Description</label>
          <Textarea
            value={template.description}
            onChange={(e) =>
              updateTemplateField("description", e.target.value)
            }
            rows={3}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">📑 Sections</h3>
          <Button
            type="button"
            variant="outline"
            onClick={addSection}
            className="flex items-center gap-1"
          >
            <Plus size={16} />
            Add Section
          </Button>
        </div>

        {template.sections.map((section, index) => (
          <div
            key={index}
            className="border p-4 rounded bg-gray-50 relative space-y-3"
          >
            <div className="absolute right-4 top-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSection(index)}
              >
                <Trash2 className="text-red-500" size={18} />
              </Button>
            </div>

            <div>
              <label className="block font-medium mb-1">Title</label>
              <Input
                value={section.title}
                onChange={(e) =>
                  updateSectionField(index, "title", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Description</label>
              <Textarea
                rows={2}
                value={section.description}
                onChange={(e) =>
                  updateSectionField(index, "description", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Sample Draft</label>
              <Textarea
                rows={4}
                value={section.sample_draft}
                onChange={(e) =>
                  updateSectionField(index, "sample_draft", e.target.value)
                }
              />
            </div>

            <div className="flex gap-4 items-center">


              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={section.requires_meilisearch}
                  onChange={(e) =>
                    updateSectionField(index, "requires_meilisearch", e.target.checked)
                  }
                />
                <span className="text-sm text-gray-700">MeiliSearch</span>
              </label>

            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Saving..." : "💾 Save Changes"}
      </Button>
    </div>
  );
}
