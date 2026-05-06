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
  .then(() => console.log("MongoDB Connected 🚀"))
  .catch(err => console.log("Mongo Error:", err));

// ================= USER =================
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "sales" },
  companyId: String,
  plan: { type: String, default: "free" }
});

const User = mongoose.model("User", userSchema);

// ================= LEAD =================
const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  status: { type: String, default: "New" },
  assignedTo: String,
  companyId: String,
  notes: [{ text: String, date: { type: Date, default: Date.now } }]
});

const Lead = mongoose.model("Lead", leadSchema);

// ================= AUTH =================
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, "secretkey");
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);

  if (!user) return res.status(401).json({ message: "Invalid login" });

  const token = jwt.sign(user.toObject(), "secretkey", { expiresIn: "7d" });

  res.json({ user, token });
});

// ================= LEADS =================
app.get("/leads", auth, async (req, res) => {
  const leads = await Lead.find({ companyId: req.user.companyId });
  res.json(leads);
});

app.post("/leads", auth, async (req, res) => {
  const lead = await Lead.create({
    ...req.body,
    companyId: req.user.companyId
  });

  res.json(lead);
});

app.put("/leads/:id", auth, async (req, res) => {
  const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.put("/leads/:id/note", auth, async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  lead.notes.push({ text: req.body.text });
  await lead.save();
  res.json(lead);
});

app.delete("/leads/:id", auth, async (req, res) => {
  await Lead.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ================= START =================
app.listen(5000, () => console.log("🚀 Y1CRM SaaS Running"));