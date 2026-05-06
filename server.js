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
  email: String,
  password: String,
  role: { type: String, default: "sales" }, // admin | sales
  companyId: { type: String, required: true }
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
      date: { type: Date, default: Date.now }
    }
  ]
});

const Lead = mongoose.model("Lead", leadSchema);

// ================= AUTH MIDDLEWARE =================
const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
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
      role: user.role,
      companyId: user.companyId
    },
    "secretkey",
    { expiresIn: "7d" }
  );

  res.json({ user, token });
});

// ================= LEADS =================

// Create Lead
app.post("/leads", auth, async (req, res) => {
  try {
    const lead = await Lead.create({
      name: req.body.name,
      phone: req.body.phone,
      status: req.body.status || "New",
      assignedTo: req.user.email,
      companyId: req.user.companyId,
      notes: []
    });

    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: "Error creating lead" });
  }
});

// Get Leads (SaaS FILTER)
app.get("/leads", auth, async (req, res) => {
  try {
    let filter = { companyId: req.user.companyId };

    if (req.user.role !== "admin") {
      filter.assignedTo = req.user.email;
    }

    const leads = await Lead.find(filter);
    res.json(leads);

  } catch (err) {
    res.status(500).json({ message: "Error fetching leads" });
  }
});

// Update Lead
app.put("/leads/:id", auth, async (req, res) => {
  try {
    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating lead" });
  }
});

// ================= ADD NOTE =================
app.put("/leads/:id/note", auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.notes.push({ text: req.body.text });
    await lead.save();

    res.json(lead);

  } catch (err) {
    res.status(500).json({ message: "Error adding note" });
  }
});

// Delete Lead
app.delete("/leads/:id", auth, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting lead" });
  }
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("CRM SaaS Pro Max API Running 🚀");
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});