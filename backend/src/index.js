const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require('path')

const authRoutes = require("./routes/auth");
const templatesRouter = require("./routes/templates");
const draftRoutes = require("./routes/draft");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("AI Legal Assistant Backend is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/templates", templatesRouter);
app.use("/api/uploads", express.static(path.join(__dirname, '../uploads'))); // serve uploaded files
app.use("/api/draft", draftRoutes);

console.log(__dirname)

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));