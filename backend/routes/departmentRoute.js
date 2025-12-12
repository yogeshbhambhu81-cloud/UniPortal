import express from "express";
import Department from "../models/department.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const createSlug = (name) => {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]+/g, "");
};

router.get("/", async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch {
    res.status(500).json({ message: "Error fetching departments" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const slug = createSlug(name);

    const existingDept = await Department.findOne({ $or: [{ name }, { slug }] });
    if (existingDept) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const newDepartment = new Department({ name, slug });
    await newDepartment.save();
    res.status(201).json({ message: "Department added successfully", department: newDepartment });
  } catch (error) {
    res.status(500).json({ message: "Failed to add department" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedDepartment = await Department.findByIdAndDelete(req.params.id);

    if (!deletedDepartment) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.json({ message: "Department deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete department" });
  }
});

export default router;