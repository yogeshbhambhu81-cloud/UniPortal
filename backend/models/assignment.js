import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  studentId: { type: String, required: true },
  department: { type: String, required: true },
  professorId: { type: String },
  reviewerName: { type: String },
  reviewerId: { type: String },
  title: { type: String, required: true },
  fileUrl: { type: String },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
});

export default mongoose.model("Assignment", assignmentSchema);
