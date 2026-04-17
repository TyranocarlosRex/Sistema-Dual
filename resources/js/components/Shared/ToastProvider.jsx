import React, { createContext, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const VARIANT_STYLES = {
  success: {
    accent: "#15803d",
    background: "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "#86efac",
    title: "#14532d",
    text: "#166534",
  },
  error: {
    accent: "#b91c1c",
    background: "linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)",
    border: "#fca5a5",
    title: "#7f1d1d",
    text: "#991b1b",
  },
  warning: {
    accent: "#b45309",
    background: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)",
    border: "#fcd34d",
    title: "#78350f",
    text: "#92400e",
  },
  info: {
    accent: "#1d4ed8",
    background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)",
    border: "#93c5fd",
    title: "#1e3a8a",
    text: "#1d4ed8",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showToast = ({
    title = "Notificacion",
    message = "",
    variant = "info",
    duration = 3200,
  }) => {
    const id = nextId.current++;

    setToasts((prev) => [
      ...prev,
      {
        id,
        title,
        message,
        variant: VARIANT_STYLES[variant] ? variant : "info",
      },
    ]);

    window.setTimeout(() => removeToast(id), duration);
  };

  const value = useMemo(
    () => ({
      showToast,
      removeToast,
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        style={{
          position: "fixed",
          top: "18px",
          right: "18px",
          zIndex: 2000,
          display: "grid",
          gap: "12px",
          width: "min(360px, calc(100vw - 24px))",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          const palette = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info;

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: "auto",
                borderRadius: "18px",
                border: `1px solid ${palette.border}`,
                background: palette.background,
                boxShadow: "0 18px 45px -28px rgba(15, 23, 42, 0.45)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "4px 1fr auto",
                  alignItems: "start",
                }}
              >
                <div style={{ background: palette.accent, minHeight: "100%" }} />
                <div style={{ padding: "14px 14px 12px 14px" }}>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: palette.title,
                      lineHeight: 1.2,
                      marginBottom: toast.message ? "4px" : 0,
                    }}
                  >
                    {toast.title}
                  </div>
                  {toast.message && (
                    <div
                      style={{
                        fontSize: "0.92rem",
                        color: palette.text,
                        lineHeight: 1.35,
                      }}
                    >
                      {toast.message}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Cerrar notificacion"
                  style={{
                    border: 0,
                    background: "transparent",
                    color: palette.text,
                    fontSize: "1.1rem",
                    lineHeight: 1,
                    padding: "12px 12px 0 0",
                    cursor: "pointer",
                  }}
                >
                  x
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider.");
  }

  return context;
}
