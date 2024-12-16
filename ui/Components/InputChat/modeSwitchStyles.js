export const styles = {
  modeSwitch: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px",
    //backgroundColor: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },
  modeButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "3px 6px",
    borderRadius: "6px",
    border: "none",
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  activeMode: {
    backgroundColor: "white",
    color: "#111827",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  inactiveMode: {
    backgroundColor: "transparent",
    color: "#6b7280",
  },
};
