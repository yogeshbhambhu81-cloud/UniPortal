import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "white",
            padding: "10px 15px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            borderLeft: `4px solid ${
              toast.type === "error" ? "#dc2626" : "#16a34a"
            }`,
            zIndex: 9999,
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
