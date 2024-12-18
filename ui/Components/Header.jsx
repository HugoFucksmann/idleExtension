import React from "react";
import { HistoryIcon, NewChatIcon, CloseIcon } from "./InputChat/Icons";
import { useAppContext } from "../context/AppContext";

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

function Header({ setShowHistory }) {
  const { vscode } = useAppContext();

  const handleNewChat = () => {
    vscode.postMessage({ type: "clearConversation" });
  };

  const handleClose = () => {
    vscode.postMessage({ type: "closePanel" });
  };

  const handleHistory = () => {
    setShowHistory(true);
    vscode.postMessage({ type: "loadHistory" });
  };

  return (
    <div style={styles.header}>
      <span>AI Chat (qwen2.5-coder:7b)</span>
      <div style={styles.buttonsContainer}>
        <button
          onClick={handleHistory}
          style={styles.button}
          title="Ver historial completo"
        >
          <HistoryIcon />
        </button>
        <button
          onClick={handleNewChat}
          style={styles.button}
          title="Nuevo chat"
        >
          <NewChatIcon />
        </button>
        <button
          onClick={handleClose}
          style={{...styles.button, ...styles.closeButton}}
          title="Cerrar panel"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

export default Header;
