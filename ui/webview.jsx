import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Header from "./Components/Header";
import ChatInput from "./Components/InputChat/ChatInput";
import ChatHistory from "./Components/ChatHistory";
import RecentChats from "./Components/RecentChats";

import { AppProvider, useAppContext } from "./context/AppContext";
import ChatMessages from "./Components/ChatMessages/ChatMessages";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    color: "var(--vscode-foreground)",
    backgroundColor: "var(--vscode-sideBar-background)",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }
};

function Chat() {
  const {
    messages,
    setMessages,
    currentMessage,
    isLoading,
    handleResponseMessage,
    handleErrorMessage,
    clearChat,
    vscode
  } = useAppContext();
  
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [isNewChat, setIsNewChat] = useState(true);
  const [projectFiles, setProjectFiles] = useState([]);

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      switch (message.type) {
        case "response":
          handleResponseMessage(message);
          break;
        case "error":
          handleErrorMessage(message);
          break;
        case "conversationCleared":
          clearChat();
          setIsNewChat(true);
          vscode.postMessage({ type: "loadHistory" });
          break;
        case "chatLoaded":
          handleChatLoaded(message);
          break;
        case "historyLoaded":
          setHistory(message.history);
          break;
        case "projectFiles":
          setProjectFiles(message.files);
          break;
        case "showHistory":
          setShowHistory(true);
          break;
        case "showFullHistory":
          setShowHistory(true);
          vscode.postMessage({ type: "loadHistory" });
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleChatLoaded = (message) => {
    if (message.messages) {
      setMessages(message.messages);
      setIsNewChat(false);
      setShowHistory(false);
    }
  };

  const handleChatSelect = (chatId) => {
    vscode.postMessage({ type: "loadChat", chatId });
  };

  // Cargar historial inicial
  useEffect(() => {
    if (messages.length === 0) {
      vscode.postMessage({ type: "loadHistory" });
    }
  }, []);

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        {showHistory ? (
          <ChatHistory
            history={history}
            onChatSelect={handleChatSelect}
            setShowHistory={setShowHistory}
          />
        ) : (
          <>
            {messages.length === 0 ? (
              <RecentChats
                history={history.slice(0, 4)}
                onChatSelect={handleChatSelect}
              />
            ) : (
              <ChatMessages
                messages={messages}
                currentMessage={currentMessage}
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </div>
      <ChatInput
        projectFiles={projectFiles}
        isNewChat={isNewChat}
      />
    </div>
  );
}

// Inicializar vscode una sola vez
const vscode = acquireVsCodeApi();

ReactDOM.render(
  <AppProvider vscode={vscode}>
    <Chat />
  </AppProvider>,
  document.getElementById("root")
);
