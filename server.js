import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= DB =================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected 🚀"))
  .catch(err => console.log(err));

// ================= MODELS =================
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "sales" },
  companyId: String,
  plan: { type: String, default: "free" }
});

const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  status: { type: String, default: "New" },
  assignedTo: String,
  companyId: String,
  notes: [{ text: String, date: { type: Date, default: Date.now } }]
});

const User = mongoose.model("User", userSchema);
const Lead = mongoose.model("Lead", leadSchema);

// ================= AUTH =================
const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
    password: req.body.password
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid login" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      plan: user.plan
    },
    "secretkey",
    { expiresIn: "7d" }
  );

  res.json({ user, token });
});

// ================= GET LEADS =================
app.get("/leads", auth, async (req, res) => {
  const leads = await Lead.find({ companyId: req.user.companyId });
  res.json(leads);
});

// ================= CREATE LEAD =================
app.post("/leads", auth, async (req, res) => {
  const lead = await Lead.create({
    name: req.body.name,
    phone: req.body.phone,
    status: "New",
    companyId: req.user.companyId,
    assignedTo: req.user.email
  });

  res.json(lead);
});

// ================= FIXED UPDATE (IMPORTANT 🔥) =================
app.put("/leads/:id", auth, async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!lead) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // allow status update
    if (req.body.status) {
      lead.status = req.body.status;
    }

    if (req.body.name) lead.name = req.body.name;
    if (req.body.phone) lead.phone = req.body.phone;

    await lead.save();

    res.json(lead);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= NOTES =================
app.put("/leads/:id/note", auth, async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!lead) {
    return res.status(403).json({ message: "Not allowed" });
  }

  lead.notes.push({ text: req.body.text });
  await lead.save();

  res.json(lead);
});

// ================= DELETE =================
app.delete("/leads/:id", auth, async (req, res) => {
  await Lead.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  res.json({ message: "Deleted" });
});

// ================= START =================
app.listen(5000, () => {
  console.log("🚀 Y1CRM SaaS Running on 5000");
});