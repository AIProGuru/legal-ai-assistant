const express = require("express");
const router = express.Router();

// In-memory store for now, replace with DB later
let templates = [];

// Get all templates
router.get("/", (req, res) => {
  res.json(templates);
});

// Create a new template
router.post("/", (req, res) => {
  const { name, description, sections } = req.body;
  if (!name || !sections || !Array.isArray(sections)) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newTemplate = {
    id: templates.length + 1,
    name,
    description: description || "",
    sections,
  };
  templates.push(newTemplate);
  res.status(201).json(newTemplate);
});

// Get template by id
router.get("/:id", (req, res) => {
  const template = templates.find((t) => t.id === parseInt(req.params.id));
  if (!template) return res.status(404).json({ error: "Template not found" });
  res.json(template);
});

module.exports = router;
