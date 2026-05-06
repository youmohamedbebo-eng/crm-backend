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
  companyId: { type: String, required: true },

  plan: { type: String, default: "free" }
});

const User = mongoose.model("User", userSchema);

// ================= LEAD =================
const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,

  status: {
    type: String,
    default: "New",
    enum: ["New", "Contacted", "Interested", "Not Interested", "Closed Won"]
  },

  assignedTo: String,
  companyId: String,

  notes: [
    {
      text: String,
      createdBy: String,
      date: { type: Date, default: Date.now }
    }
  ]
});

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

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});

// ================= LOGIN =================
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
      role: user.role,
      companyId: user.companyId,
      plan: user.plan
    },
    "secretkey",
    { expiresIn: "7d" }
  );

  res.json({ user, token });
});

// ================= LEAD LIMIT (FREE PLAN) =================
const checkLimit = async (req, res, next) => {
  const count = await Lead.countDocuments({
    companyId: req.user.companyId
  });

  if (req.user.plan === "free" && count >= 20) {
    return res.status(403).json({
      message: "Free limit reached. Upgrade to Pro 🚀"
    });
  }

  next();
};

// ================= CREATE LEAD =================
app.post("/leads", auth, checkLimit, async (req, res) => {
  const lead = await Lead.create({
    name: req.body.name,
    phone: req.body.phone,
    status: "New",

    assignedTo: req.user.email,
    companyId: req.user.companyId,

    notes: []
  });

  res.json(lead);
});

// ================= GET LEADS =================
app.get("/leads", auth, async (req, res) => {
  let filter = { companyId: req.user.companyId };

  if (req.user.role !== "admin") {
    filter.assignedTo = req.user.email;
  }

  const leads = await Lead.find(filter);
  res.json(leads);
});

// ================= UPDATE LEAD =================
app.put("/leads/:id", auth, async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!lead) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updated);
});

// ================= ADD NOTE =================
app.put("/leads/:id/note", auth, async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!lead) {
    return res.status(403).json({ message: "Not allowed" });
  }

  lead.notes.push({
    text: req.body.text,
    createdBy: req.user.email
  });

  await lead.save();

  res.json(lead);
});

// ================= DELETE LEAD =================
app.delete("/leads/:id", auth, async (req, res) => {
  await Lead.deleteOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  res.json({ message: "Deleted" });
});

// ================= ANALYTICS (SaaS FEATURE) =================
app.get("/analytics", auth, async (req, res) => {
  const total = await Lead.countDocuments({ companyId: req.user.companyId });

  const interested = await Lead.countDocuments({
    companyId: req.user.companyId,
    status: "Interested"
  });

  const closed = await Lead.countDocuments({
    companyId: req.user.companyId,
    status: "Closed Won"
  });

  res.json({ total, interested, closed });
});

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("🚀 CRM SaaS Pro Max v3 Running");
});

// ================= START =================
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});