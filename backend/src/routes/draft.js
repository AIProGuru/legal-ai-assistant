// routes/draft.js

const express = require("express");
const router = express.Router();
const { generateSectionDrafts } = require("../services/llm");
const Draft = require("../models/Draft")

router.post("/", async (req, res) => {
  const { templateId, inputs } = req.body;

  console.log(inputs)

  if (!templateId || !inputs) {
    return res.status(400).json({ error: "Template ID and inputs are required." });
  }

  try {
    const drafts = await generateSectionDrafts(templateId, inputs);
    console.log(drafts)
    res.json({ draft: drafts });
  } catch (err) {
    console.error("Draft generation failed:", err);
    res.status(500).json({ error: "Failed to generate draft." });
  }
});

router.get("/history/:templateId", async (req, res) => {
  const drafts = await Draft.find({ templateId: req.params.templateId })
    .sort({ createdAt: -1 });
  res.json(drafts);
});

router.post("/save", async (req, res) => {
  const { templateId, draft } = req.body;

  if (!templateId || !draft) {
    return res.status(400).json({ error: "Template ID and draft are required." });
  }

  try {
    const saved = await Draft.create({
      templateId,
      content: draft,
      createdAt: new Date()
    });

    res.json({ success: true, saved });
  } catch (err) {
    console.error("Saving edited draft failed:", err);
    res.status(500).json({ error: "Failed to save draft." });
  }
});


module.exports = router;
