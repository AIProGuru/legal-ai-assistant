import { useState, useEffect } from "react";

export default function AdminUpload() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE}/templates`)
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .catch((err) => console.error("Failed to load templates:", err));
  }, []);

  // Fetch uploaded files when template changes
  useEffect(() => {
    if (!selectedTemplate) return;

    fetch(`${API_BASE}/templates/${selectedTemplate}/files`)
      .then((res) => res.json())
      .then((data) => setUploadedFiles(data))
      .catch((err) => console.error("Failed to load uploaded files:", err));
  }, [selectedTemplate]);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplate || files.length === 0) {
      return alert("Please select a template and upload files.");
    }

    const formData = new FormData();
    formData.append("templateId", selectedTemplate);
    files.forEach((file) => formData.append("files", file));

    setStatus("Uploading...");
    setIsUploading(true);

    try {
      const res = await fetch(`${API_BASE}/templates/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setStatus(`✅ Uploaded ${files.length} file(s) successfully!`);
        setFiles([]);
        // Refresh uploaded file list
        const updated = await fetch(`${API_BASE}/templates/${selectedTemplate}/files`);
        const data = await updated.json();
        setUploadedFiles(data);
      } else {
        setStatus("❌ Upload failed: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      setStatus("❌ Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">📄 Upload Sample Documents</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Select Template:</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isUploading}
          >
            <option value="">-- Select Template --</option>
            {templates.map((template) => (
              <option key={template._id} value={template._id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Upload PDFs:</label>
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            className="w-full"
            disabled={isUploading}
          />
          {files.length > 0 && (
            <ul className="mt-2 text-sm list-disc list-inside">
              {files.map((file, i) => (
                <li key={i}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {status && <p className="mt-4 text-sm">{status}</p>}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">📁 Uploaded Files:</h3>
          <ul className="list-disc list-inside text-sm text-blue-700">
            {uploadedFiles.map((file, i) => (
              <li key={i}>
                <a
                  href={`${API_BASE}${file.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {file.filename}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
