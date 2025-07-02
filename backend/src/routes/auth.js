const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed, role });
  await user.save();
  res.send("User registered");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send("Invalid credentials");
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
});

module.exports = router;