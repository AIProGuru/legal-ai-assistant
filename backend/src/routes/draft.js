const express = require("express");
const router = express.Router();
const { generateSectionDrafts } = require("../services/llm");
const Draft = require("../models/Draft");
const requireAuth = require("../middleware/auth");

// Protect all draft routes with authentication
router.use(requireAuth);

// Generate draft and immediately save to DB with userId
router.post("/", async (req, res) => {
  const { templateId, inputs } = req.body;

  if (!templateId || !inputs) {
    return res.status(400).json({ error: "Template ID and inputs are required." });
  }

  try {
    const drafts = await generateSectionDrafts(templateId, inputs);

    const saved = await Draft.create({
      templateId,
      userId: req.user._id,           // 👈 Save user ID
      content: drafts,
      createdAt: new Date()
    });

    res.json({ draft: saved.content, draftId: saved._id });
  } catch (err) {
    console.error("Draft generation failed:", err);
    res.status(500).json({ error: "Failed to generate and save draft." });
  }
});

// Get draft history for the logged-in user only
router.get("/history/:templateId", async (req, res) => {
  try {
    const drafts = await Draft.find({
      templateId: req.params.templateId,
      userId: req.user._id            // 👈 Filter by user ID
    }).sort({ createdAt: -1 });

    res.json(drafts);
  } catch (err) {
    console.error("Fetching draft history failed:", err);
    res.status(500).json({ error: "Failed to load draft history." });
  }
});

// Update existing draft (only if it belongs to the user)
router.put("/:id", async (req, res) => {
  const { draft } = req.body;

  if (!draft) {
    return res.status(400).json({ error: "Draft content is required for update." });
  }

  try {
    const updated = await Draft.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id          // 👈 Ensure user owns the draft
      },
      { content: draft },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Draft not found or not authorized." });
    }

    res.json({ success: true, updated });
  } catch (err) {
    console.error("Updating draft failed:", err);
    res.status(500).json({ error: "Failed to update draft." });
  }
});

module.exports = router;
