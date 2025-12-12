import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeftOnRectangleIcon, AcademicCapIcon } from "@heroicons/react/24/outline";

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState({ student: [], professor: [], hod: [], counts: {} });
  const [pending, setPending] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleManageDepartments = () => {
    navigate("/admin/departments");
  };

  const fetchApprovedUsers = async () => {
    const res = await fetch("http://localhost:5000/api/admin/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await res.json();
    setUsers(data);
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/department");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch {}
  };

  const fetchPending = async () => {
    const res = await fetch("http://localhost:5000/api/admin/pending", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await res.json();
    setPending(data);
  };

  const approveUser = async (id) => {
    const res = await fetch(`http://localhost:5000/api/admin/approve/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) showToast("User approved successfully!");
    else showToast("Error approving user.", true);
    fetchPending();
    fetchApprovedUsers();
  };

  const rejectUser = async (id) => {
    const res = await fetch(`http://localhost:5000/api/admin/reject/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) showToast("User request rejected.");
    else showToast("Error rejecting user.", true);
    fetchPending();
  };

  const deleteUser = async (id) => {
    setConfirmDelete(null);
    const res = await fetch(`http://localhost:5000/api/admin/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) showToast("User deleted successfully.");
    else showToast("Error deleting user.", true);
    fetchApprovedUsers();
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchApprovedUsers();
      await fetchPending();
      await fetchDepartments();
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(selectedRole === role ? null : role);
    setSelectedDepartment("all");
  };

  const filteredUsers = selectedRole
    ? users[selectedRole].filter((user) =>
        selectedDepartment === "all" ? true : user.department === selectedDepartment
      )
    : [];

  const roleColors = {
    professor: "from-indigo-100 to-sky-100 border-indigo-200",
    student: "from-emerald-100 to-teal-100 border-emerald-200",
    hod: "from-amber-100 to-orange-100 border-amber-200",
  };

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
              toast.isError ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              University Admin Panel
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Assignment system overview & user management
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={handleManageDepartments}
              className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-400 shadow-sm"
            >
              <AcademicCapIcon className="h-5 w-5 text-white" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-rose-500 hover:bg-rose-400 shadow-sm"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        >
          {["professor", "student", "hod"].map((role) => (
            <motion.div
              key={role}
              whileHover={{ y: -4 }}
              className={`p-5 rounded-2xl border bg-gradient-to-r ${roleColors[role]} shadow-sm cursor-pointer transition`}
              onClick={() => handleRoleSelect(role)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold capitalize">{role}</h3>
                  <p className="text-xs text-slate-600">
                    {role === "student"
                      ? "Enrolled learners"
                      : role === "professor"
                      ? "Course evaluators"
                      : "Department heads"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{users.counts?.[role] ?? 0}</div>
                  <div className="text-xs text-slate-500">Total</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedRole ? `${selectedRole.toUpperCase()} Details` : "All Users Overview"}
              </h2>
              {selectedRole && (
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm text-slate-600">Filter by Department:</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="p-1.5 rounded-md border border-slate-300 text-sm bg-slate-50"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.slug} value={dept.slug}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedRole && (
              <button
                onClick={() => setSelectedRole(null)}
                className="text-xs px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-50"
              >
                Clear Role Filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : selectedRole ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-300">
                  <th className="py-3">Name</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Department</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition">
                    <td className="py-3">{u.name}</td>
                    <td className="py-3">{u.email}</td>
                    <td className="py-3">
                      {departments.find((d) => d.slug === u.department)?.name ||
                        u.department ||
                        "N/A"}
                    </td>
                    <td className="py-3 flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(u)}
                        className="px-3 py-1 bg-rose-500 text-white rounded-md text-xs hover:bg-rose-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-3">Pending User Requests</h3>

            {pending.length === 0 ? (
              <p className="text-slate-500 text-sm py-6">No pending signup requests.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="py-3">Name</th>
                    <th className="py-3">Email</th>
                    <th className="py-3">Role</th>
                    <th className="py-3">Department</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 transition">
                      <td className="py-3">{u.name}</td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3 capitalize">{u.role}</td>
                      <td className="py-3 capitalize">
                        {departments.find((d) => d.slug === u.department)?.name ||
                          u.department ||
                          "N/A"}
                      </td>
                      <td className="py-3 flex gap-2">
                        <button
                          onClick={() => approveUser(u._id)}
                          className="px-3 py-1 bg-emerald-500 text-white rounded-md text-xs hover:bg-emerald-400"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectUser(u._id)}
                          className="px-3 py-1 bg-rose-500 text-white rounded-md text-xs hover:bg-rose-400"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-xl p-6 w-[350px]"
            >
              <h3 className="text-lg font-semibold mb-2 text-rose-600">Confirm Deletion</h3>
              <p className="text-sm text-slate-700">
                Are you sure you want to delete {confirmDelete.name} ({confirmDelete.role})?
              </p>
              <p className="text-xs text-rose-500 mt-2">
                This will delete the user and all associated assignments & files.
              </p>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(confirmDelete._id)}
                  className="px-4 py-2 rounded-md bg-rose-600 text-white text-sm"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
