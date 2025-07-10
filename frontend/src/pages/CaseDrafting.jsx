import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Save } from "lucide-react";

export default function CaseDrafting() {
    const { templateId } = useParams();
    const [template, setTemplate] = useState(null);
    const [inputs, setInputs] = useState({});
    const [draft, setDraft] = useState("");
    const [rawDraft, setRawDraft] = useState("");
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetch(`${API_BASE}/templates/${templateId}`)
            .then((res) => res.json())
            .then((data) => {
                setTemplate(data);
                const defaultInputs = {};
                data.sections.forEach((s) => {
                    defaultInputs[s.title] = "";
                });
                setInputs(defaultInputs);
            });
    }, [templateId]);

    const handleInputChange = (title, value) => {
        setInputs((prev) => ({ ...prev, [title]: value }));
    };

    const handleGenerate = async () => {
        setLoading(true);
        setDraft("");

        try {
            const res = await fetch(`${API_BASE}/draft`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId,
                    inputs,
                }),
            });

            const data = await res.json();
            setDraft(data.draft);
        } catch (err) {
            setDraft("⚠️ Error generating draft.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleEditMode = () => {
        if (editMode) {
            try {
                const parsed = JSON.parse(rawDraft);
                setDraft(parsed);
                setEditMode(false);
            } catch (e) {
                alert("⚠️ Invalid JSON. Please fix syntax before saving.");
            }
        } else {
            const draftStr = typeof draft === "string" ? draft : JSON.stringify(draft, null, 2);
            setRawDraft(draftStr);
            setEditMode(true);
        }
    };

    if (!template) return <div className="p-6 text-gray-600">Loading template...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">{template.name} – Draft Generator</h2>

            {/* Sample Files */}
            {template.uploadedFiles?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded border">
                    <h3 className="font-semibold mb-2 text-gray-700">📎 Sample Documents:</h3>
                    <ul className="list-disc pl-5 text-blue-600 text-sm">
                        {template.uploadedFiles.map((file, idx) => (
                            <li key={idx}>
                                <a
                                    href={`${API_BASE}/${file.path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline"
                                >
                                    {file.originalName}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Section Inputs */}
            <div className="space-y-5">
                {template.sections.map((section) => (
                    <div key={section.title}>
                        <label className="block text-lg font-medium text-gray-800 mb-1">
                            {section.title}
                        </label>
                        <Textarea
                            rows={5}
                            className="text-sm"
                            value={inputs[section.title]}
                            onChange={(e) => handleInputChange(section.title, e.target.value)}
                            placeholder={section.description || "Enter content..."}
                        />
                    </div>
                ))}
            </div>

            <Button
                onClick={handleGenerate}
                disabled={loading}
                className="mt-4"
            >
                {loading && <Loader2 className="animate-spin mr-2" />}
                Generate Draft
            </Button>

            {/* Draft Output */}
            {draft && (
                <div className="border rounded p-4 space-y-3 bg-gray-50 mt-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">📝 Draft</h3>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={toggleEditMode}
                        >
                            {editMode ? <Save className="mr-1" /> : <Pencil className="mr-1" />}
                            {editMode ? "Save" : "Edit"}
                        </Button>
                    </div>

                    {editMode ? (
                        <Textarea
                            rows={15}
                            className="text-sm font-mono"
                            value={rawDraft}
                            onChange={(e) => setRawDraft(e.target.value)}
                        />
                    ) : (
                        typeof draft === "object" ? (
                            Object.entries(draft).map(([title, content]) => (
                                <div key={title} className="bg-white p-3 rounded border">
                                    <h4 className="font-semibold text-gray-700 mb-1">{title}</h4>
                                    <pre className="whitespace-pre-wrap text-sm text-gray-800">{content}</pre>
                                </div>
                            ))
                        ) : (
                            <pre className="whitespace-pre-wrap text-sm text-gray-800">{draft}</pre>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
