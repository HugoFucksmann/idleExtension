import React from "react";
import { useAppContext } from '../context/AppContext';

const styles = {
  container: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  title: {
    fontSize: "1.5em",
    marginBottom: "15px",
    color: "var(--vscode-foreground)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  chatItem: {
    padding: "15px",
    borderRadius: "5px",
    backgroundColor: "var(--vscode-button-background)",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
  },
  chatTitle: {
    fontWeight: "bold",
    color: "var(--vscode-button-foreground)",
  },
  timestamp: {
    fontSize: "0.8em",
    color: "var(--vscode-descriptionForeground)",
  },
  preview: {
    fontSize: "0.9em",
    color: "var(--vscode-descriptionForeground)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

const RecentChats = () => {
  const { history, handleLoadChat } = useAppContext();

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!history || history.length === 0) {
    return null;
  }

  const recentChats = history
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 4);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recent Chats</h2>
      <div style={styles.list}>
        {recentChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleLoadChat(chat.id)}
            style={styles.chatItem}
          >
            <div style={styles.chatHeader}>
              <span style={styles.chatTitle}>{chat.title}</span>
              <span style={styles.timestamp}>
                {formatTimestamp(chat.timestamp)}
              </span>
            </div>
            {chat.preview && (
              <div style={styles.preview}>{chat.preview}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentChats;
