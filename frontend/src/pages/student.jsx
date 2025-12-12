import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function StudentAssignment() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [showPrev, setShowPrev] = useState(false);
  const [title, setTitle] = useState("");
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const email = user?.email || "";

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
    } else {
      showToast("Only PDF files allowed!", true);
    }
  };

  const handleSubmit = async () => {
    if (!file || title.trim() === "") {
      showToast("Title and PDF are required.", true);
      return;
    }

    const formData = new FormData();
    formData.append("assignment", file);
    formData.append("email", email.toLowerCase());
    formData.append("title", title);

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/student/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Assignment uploaded successfully!");
        setFile(null);
        setTitle("");
        loadAssignments();
      } else {
        showToast(data.message || "Upload failed", true);
      }
    } catch {
      showToast("Upload error", true);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = () => {
    fetch(`http://localhost:5000/api/student/all/${email.toLowerCase()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAssignments(data);
        } else {
          setAssignments([]);
        }
      })
      .catch(() => showToast("Error loading assignments.", true));
  };

  useEffect(() => {
    if (user && email) {
      loadAssignments();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-900">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl text-sm font-medium ${
              toast.isError ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full bg-white/80 backdrop-blur border-b border-slate-200 py-3 px-6 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-slate-900">
            👨‍🎓 {user?.name?.toUpperCase()}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.email} • Assignment Portal
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-400 text-xs font-medium text-white shadow-sm"
        >
          Logout
        </button>
      </header>

      <main className="flex flex-col items-center justify-start p-6 gap-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: showPrev ? 0.95 : 1,
            transition: { duration: 0.3 },
          }}
          className="w-full max-w-xl bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold mb-1 text-slate-900">
            Upload Assignment
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            Submit your assignment PDF with a clear title for review.
          </p>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title (e.g., DBMS Project Report)"
            className="w-full mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400"
          />

          <label className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
            <span className="text-5xl text-indigo-300 mb-2">⬆</span>
            <span className="text-sm text-slate-500">Click to select a PDF file</span>
            <span className="text-xs text-slate-400 mt-1">
              Max size depends on server settings
            </span>
            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
          </label>

          {file && (
            <div className="mt-3 text-sm text-indigo-600 flex items-center gap-2">
              <span className="text-base">📄</span>
              <span className="truncate">{file.name}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="mt-6 w-full py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm text-white disabled:bg-slate-300"
          >
            {loading ? "Submitting..." : "Submit Assignment"}
          </button>

          <button
            onClick={() => setShowPrev(!showPrev)}
            className="mt-3 w-full py-2 rounded-full text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50"
          >
            {showPrev ? "Hide previous submissions" : "View previous submissions"}
          </button>
        </motion.div>

        <AnimatePresence>
          {showPrev && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-xl bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-5 shadow-sm overflow-hidden"
            >
              <h3 className="text-lg font-semibold mb-3 text-slate-900">Your submissions</h3>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {assignments.length === 0 ? (
                  <p className="text-slate-500 text-sm">No assignments uploaded yet.</p>
                ) : (
                  assignments.map((file) => (
                    <div
                      key={file._id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-indigo-600">
                          {file.title || "Untitled assignment"}
                        </span>

                        <span
                          className={`text-xs font-semibold mt-1 px-2 py-1 rounded-full w-fit ${
                            file.status === "approved"
                              ? "bg-green-100 text-green-600"
                              : file.status === "rejected"
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {file.status.toUpperCase()}
                        </span>

                        <span className="text-xs text-slate-500 mt-1">📄 {file.filename}</span>
                      </div>

                      <a
                        href={`http://localhost:5000/api/student/file/${file._id}`}
                        className="text-xs px-3 py-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
