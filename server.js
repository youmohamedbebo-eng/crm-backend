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
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },

  role: { type: String, default: "sales" }, // admin | sales
  companyId: { type: String, required: true },

  plan: { type: String, default: "free" } // free | pro | team
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
  } catch {
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
      companyId: user.companyId,
      plan: user.plan
    },
    "secretkey",
    { expiresIn: "7d" }
  );

  res.json({ user, token });
});

// ================= CREATE LEAD =================
app.post("/leads", auth, async (req, res) => {
  try {
    const lead = await Lead.create({
      name: req.body.name,
      phone: req.body.phone,
      status: "New",

      assignedTo: req.user.email,
      companyId: req.user.companyId,

      notes: []
    });

    res.json(lead);
  } catch {
    res.status(500).json({ message: "Error creating lead" });
  }
});

// ================= GET LEADS (SAAS SECURITY) =================
app.get("/leads", auth, async (req, res) => {
  try {
    let filter = { companyId: req.user.companyId };

    if (req.user.role !== "admin") {
      filter.assignedTo = req.user.email;
    }

    const leads = await Lead.find(filter);
    res.json(leads);

  } catch {
    res.status(500).json({ message: "Error fetching leads" });
  }
});

// ================= UPDATE LEAD =================
app.put("/leads/:id", auth, async (req, res) => {
  try {
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
  } catch {
    res.status(500).json({ message: "Error updating lead" });
  }
});

// ================= ADD NOTE =================
app.put("/leads/:id/note", auth, async (req, res) => {
  try {
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

  } catch {
    res.status(500).json({ message: "Error adding note" });
  }
});

// ================= DELETE LEAD =================
app.delete("/leads/:id", auth, async (req, res) => {
  try {
    await Lead.deleteOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    res.json({ message: "Deleted" });

  } catch {
    res.status(500).json({ message: "Error deleting lead" });
  }
});

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("CRM SaaS Pro Max Running 🚀");
});

// ================= START =================
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});