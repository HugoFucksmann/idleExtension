import React from "react";

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px",
    borderBottom: "1px solid var(--vscode-sideBar-border)",
  },
  title: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "var(--vscode-foreground)",
  },
  buttonContainer: {
    display: "flex",
    gap: "8px",
  },
  button: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    color: "var(--vscode-foreground)",
  },
};

export function Header({ onNewChat, onClose }) {
  return (
    <div style={styles.header}>
      <span style={styles.title}>Chat mode</span>
      <div style={styles.buttonContainer}>
        <button onClick={onNewChat} style={styles.button} title="New Chat">
          +
        </button>
        <button onClick={onClose} style={styles.button} title="Close Panel">
          ×
        </button>
      </div>
    </div>
  );
}
