const mongoose = require("mongoose");

const draftSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Template"
  },
  content: {
    type: Object, // Assuming draft is a structured JSON
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Draft", draftSchema);