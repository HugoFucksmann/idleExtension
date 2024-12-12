import React from "react";

const styles = {
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px",
    borderTop: "1px solid var(--vscode-sideBar-border)",
  },
  leftControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  button: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    color: "var(--vscode-foreground)",
    fontSize: "12px",
  },
  modelSelector: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  modeToggle: {
    display: "flex",
    background: "var(--vscode-toolbar-hoverBackground)",
    borderRadius: "4px",
    padding: "2px",
  },
  modeButton: {
    padding: "2px 8px",
    fontSize: "12px",
    borderRadius: "2px",
    border: "none",
    cursor: "pointer",
  },
  activeMode: {
    background: "var(--vscode-button-background)",
    color: "var(--vscode-button-foreground)",
  },
};

export function ChatControls({
  onImageUpload,
  onModelChange,
  mode,
  onModeChange,
}) {
  return (
    <div style={styles.controls}>
      <div style={styles.leftControls}>
        <button
          onClick={onImageUpload}
          style={styles.button}
          title="Upload Image"
        >
          📷
        </button>
        <button
          style={{ ...styles.button, ...styles.modelSelector }}
          onClick={() => onModelChange("default")}
        >
          Cascade Base ▼
        </button>
      </div>
      <div style={styles.modeToggle}>
        <button
          style={{
            ...styles.modeButton,
            ...(mode === "write" ? styles.activeMode : {}),
          }}
          onClick={() => onModeChange("write")}
        >
          Write
        </button>
        <button
          style={{
            ...styles.modeButton,
            ...(mode === "chat" ? styles.activeMode : {}),
          }}
          onClick={() => onModeChange("chat")}
        >
          Chat
        </button>
      </div>
    </div>
  );
}
