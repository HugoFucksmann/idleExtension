import React from "react";

const styles = {
  header: {
    padding: "10px",
    borderBottom: "1px solid var(--vscode-sideBar-border)",
    fontSize: "14px",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonsContainer: {
    display: "flex",
    gap: "8px",
  },
  button: {
    backgroundColor: "var(--vscode-button-background)",
    color: "var(--vscode-button-foreground)",
    border: "none",
    padding: "4px 8px",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  closeButton: {
    backgroundColor: "var(--vscode-errorForeground)",
  },
  historyButton: {
    backgroundColor: "var(--vscode-button-secondaryBackground)",
  },
};

function Header({ vscode }) {
  const handleNewChat = () => {
    vscode.postMessage({ type: "clearConversation" });
  };

  const handleClose = () => {
    vscode.postMessage({ type: "closePanel" });
  };

  const handleHistory = () => {
    vscode.postMessage({ type: "showHistory" });
  };

  return (
    <div style={styles.header}>
      <span>AI Chat (qwen2.5-coder:7b)</span>
      <div style={styles.buttonsContainer}>
        <button
          style={{ ...styles.button, ...styles.historyButton }}
          onClick={handleHistory}
        >
          Historial
        </button>
        <button style={styles.button} onClick={handleNewChat}>
          Nuevo Chat
        </button>
        <button
          style={{ ...styles.button, ...styles.closeButton }}
          onClick={handleClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default Header;
