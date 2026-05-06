import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ===== MongoDB =====
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ===== USER (Sales) =====
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// ===== LEAD =====
const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  status: { type: String, default: "New" },
  assignedTo: String
});

const Lead = mongoose.model("Lead", leadSchema);

// ===== AUTH =====
app.post("/register", async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});

app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(401).send("Invalid");
  res.json(user);
});

// ===== LEADS =====
app.post("/leads", async (req, res) => {
  const lead = await Lead.create(req.body);
  res.json(lead);
});

app.get("/leads", async (req, res) => {
  const leads = await Lead.find();
  res.json(leads);
});

app.listen(5000, () => {
  console.log("Server running");
});