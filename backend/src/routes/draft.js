// routes/draft.js

const express = require("express");
const router = express.Router();
const { generateSectionDrafts } = require("../services/llm");

router.post("/", async (req, res) => {
  const { templateId, inputs } = req.body;

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

module.exports = router;
