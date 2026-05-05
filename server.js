import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ route رئيسي للتجربة
app.get("/", (req, res) => {
  res.send("CRM API is running 🚀");
});

// 🔗 الاتصال ب MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// 📦 schema
const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  status: { type: String, default: "New" }
});

const Lead = mongoose.model("Lead", leadSchema);

// 📥 add lead
app.post("/leads", async (req, res) => {
  const lead = await Lead.create(req.body);
  res.json(lead);
});

// 📤 get leads
app.get("/leads", async (req, res) => {
  const leads = await Lead.find();
  res.json(leads);
});

// 🚀 تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});