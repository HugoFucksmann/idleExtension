import React from "react";

const styles = {
  messagesContainer: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "16px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
  },
  emptyStateTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  emptyStateText: {
    fontSize: "14px",
    color: "var(--vscode-descriptionForeground)",
  },
  message: {
    marginBottom: "16px",
    padding: "8px",
    borderRadius: "4px",
  },
  userMessage: {
    backgroundColor: "var(--vscode-button-background)",
    color: "var(--vscode-button-foreground)",
  },
  aiMessage: {
    backgroundColor: "var(--vscode-editor-background)",
    border: "1px solid var(--vscode-input-border)",
  },
};

export function ChatMessages({ messages }) {
  if (messages.length === 0) {
    return (
      <div style={styles.emptyState}>
        <h2 style={styles.emptyStateTitle}>Chat with Cascade</h2>
        <p style={styles.emptyStateText}>
          Ask questions or request suggestions for your codebase or coding in
          general
        </p>
      </div>
    );
  }

  return (
    <div style={styles.messagesContainer}>
      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            ...styles.message,
            ...(message.isUser ? styles.userMessage : styles.aiMessage),
          }}
        >
          {message.content}
        </div>
      ))}
    </div>
  );
}
