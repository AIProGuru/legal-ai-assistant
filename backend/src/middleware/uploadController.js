const Template = require("../models/Template");
const { extractTextFromPDF } = require("../services/pdfParser");
const { chunkText } = require("../services/chunker");
const { embedText, upsertToPinecone } = require("../services/vectorService");

async function handleUpload(req, res) {
  try {
    const { templateId } = req.body;
    const files = req.files;

    if (!templateId) {
      return res.status(400).json({ error: "Missing templateId" });
    }

    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    for (const file of files) {
      const text = await extractTextFromPDF(file.path);
      const chunks = chunkText(text);
      const embeddings = await embedText(chunks);

      await upsertToPinecone(chunks, embeddings, {
        templateId: template._id.toString(),
        templateName: template.name,
        filename: file.originalname,
      });

      // Save file info in MongoDB template
      template.uploadedFiles.push({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
      });
    }

    await template.save();
    res.json({ success: true, template });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
}

module.exports = { handleUpload };
