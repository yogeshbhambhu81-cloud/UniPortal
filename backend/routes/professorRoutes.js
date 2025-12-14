import express from "express";
import Assignment from "../models/assignment.js";
import verifyProfessor from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();
router.use(verifyProfessor);

router.get("/assignments-counts", async (req, res) => {
  const d = req.user.department;

  const pending = await Assignment.countDocuments({
    department: d,
    status: "pending"
  });

  const rechecking = await Assignment.countDocuments({
    department: d,
    status: "rechecking",
    reviewerId: req.user.id
  });

  const approved = await Assignment.countDocuments({
    department: d,
    status: "approved"
  });

  const rejected = await Assignment.countDocuments({
    department: d,
    status: "rejected"
  });

  res.json({
    pending,
    rechecking,
    approved,
    rejected,
    reviewed: approved + rejected
  });
});

router.get("/assignments/:tab", async (req, res) => {
  const d = req.user.department;
  const tab = req.params.tab;

  let query = { department: d };

  if (tab === "pending") {
    query.status = { $in: ["pending", "rechecking"] };
    query.$or = [
      { status: "pending" },
      { status: "rechecking", reviewerId: req.user.id }
    ];
  } 
  else if (tab === "approved") {
    query.status = "approved";
  } 
  else if (tab === "rejected") {
    query.status = "rejected";
  }

  const data = await Assignment.find(query).sort({ createdAt: -1 }).lean();
  res.json(data);
});

router.patch("/assignments/:id/:action", async (req, res) => {
  const { id, action } = req.params;
  const target = action === "approve" ? "approved" : "rejected";

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  // Department check
  if (assignment.department !== req.user.department) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  // 🔒 If already reviewed, only same professor can update
  if (
    ["approved", "rejected"].includes(assignment.status) &&
    assignment.reviewerId &&
    assignment.reviewerId.toString() !== req.user.id
  ) {
    return res
      .status(403)
      .json({ message: "Only original reviewer can update this assignment" });
  }

  assignment.status = target;
  assignment.reviewerId = req.user.id;
  assignment.reviewerName = req.user.name;
  assignment.reviewedAt = new Date();

  await assignment.save();
  res.json(assignment);
});


router.get("/assignment/file/:id", async (req, res) => {
  const bucket = req.app.locals.bucket;
  const fileId = new mongoose.Types.ObjectId(req.params.id);

  const files = await bucket.find({ _id: fileId }).toArray();
  if (!files.length) return res.sendStatus(404);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=" + files[0].filename
  });

  bucket.openDownloadStream(fileId).pipe(res);
});

export default router;
