import React from "react";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: "20px",
    overflow: "auto",
  },
  title: {
    marginBottom: "20px",
    color: "var(--vscode-foreground)",
    opacity: 0.8,
  },
  chatGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
    maxWidth: "600px",
    width: "100%",
  },
  chatItem: {
    padding: "15px",
    borderRadius: "4px",
    cursor: "pointer",
    border: "1px solid var(--vscode-input-border)",
    backgroundColor: "var(--vscode-editor-background)",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "var(--vscode-list-hoverBackground)",
    },
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  summary: {
    fontSize: "13px",
    lineHeight: "1.4",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-line-clamp": "2",
    "-webkit-box-orient": "vertical",
  },
  timestamp: {
    fontSize: "11px",
    color: "var(--vscode-descriptionForeground)",
  },
};

function RecentChats({ history, vscode }) {
  const recentChats = history.slice(-4).reverse();

  const handleChatSelect = (chatId) => {
    vscode.postMessage({ type: "loadChat", chatId });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Chats Recientes</h2>
      <div style={styles.chatGrid}>
        {recentChats.map((chat) => (
          <div
            key={chat.id}
            style={styles.chatItem}
            onClick={() => handleChatSelect(chat.id)}
          >
            <div style={styles.summary}>{chat.summary}</div>
            <div style={styles.timestamp}>{formatDate(chat.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentChats;
