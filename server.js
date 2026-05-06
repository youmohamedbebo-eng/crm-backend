import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

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
  password: String
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

  res.json(user);
});

// ================= LEADS =================

// Create Lead
app.post("/leads", async (req, res) => {
  const lead = await Lead.create(req.body);
  res.json(lead);
});

// Get Leads
app.get("/leads", async (req, res) => {
  const user = req.query.user;
  const leads = await Lead.find({ assignedTo: user });
  res.json(leads);
});

// Update Lead (Done / Status)
app.put("/leads/:id", async (req, res) => {
  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

// Delete Lead
app.delete("/leads/:id", async (req, res) => {
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