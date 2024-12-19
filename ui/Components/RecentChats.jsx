import React from "react";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    flex: 1,
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
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
  },
  timestamp: {
    fontSize: "11px",
    color: "var(--vscode-descriptionForeground)",
  },
};

const RecentChats = ({ history, onChatSelect }) => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Obtener los 4 chats más recientes
  const recentChats = [...history]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 4);

  if (recentChats.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recent Chats</h2>
      <div style={styles.chatGrid}>
        {recentChats.map((chat) => (
          <div
            key={chat.id}
            style={styles.chatItem}
            onClick={() => onChatSelect(chat.id)}
            role="button"
            tabIndex={0}
          >
            <div style={styles.timestamp}>
              {formatTimestamp(chat.timestamp)}
            </div>
            <div style={styles.summary}>
              {chat.summary || (chat.messages[0]?.content?.slice(0, 100) + "...") || "Empty chat"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentChats;
