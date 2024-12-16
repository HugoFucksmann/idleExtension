import React from "react";
import { HistoryIcon, NewChatIcon, CloseIcon } from "./InputChat/Icons";

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
    backgroundColor: "var(--vscode-button-secondaryBackground)",
    color: "var(--vscode-button-foreground)",
    border: "none",
    padding: "6px",
    borderRadius: "3px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    backgroundColor: "var(--vscode-errorForeground)",
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
          style={{ ...styles.button }}
          onClick={handleHistory}
          title="Historial"
        >
          <HistoryIcon />
        </button>
        <button
          style={styles.button}
          onClick={handleNewChat}
          title="Nuevo Chat"
        >
          <NewChatIcon />
        </button>
        <button
          style={{ ...styles.button, ...styles.closeButton }}
          onClick={handleClose}
          title="Cerrar"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

export default Header;
