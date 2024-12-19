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

function Header({ onNewChat, onShowHistory, isNewChat }) {
  const { vscode } = useAppContext();

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    }
  };

  const handleClose = () => {
    vscode.postMessage({ type: "closePanel" });
  };

  const handleHistory = () => {
    if (onShowHistory) {
      onShowHistory();
    }
  };

  return (
    <div style={styles.header}>
      <div style={styles.buttonsContainer}>
        <button
          style={styles.button}
          onClick={handleHistory}
          title="Ver historial"
        >
          <HistoryIcon />
        </button>
        <button
          style={styles.button}
          onClick={handleNewChat}
          title="Nuevo chat"
        >
          <NewChatIcon />
        </button>
      </div>
      <button
        style={{ ...styles.button, ...styles.closeButton }}
        onClick={handleClose}
        title="Cerrar"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export default Header;
