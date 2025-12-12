import express from "express";
import User from "../models/user.js";
import PendingUser from "../models/pendinguser.js";
import Assignment from "../models/assignment.js";
import auth from "../middleware/auth.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendMail = async ({ to, subject, text }) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
  } catch {}
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  next();
};

router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const allUsersRaw = await User.find();
    const allUsers = allUsersRaw.map((u) => ({ ...u._doc, role: (u.role || "").trim().toLowerCase() }));

    res.json({
      student: allUsers.filter((u) => u.role === "student"),
      professor: allUsers.filter((u) => u.role === "professor"),
      hod: allUsers.filter((u) => u.role === "hod"),
      counts: {
        student: allUsers.filter((u) => u.role === "student").length,
        professor: allUsers.filter((u) => u.role === "professor").length,
        hod: allUsers.filter((u) => u.role === "hod").length
      }
    });
  } catch {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/pending", auth, isAdmin, async (req, res) => {
  try {
    const pending = await PendingUser.find();
    res.json(pending);
  } catch {
    res.status(500).json({ message: "Error fetching pending users" });
  }
});

router.post("/approve/:id", auth, isAdmin, async (req, res) => {
  try {
    const pending = await PendingUser.findById(req.params.id);
    if (!pending) return res.status(404).json({ message: "User not found" });

    const newUser = new User({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: pending.role,
      department: pending.department
    });

    await newUser.save();
    await PendingUser.findByIdAndDelete(req.params.id);

    await sendMail({
      to: pending.email,
      subject: "Your account has been approved",
      text: `Hello ${pending.name},\n\nYour account is approved. You may now log in.\n\n- Admin`
    });

    res.json({ message: "User approved successfully!" });
  } catch {
    res.status(500).json({ message: "Approval failed" });
  }
});

router.delete("/reject/:id", auth, isAdmin, async (req, res) => {
  try {
    const pending = await PendingUser.findById(req.params.id);
    if (!pending) return res.status(404).json({ message: "User not found" });

    await sendMail({
      to: pending.email,
      subject: "Signup Request Rejected",
      text: `Hello ${pending.name},\n\nYour signup request was rejected.\n\n- Admin`
    });

    await PendingUser.findByIdAndDelete(req.params.id);

    res.json({ message: "User rejected" });
  } catch {
    res.status(500).json({ message: "Rejection failed" });
  }
});

router.delete("/delete/:id", auth, isAdmin, async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ message: "User not found" });

    await Assignment.deleteMany({ studentId: req.params.id });

    const files = await req.app.locals.bucket
      .find({
        $or: [
          { "metadata.email": (userToDelete.email || "").toLowerCase() },
          { "metadata.username": (userToDelete.email || "").toLowerCase() }
        ]
      })
      .toArray();

    for (const f of files) {
      await req.app.locals.bucket.delete(f._id);
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User and all associated data deleted successfully!" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;


// import express from "express";
// import User from "../models/user.js";
// import PendingUser from "../models/pendinguser.js";
// import Assignment from "../models/assignment.js";
// import auth from "../middleware/auth.js";
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();

// const router = express.Router();
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// const sendMail = async ({ to, subject, text }) => {
//   try {
//     await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
//   } catch {}
// };

// router.get("/users", auth, async (req, res) => {
//   try {
//     const allUsersRaw = await User.find();
//     const allUsers = allUsersRaw.map((u) => ({ ...u._doc, role: (u.role || "").trim().toLowerCase() }));

//     res.json({
//       student: allUsers.filter((u) => u.role === "student"),
//       professor: allUsers.filter((u) => u.role === "professor"),
//       hod: allUsers.filter((u) => u.role === "hod"),
//       counts: {
//         student: allUsers.filter((u) => u.role === "student").length,
//         professor: allUsers.filter((u) => u.role === "professor").length,
//         hod: allUsers.filter((u) => u.role === "hod").length
//       }
//     });
//   } catch {
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });

// router.get("/pending", auth, async (req, res) => {
//   try {
//     const pending = await PendingUser.find();
//     res.json(pending);
//   } catch {
//     res.status(500).json({ message: "Error fetching pending users" });
//   }
// });

// router.post("/approve/:id", auth, async (req, res) => {
//   try {
//     const pending = await PendingUser.findById(req.params.id);
//     if (!pending) return res.status(404).json({ message: "User not found" });

//     const newUser = new User({
//       name: pending.name,
//       email: pending.email,
//       password: pending.password,
//       role: pending.role,
//       department: pending.department
//     });

//     await newUser.save();
//     await PendingUser.findByIdAndDelete(req.params.id);

//     await sendMail({
//       to: pending.email,
//       subject: "Your account has been approved",
//       text: `Hello ${pending.name},\n\nYour account is approved. You may now log in.\n\n- Admin`
//     });

//     res.json({ message: "User approved successfully!" });
//   } catch {
//     res.status(500).json({ message: "Approval failed" });
//   }
// });

// router.delete("/reject/:id", auth, async (req, res) => {
//   try {
//     const pending = await PendingUser.findById(req.params.id);
//     if (!pending) return res.status(404).json({ message: "User not found" });

//     await sendMail({
//       to: pending.email,
//       subject: "Signup Request Rejected",
//       text: `Hello ${pending.name},\n\nYour signup request was rejected.\n\n- Admin`
//     });

//     await PendingUser.findByIdAndDelete(req.params.id);

//     res.json({ message: "User rejected" });
//   } catch {
//     res.status(500).json({ message: "Rejection failed" });
//   }
// });

// router.delete("/delete/:id", auth, async (req, res) => {
//   try {
//     const userToDelete = await User.findById(req.params.id);
//     if (!userToDelete) return res.status(404).json({ message: "User not found" });

//     await Assignment.deleteMany({ studentId: req.params.id });

//     const files = await req.app.locals.bucket
//       .find({
//         $or: [
//           { "metadata.email": (userToDelete.email || "").toLowerCase() },
//           { "metadata.username": (userToDelete.email || "").toLowerCase() }
//         ]
//       })
//       .toArray();

//     for (const f of files) {
//       await req.app.locals.bucket.delete(f._id);
//     }

//     await User.findByIdAndDelete(req.params.id);

//     res.json({ message: "User and all associated data deleted successfully!" });
//   } catch {
//     res.status(500).json({ message: "Delete failed" });
//   }
// });

// export default router;
