import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Save, X } from "lucide-react";

export default function CaseDrafting() {
    const { templateId } = useParams();
    const [template, setTemplate] = useState(null);
    const [inputs, setInputs] = useState({});
    const [drafts, setDrafts] = useState([]);
    const [currentDraft, setCurrentDraft] = useState(null);
    const [currentDraftId, setCurrentDraftId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedDraft, setEditedDraft] = useState({});
    const [expandedHistory, setExpandedHistory] = useState(null);
    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    const authHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
    };

    const fetchDraftHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/draft/history/${templateId}`, {
                headers: authHeaders(),
            });

            if (!res.ok) throw new Error("Not authorized");
            const data = await res.json();
            setDrafts(data);
        } catch (err) {
            console.error("Failed to load draft history", err);
        }
    };

    useEffect(() => {
        fetch(`${API_BASE}/templates/${templateId}`)
            .then((res) => res.json())
            .then((data) => {
                setTemplate(data);
                const defaultInputs = {};
                data.sections.forEach((s) => (defaultInputs[s.title] = ""));
                setInputs(defaultInputs);
            });

        fetchDraftHistory();
    }, [templateId]);

    const handleInputChange = (title, value) => {
        setInputs((prev) => ({ ...prev, [title]: value }));
    };

    const handleGenerate = async () => {
        setLoading(true);
        setCurrentDraft(null);
        setCurrentDraftId(null);

        try {
            const res = await fetch(`${API_BASE}/draft`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    templateId,
                    inputs,
                }),
            });

            if (!res.ok) throw new Error("Generation failed");

            const data = await res.json();
            setCurrentDraft(data.draft);
            setCurrentDraftId(data.draftId);
            await fetchDraftHistory();
        } catch (err) {
            setCurrentDraft("⚠️ Error generating draft.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleEditMode = () => {
        if (editMode) {
            updateEditedDraft(editedDraft);
            setCurrentDraft(editedDraft);
            setEditMode(false);
        } else {
            setEditedDraft({ ...currentDraft });
            setEditMode(true);
        }
    };

    const updateEditedDraft = async (parsedDraft) => {
        if (!currentDraftId) {
            console.warn("No currentDraftId to update");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/draft/${currentDraftId}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({ draft: parsedDraft }),
            });

            if (!res.ok) throw new Error("Update failed");

            await fetchDraftHistory();
        } catch (err) {
            console.error("Failed to update edited draft", err);
        }
    };

    if (!template) return <div className="p-6 text-gray-600">Loading template...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">
                {template.name} – Draft Generator
            </h2>

            {/* Uploaded Files */}
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

            <Button onClick={handleGenerate} disabled={loading} className="mt-4">
                {loading && <Loader2 className="animate-spin mr-2" />}
                Generate Draft
            </Button>

            {/* Current Draft */}
            {currentDraft && (
                <div className="border rounded p-4 space-y-4 bg-gray-50 mt-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">📝 Current Draft</h3>
                        <div className="flex gap-2">
                            {editMode ? (
                                <>
                                    <Button size="sm" onClick={toggleEditMode}>
                                        <Save className="mr-1" />
                                        Save
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>
                                        <X className="mr-1" />
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" variant="outline" onClick={toggleEditMode}>
                                    <Pencil className="mr-1" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>

                    {template.sections.map((section) => (
                        <div key={section.title} className="bg-white p-3 rounded border">
                            <h4 className="font-semibold text-gray-700 mb-1">{section.title}</h4>
                            {editMode ? (
                                <Textarea
                                    rows={4}
                                    className="text-sm"
                                    value={editedDraft[section.title] || ""}
                                    onChange={(e) =>
                                        setEditedDraft((prev) => ({
                                            ...prev,
                                            [section.title]: e.target.value,
                                        }))
                                    }
                                />
                            ) : (
                                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                                    {currentDraft[section.title]}
                                </pre>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Draft History */}
            {drafts.length > 0 && (
                <div className="mt-8 space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">📜 Draft History</h3>
                    {drafts.map((d, idx) => {
                        const isExpanded = expandedHistory === idx;
                        const content = typeof d.content === "object" ? d.content : {};
                        return (
                            <div
                                key={idx}
                                className="bg-white border rounded p-3 shadow-sm cursor-pointer"
                                onClick={() => setExpandedHistory(isExpanded ? null : idx)}
                            >
                                <div className="text-sm text-blue-700 font-medium">
                                    {new Date(d.createdAt).toLocaleString()}
                                </div>
                                {isExpanded && (
                                    <div className="mt-2 space-y-3">
                                        {Object.entries(content).map(([title, val]) => (
                                            <div key={title}>
                                                <div className="font-semibold text-gray-700">{title}</div>
                                                <pre className="text-sm text-gray-800 whitespace-pre-wrap">{val}</pre>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
