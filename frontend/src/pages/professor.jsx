import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const getInitialAuth = () => {
    try {
        return {
            user: JSON.parse(localStorage.getItem("user")),
            token: localStorage.getItem("token"),
        };
    } catch (e) {
        return { user: null, token: null };
    }
};

const API_BASE_URL = "http://localhost:5000/api/professor";

export default function ProfessorDashboard() {
    const [auth, setAuth] = useState(getInitialAuth());
    const [isLoading, setIsLoading] = useState(true);
    const { user, token } = auth;
    const [assignments, setAssignments] = useState([]);
    const [tab, setTab] = useState("pending");
    const [counts, setCounts] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        reviewed: 0
    });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAuth(getInitialAuth());
            setIsLoading(false);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    const showToast = useCallback((message, isError = false) => {
        setToast({ message, isError });
        setTimeout(() => setToast(null), 2000);
    }, []);

    const loadCounts = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/assignments-counts`, {
                headers: { Authorization: "Bearer " + token }
            });
            if (res.ok) {
                setCounts(await res.json());
            }
        } catch {}
    }, [token]);

    const fetchAssignments = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/assignments/${tab}`, {
                headers: { Authorization: "Bearer " + token }
            });
            if (res.ok) {
                setAssignments(await res.json());
            }
        } catch {}
    }, [tab, token]);

    const changeStatus = useCallback(
        async (id, status) => {
            if (!user || !user.id || !user.name || !token) {
                showToast("User session error.", true);
                return;
            }
            const payload = {
                reviewerId: user.id,
                reviewerName: user.name
            };
            try {
                const res = await fetch(
                    `${API_BASE_URL}/assignments/${id}/${status}`,
                    {
                        method: "PATCH",
                        headers: {
                            Authorization: "Bearer " + token,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    }
                );
                if (res.ok) {
                    fetchAssignments();
                    loadCounts();
                } else {
                    const data = await res.json().catch(() => ({}));
                    showToast(data.message || "Error updating status.", true);
                }
            } catch {
                showToast("Network error during status update.", true);
            }
        },
        [showToast, fetchAssignments, loadCounts, user, token]
    );

    const openFile = useCallback(
        async (id) => {
            if (!token) {
                showToast("Authentication token is missing.", true);
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/assignment/file/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const blob = await res.blob();
                    const fileURL = URL.createObjectURL(blob);
                    window.open(fileURL, "_blank");
                    setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
                } else {
                    const text = await res.text().catch(() => "");
                    try {
                        const json = JSON.parse(text);
                        showToast(json.message || "Failed to open file.", true);
                    } catch {
                        showToast("Failed to open file. Access denied or file not found.", true);
                    }
                }
            } catch {
                showToast("Network error or failed to process file download.", true);
            }
        },
        [showToast, token]
    );

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    useEffect(() => {
        if (!isLoading && token) {
            fetchAssignments();
        }
    }, [tab, isLoading, token, fetchAssignments]);

    useEffect(() => {
        if (!isLoading && token) {
            loadCounts();
        }
    }, [isLoading, token, loadCounts]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-xl font-semibold text-blue-600">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user || !token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <p className="text-xl font-semibold text-rose-600 mb-4">Access Denied</p>
                    <p className="text-slate-600">You must be logged in to view this dashboard.</p>
                    <button
                        onClick={logout}
                        className="mt-4 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-400 text-sm font-medium text-white shadow-md transition-colors duration-200"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.3 }}
                        className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl text-sm font-medium ${toast.isError ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="w-full bg-white/80 backdrop-blur border-b border-slate-200 py-3 px-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div>
                    <h1 className="text-base font-semibold tracking-tight text-slate-900">
                        👨‍🏫 {user?.name?.toUpperCase()}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {user?.email} • {user?.role?.toUpperCase()} • {user?.department?.toUpperCase()}
                    </p>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-400 text-xs font-medium text-white shadow-md transition-colors duration-200"
                >
                    Logout
                </button>
            </header>

            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-slate-800">Assignment Review Dashboard</h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div onClick={() => setTab("pending")} className={`p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-md ${tab === 'pending' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-50 text-slate-700 border border-blue-200'}`}>
                        <h2 className="text-2xl font-bold">{counts.pending}</h2>
                        <p className="text-sm">Pending Review</p>
                    </div>
                    <div onClick={() => setTab("approved")} className={`p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-md ${tab === 'approved' ? 'bg-green-600 text-white' : 'bg-white hover:bg-green-50 text-slate-700 border border-green-200'}`}>
                        <h2 className="text-2xl font-bold">{counts.approved}</h2>
                        <p className="text-sm">Approved</p>
                    </div>
                    <div onClick={() => setTab("rejected")} className={`p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-md ${tab === 'rejected' ? 'bg-red-600 text-white' : 'bg-white hover:bg-red-50 text-slate-700 border border-red-200'}`}>
                        <h2 className="text-2xl font-bold">{counts.rejected}</h2>
                        <p className="text-sm">Rejected</p>
                    </div>
                    <div onClick={() => setTab("reviewed")} className={`p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-md ${tab === 'reviewed' ? 'bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-slate-700 border border-gray-300'}`}>
                        <h2 className="text-2xl font-bold">{counts.reviewed}</h2>
                        <p className="text-sm">Total Reviewed</p>
                    </div>
                </div>

                <h2 className="text-xl font-semibold mb-4 text-slate-700 border-b pb-2">
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Assignments ({assignments.length})
                </h2>

                <div className="space-y-4">
                    {assignments.length === 0 ? (
                        <div className="p-6 bg-white rounded-xl shadow-inner text-center text-gray-500">
                            <p className="text-lg">🎉 No {tab} assignments found.</p>
                            {tab === 'pending' && <p className="text-sm mt-1">Time for a coffee break!</p>}
                        </div>
                    ) : (
                        assignments.map((a) => (
                            <motion.div
                                key={a._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="p-4 bg-white rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center border border-slate-200"
                            >
                                <div className="mb-3 md:mb-0">
                                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{a.title}</h3>
                                    <p className="text-sm font-medium text-blue-600 mt-1">
                                        Student: {a.studentName} ({a.studentEmail})
                                    </p>

                                    {tab !== "pending" && a.reviewerId && (
                                        <p className="text-xs mt-1 text-slate-500">
                                            {a.status.charAt(0).toUpperCase() + a.status.slice(1)} by{" "}
                                            <span className="font-semibold">
                                                {a.reviewerId === user.id ? "You" : a.reviewerName}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    <button
                                        onClick={() => openFile(a.fileUrl || a._id)}
                                        className="flex-shrink-0 px-4 py-2 bg-gray-600 text-white text-sm rounded-full hover:bg-gray-500 transition shadow-md"
                                    >
                                        📂 Open File
                                    </button>

                                    {tab === "pending" && (
                                        <>
                                            <button
                                                onClick={() => changeStatus(a._id, "approve")}
                                                className="flex-shrink-0 px-4 py-2 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition shadow-md"
                                            >
                                                ✅ Approve
                                            </button>
                                            <button
                                                onClick={() => changeStatus(a._id, "reject")}
                                                className="flex-shrink-0 px-4 py-2 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition shadow-md"
                                            >
                                                ❌ Reject
                                            </button>
                                        </>
                                    )}

                                    {tab !== "pending" && a.reviewerId === user.id && a.status === "approved" && (
                                        <button
                                            onClick={() => changeStatus(a._id, "reject")}
                                            className="flex-shrink-0 px-3 py-2 bg-yellow-600 text-white text-sm rounded-full hover:bg-yellow-700 transition shadow-md"
                                        >
                                            ⚠️ Revert to Rejected
                                        </button>
                                    )}

                                    {tab !== "pending" && a.reviewerId === user.id && a.status === "rejected" && (
                                        <button
                                            onClick={() => changeStatus(a._id, "approve")}
                                            className="flex-shrink-0 px-3 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition shadow-md"
                                        >
                                            🔄 Revert to Approved
                                        </button>
                                    )}

                                    {tab !== "pending" && a.reviewerId !== user.id && (
                                        <span className={`px-3 py-2 text-sm rounded-full font-medium shadow-inner ${a.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {a.status.charAt(0).toUpperCase() + a.status.slice(1)} (Read-Only)
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
