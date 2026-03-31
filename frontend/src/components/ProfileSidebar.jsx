import React, { useState, useEffect } from "react";

export default function ProfileSidebar({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Load user data when sidebar opens
  useEffect(() => {
    if (isOpen) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
          setUser(storedUser);
          setName(storedUser.name || "");
        }
      } catch (e) {
        console.error("Error reading user data", e);
      }
    } else {
      setCurrentPassword(""); // Reset current password field when closing
      setPassword(""); // Reset new password field when closing
    }
  }, [isOpen]);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast("Name cannot be empty.", true);
      return;
    }

    if (password.trim() && !currentPassword.trim()) {
      showToast("Current password is required to change password.", true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name, currentPassword, password }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Profile updated successfully!");
        setCurrentPassword("");
        setPassword("");
        
        // Update local storage securely
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        
        // Refresh page to ensure navbar and all user references reflect new data
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } else {
        showToast(data.message || "Failed to update profile.", true);
      }
    } catch {
      showToast("Network error while updating profile.", true);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[60] px-5 py-3 rounded-lg shadow-lg text-sm font-medium backdrop-blur-sm ${
            toast.isError
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}
          style={{ animation: 'slideInRight 0.3s ease-out forwards' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{toast.isError ? "✕" : "✓"}</span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Overlay Background */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div 
        className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 overflow-y-auto flex flex-col"
        style={{ animation: 'slideInRight 0.3s ease-out forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Profile Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          {user && (
            <div className="space-y-6">
              
              {/* User Identity Badges */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg capitalize">
                    {user.role}
                  </span>
                </div>
                {user.department && user.role !== 'admin' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</span>
                    <span className="text-sm font-medium text-slate-800 text-right">
                      {user.department.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium text-slate-600 truncate max-w-[200px]" title={user.email}>
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
                    placeholder="Enter current password to make changes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
                    placeholder="Leave blank to keep unchanged"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Type a new password here if you wish to change your current one.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all flex justify-center items-center disabled:bg-slate-400"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
