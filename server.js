import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= MongoDB =================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err));

// ================= USER =================
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: "sales" } // 🟢 admin / sales
});

const User = mongoose.model("User", userSchema);

// ================= LEAD =================
const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  status: { type: String, default: "New" },
  assignedTo: String
});

const Lead = mongoose.model("Lead", leadSchema);

// ================= AUTH MIDDLEWARE =================
const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================= AUTH =================
app.post("/register", async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (!user) {
    return res.status(401).json({ message: "Invalid login" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    "secretkey",
    { expiresIn: "7d" }
  );

  res.json({ user, token });
});

// ================= LEADS =================

// Create Lead
app.post("/leads", auth, async (req, res) => {
  const lead = await Lead.create({
    ...req.body,
    assignedTo: req.user.email
  });

  res.json(lead);
});

// Get Leads
app.get("/leads", auth, async (req, res) => {
  let leads;

  // 👑 Admin يشوف الكل
  if (req.user.role === "admin") {
    leads = await Lead.find();
  } else {
    // 👤 Sales يشوف بتاعه بس
    leads = await Lead.find({ assignedTo: req.user.email });
  }

  res.json(leads);
});

// Update Lead
app.put("/leads/:id", auth, async (req, res) => {
  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updated);
});

// Delete Lead
app.delete("/leads/:id", auth, async (req, res) => {
  await Lead.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ================= SERVER =================
app.get("/", (req, res) => {
  res.send("CRM API Running 🚀");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});