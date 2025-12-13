import express from "express";
import Assignment from "../models/assignment.js";
import User from "../models/user.js";
import verifyHod from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();
router.use(verifyHod);

router.get("/counts", async (req, res) => {
  const d = req.user.department;

  const approved = await Assignment.countDocuments({
    department: d,
    status: "approved"
  });

  const rechecking = await Assignment.countDocuments({
    department: d,
    status: "rechecking"
  });

  res.json({ approved, rechecking });
});

router.get("/assignments/:tab", async (req, res) => {
  const d = req.user.department;

  let query = { department: d };

  if (req.params.tab === "approved") query.status = "approved";
  else if (req.params.tab === "rechecking") query.status = "rechecking";

  const data = await Assignment.find(query).lean();
  res.json(data);
});

router.patch("/assignments/:id/submit", async (req, res) => {
  const updated = await Assignment.findByIdAndUpdate(
    req.params.id,
    {
      status: "submitted",
      hodId: req.user.id,
      hodName: req.user.name,
      hodReviewedAt: new Date()
    },
    { new: true }
  );

  res.json(updated);
});

router.patch("/assignments/:id/recheck", async (req, res) => {
  const a = await Assignment.findById(req.params.id);

  if (!a) return res.status(404).json({ message: "Not found" });

  a.status = "rechecking";
  a.recheckNote = "HOD has sent this assignment back for rechecking.";
  await a.save();

  res.json(a);
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

router.get("/students", async (req, res) => {
  const students = await User.find({
    department: req.user.department,
    role: "student"
  }).lean();

  const result = await Promise.all(
    students.map(async s => {
      const count = await Assignment.countDocuments({
        studentId: s._id.toString()
      });
      return { ...s, total: count };
    })
  );

  res.json(result);
});

router.get("/student/:id/assignments", async (req, res) => {
  const data = await Assignment.find({
    studentId: req.params.id,
    status: { $in: ["approved", "submitted"] }
  }).lean();

  res.json(data);
});

export default router;
