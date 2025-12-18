import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    studentName: String,
    studentEmail: String,
    studentId: String,
    department: String,
    title: String,
    fileUrl: String,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "submitted", "rechecking"],
      default: "pending"
    },

    reviewerId: String,
    reviewerName: String,

    hodId: String,
    hodName: String,

    reviewedAt: Date,
    hodReviewedAt: Date,

    recheckNote: String,

    submittedAt: {
      type: Date,
      default: Date.now
    },

    submittedAtFormatted: String
  },
  { timestamps: true }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
