const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, enum: ['admin', 'editor', 'user'], default: 'user' }
});

module.exports = mongoose.model("User", userSchema);