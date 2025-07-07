const express = require("express");
const router = express.Router();
const Template = require("../models/Template");
const upload = require("../middleware/upload");
const { handleUpload } = require("../middleware/uploadController");

// GET all templates
router.get("/", async (req, res) => {
  const templates = await Template.find().sort({ createdAt: -1 });
  res.json(templates);
});

// GET single template
router.get("/:id", async (req, res) => {
  const template = await Template.findById(req.params.id);
  if (!template) return res.status(404).json({ error: "Not found" });
  res.json(template);
});

// POST create new template
router.post("/", async (req, res) => {
  try {
    const { name, description, sections } = req.body;
    const newTemplate = await Template.create({ name, description, sections });
    res.status(201).json(newTemplate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE template
router.delete("/:id", async (req, res) => {
  await Template.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// POST /api/templates/upload
router.post("/upload", upload.array("files", 10), handleUpload);



router.get("/:id/files", async (req, res) => {
  const { id } = req.params;

  try {
    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const files = (template.uploadedFiles || []).map((file) => ({
      filename: file.originalName || file.filename,
      url: `/uploads/${file.filename}`,
    }));

    res.json(files);
  } catch (err) {
    console.error("Failed to fetch uploaded files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

module.exports = router