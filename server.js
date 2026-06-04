require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI =
  process.env.MONGODB_URI ||  "mongodb://127.0.0.1:27017/hello";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const appointmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  date: { type: String, required: true },
  time: { type: String, required: true },
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    if (MONGODB_URI.includes("<db_password>")) {
      console.error(
        "Set your Atlas password in .env (copy .env.example and replace <db_password>)."
      );
    }
  });

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

async function createAppointment(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database not connected. Check MONGODB_URI in .env.",
      });
    }

    const { name, phone, email, date, time, message } = req.body;

    if (!name?.trim() || !phone?.trim() || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, date, and time are required.",
      });
    }

    const appointment = new Appointment({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || "",
      date,
      time,
      message: message?.trim() || "",
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: "Appointment saved",
    });
  } catch (error) {
    console.error("Appointment save error:", error);
    res.status(500).json({
      success: false,
      message: "Could not save appointment. Please try again.",
    });
  }
}

// Get all appointments

app.post("/api/appointments", createAppointment);
app.post("/server", createAppointment);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


app.get("/api/appointments", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Fetch appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Could not fetch appointments",
    });
  }
});