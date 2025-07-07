const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  requires_vector_search: { type: Boolean, default: false },
  requires_meilisearch: { type: Boolean, default: false },
});

const uploadedFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },        // saved file name (e.g. timestamped)
  originalName: { type: String, required: true },    // original file name
  path: { type: String, required: true },            // storage path (e.g. /uploads/...)
  uploadedAt: { type: Date, default: Date.now },
});

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    sections: [sectionSchema],
    uploadedFiles: [uploadedFileSchema], // 🔥 new field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Template", templateSchema);