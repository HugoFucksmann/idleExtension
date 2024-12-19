import React from "react";
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

const Header = () => {
  const { 
    clearChat, 
    handleShowHistory, 
    isNewChat 
  } = useAppContext();

  return (
    <header style={styles.header}>
      <button 
        onClick={clearChat}
        style={styles.button}
        disabled={isNewChat}
      >
        New Chat
      </button>
      <button 
        onClick={handleShowHistory}
        style={styles.button}
      >
        History
      </button>
    </header>
  );
};

export default Header;
