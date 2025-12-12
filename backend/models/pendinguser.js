import mongoose from "mongoose";

const pendingSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  department: String,
  otp: String,
  otpExpiresAt: Date,
  isEmailVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("PendingUser", pendingSchema);
