import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function DepartmentManagement() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2000);
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/department", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        showToast("Failed to load departments.", true);
      }
    } catch (error) {
      showToast("Network error fetching departments.", true);
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("http://localhost:5000/api/department", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newDepartmentName }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Department added successfully!");
        setNewDepartmentName("");
        fetchDepartments();
      } else {
        showToast(data.message || "Failed to add department.", true);
      }
    } catch {
      showToast("Network error while adding department.", true);
    } finally {
      setAdding(false);
    }
  };

  const deleteDepartment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/department/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Department deleted successfully.");
        fetchDepartments();
      } else {
        showToast(data.message || "Failed to delete department.", true);
      }
    } catch {
      showToast("Network error while deleting department.", true);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-900 p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl text-sm font-medium transition-colors ${
              toast.isError
                ? "bg-rose-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 shadow-sm transition"
            >
              <ArrowLeftIcon className="h-5 w-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Manage Departments
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Add and remove university departments.
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">Add New Department</h2>
          <form onSubmit={addDepartment} className="flex gap-4">
            <input
              type="text"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="e.g., Electrical Engineering"
              required
              className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300"
            />
            <button
              type="submit"
              disabled={adding}
              className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white shadow-md flex items-center gap-2 disabled:bg-slate-300"
            >
              <PlusIcon className="h-5 w-5" />
              {adding ? "Adding..." : "Add Department"}
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">Existing Departments ({departments.length})</h2>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : departments.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No departments have been added yet.</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {departments.map((dept) => (
                  <motion.div
                    key={dept._id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50 rounded-lg shadow-sm"
                  >
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{dept.name}</span>
                        <span className="text-xs text-slate-500">Slug: {dept.slug}</span>
                    </div>
                    <button
                      onClick={() => deleteDepartment(dept._id)}
                      className="p-2 rounded-full text-rose-500 hover:bg-rose-100 transition"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}