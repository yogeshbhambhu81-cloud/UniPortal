import express from "express";
import Assignment from "../models/assignment.js";
import verifyProfessor from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();
router.use(verifyProfessor);

router.get("/assignments-counts", async (req, res) => {
  const d = req.user.department;
  const pending = await Assignment.countDocuments({ department: d, status: "pending" });
  const approved = await Assignment.countDocuments({ department: d, status: "approved" });
  const rejected = await Assignment.countDocuments({ department: d, status: "rejected" });
  res.json({ pending, approved, rejected, reviewed: approved + rejected });
});

router.get("/assignments/:tab", async (req, res) => {
  const { tab } = req.params;
  const d = req.user.department;

  let query = { department: d };

  if (tab === "pending") query.status = "pending";
  else if (tab === "approved") query.status = "approved";
  else if (tab === "rejected") query.status = "rejected";
  else query.status = { $in: ["approved", "rejected"] };

  const assignments = await Assignment.find(query).lean();
  res.json(assignments);
});

router.patch("/assignments/:id/:status", async (req, res) => {
  const { id, status } = req.params;
  const target = status === "approve" ? "approved" : "rejected";
  const d = req.user.department;

  const a = await Assignment.findOne({ _id: id, department: d });
  if (!a) return res.status(404).json({ message: "Assignment not found" });

  const updated = await Assignment.findByIdAndUpdate(
    id,
    {
      status: target,
      reviewerId: req.user.id,
      reviewerName: req.user.name,
      reviewedAt: new Date()
    },
    { new: true }
  );

  res.json({ message: "Updated", updated });
});


// ------------------------------------------------------------
// ✅ FILE DOWNLOAD ROUTE (WORKING LIKE STUDENT DOWNLOAD)
// ------------------------------------------------------------
router.get("/assignment/file/:id", async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const assignment = await Assignment.findOne({
      fileUrl: req.params.id,
      department: req.user.department
    });

    if (!assignment) {
      return res.status(404).json({ message: "File not found or access denied" });
    }

    const bucket = req.app.locals.bucket;

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "File not found in storage" });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=" + files[0].filename,
    });

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on("error", () => {
      return res.status(404).json({ message: "Error streaming file" });
    });

    downloadStream.pipe(res);

  } catch (err) {
    console.error("PDF VIEW ERROR:", err);
    res.status(500).json({ message: "Error loading file" });
  }
});


export default router;
