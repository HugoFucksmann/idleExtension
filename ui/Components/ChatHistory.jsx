import React, { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

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
  item: {
    padding: "10px",
    margin: "5px 0",
    borderRadius: "4px",
    cursor: "pointer",
    border: "1px solid var(--vscode-input-border)",
    backgroundColor: "var(--vscode-editor-background)",
    transition: "background-color 0.2s",
    userSelect: "none",
    '&:hover': {
      backgroundColor: "var(--vscode-list-hoverBackground)",
    }
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
    '&:hover': {
      backgroundColor: "var(--vscode-button-hoverBackground)",
    }
  },
  summary: {
    fontSize: "14px",
    color: "var(--vscode-foreground)",
    marginBottom: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  noHistory: {
    textAlign: "center",
    padding: "20px",
    color: "var(--vscode-descriptionForeground)",
  }
};

const ChatHistory = () => {
  const { 
    history, 
    handleLoadChat, 
    showHistory, 
    setShowHistory,
    isLoadingHistory 
  } = useAppContext();

  if (!showHistory) return null;

  const handleClose = useCallback(() => {
    setShowHistory(false);
  }, [setShowHistory]);

  const formatDate = useCallback((timestamp) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  const handleChatClick = useCallback((chatId) => {
    handleLoadChat(chatId);
  }, [handleLoadChat]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Historial de Chats</h2>
        <button 
          style={styles.button} 
          onClick={handleClose}
          disabled={isLoadingHistory}
        >
          Cerrar
        </button>
      </div>
      <div style={styles.list}>
        {isLoadingHistory ? (
          <div style={styles.noHistory}>
            Cargando historial...
          </div>
        ) : history.length > 0 ? (
          history.map((chat) => (
            <div
              key={chat.id}
              style={styles.item}
              onClick={() => handleChatClick(chat.id)}
            >
              <div style={styles.summary}>
                {chat.summary || 
                 (chat.messages[0]?.content?.slice(0, 100) + "...") || 
                 "Chat sin título"}
              </div>
              <div style={styles.timestamp}>
                {formatDate(chat.timestamp)}
              </div>
            </div>
          ))
        ) : (
          <div style={styles.noHistory}>
            No hay chats en el historial
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
