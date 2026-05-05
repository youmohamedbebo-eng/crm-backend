import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  status: { type: String, default: "New" }
});

const Lead = mongoose.model("Lead", leadSchema);

app.post("/leads", async (req, res) => {
  const lead = await Lead.create(req.body);
  res.json(lead);
});

app.get("/leads", async (req, res) => {
  const leads = await Lead.find();
  res.json(leads);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});