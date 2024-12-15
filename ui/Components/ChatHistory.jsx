import React, { useEffect, useState } from "react";

const styles = {
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "var(--vscode-sideBar-background)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "10px",
    borderBottom: "1px solid var(--vscode-sideBar-border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
  },
  chatItem: {
    padding: "10px",
    margin: "5px 0",
    borderRadius: "4px",
    cursor: "pointer",
    border: "1px solid var(--vscode-input-border)",
    backgroundColor: "var(--vscode-editor-background)",
    "&:hover": {
      backgroundColor: "var(--vscode-list-hoverBackground)",
    },
  },
  timestamp: {
    fontSize: "12px",
    color: "var(--vscode-descriptionForeground)",
    marginTop: "4px",
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
};

function ChatHistory({ vscode, onClose, history, setShowHistory }) {
  const handleClose = () => {
    setShowHistory(false);
    if (onClose) onClose();
  };

  const handleChatSelect = (chatId) => {
    vscode.postMessage({ type: "loadChat", chatId });
    setShowHistory(false);
    if (onClose) onClose();
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>Historial de Chats</h3>
        <button style={styles.button} onClick={handleClose}>
          Cerrar
        </button>
      </div>
      <div style={styles.list}>
        {history.map((chat) => (
          <div
            key={chat.id}
            style={styles.chatItem}
            onClick={() => handleChatSelect(chat.id)}
          >
            <div>{chat.summary}</div>
            <div style={styles.timestamp}>{formatDate(chat.timestamp)}</div>
          </div>
        ))}
        {history.length === 0 && (
          <div style={{ padding: "10px", textAlign: "center" }}>
            No hay chats guardados
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatHistory;
