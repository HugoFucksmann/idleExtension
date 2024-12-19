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
    isLoadingHistory,
    setIsLoadingHistory,
    handleResponseMessage,
    handleErrorMessage,
    clearChat,
    vscode,
    handleSendMessage,
    handleLoadChat
  } = useAppContext();
  
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [isNewChat, setIsNewChat] = useState(true);
  const [projectFiles, setProjectFiles] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log("[Webview] Initializing projectFiles state");
    
    const handleProjectFiles = (event) => {
      const message = event.data;
      if (message.type === "projectFiles") {
        console.log("[Webview] Received project files:", message.files);
        setProjectFiles(message.files);
      }
    };

    window.addEventListener("message", handleProjectFiles);
    
    // Solicitar archivos del proyecto al iniciar
    console.log("[Webview] Requesting project files");
    vscode.postMessage({ type: "getProjectFiles" });

    return () => window.removeEventListener("message", handleProjectFiles);
  }, []);

  useEffect(() => {
    console.log("[Webview] Project files updated:", {
      count: projectFiles.length,
      files: projectFiles
    });
  }, [projectFiles]);

  const transformMessage = (message) => {
    if (message.role) {
      // Transformar del formato backend al formato frontend
      return {
        text: message.content,
        isUser: message.role === "user",
        attachedFiles: []  // Los archivos adjuntos se manejan por separado
      };
    }
    return message;
  };

  const handleEditMessage = (messageIndex, newText, attachedFiles) => {
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      text: newText,
      attachedFiles: attachedFiles || []
    };
    setMessages(updatedMessages);
    handleSendMessage(newText, attachedFiles || []);
  };

  // Cargar historial inicial
  useEffect(() => {
    if (!isInitialized && !isLoadingHistory) {
      setIsInitialized(true);
      setIsLoadingHistory(true);
      vscode.postMessage({ type: "loadHistory" });
    }
  }, [isInitialized, isLoadingHistory]);

  const handleChatSelect = (chatId) => {
    if (!isLoadingHistory) {
      setIsLoadingHistory(true);
      setShowHistory(false); // Cerrar el historial inmediatamente
      vscode.postMessage({
        type: "loadChat",
        chatId: chatId,
      });
    }
  };

  const handleNewChat = () => {
    if (!isLoadingHistory) {
      vscode.postMessage({ type: "clearConversation" });
    }
  };

  const handleShowHistory = () => {
    if (!isLoadingHistory) {
      setShowHistory(true);
      setIsLoadingHistory(true);
      vscode.postMessage({ type: "loadHistory" });
    }
  };

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
          if (!isLoadingHistory) {
            setIsLoadingHistory(true);
            vscode.postMessage({ type: "loadHistory" });
          }
          break;
        case "chatLoaded":
          if (message.messages && Array.isArray(message.messages)) {
            const transformedMessages = message.messages.map(transformMessage);
            setMessages(transformedMessages);
            setIsLoadingHistory(false);
            setIsNewChat(false);
          } else {
            console.error("Invalid messages format:", message);
            setIsLoadingHistory(false);
          }
          break;
        case "historyLoaded":
          if (message.history && Array.isArray(message.history)) {
            setHistory(message.history);
          } else {
            setHistory([]);
          }
          setIsLoadingHistory(false);
          break;
        case "showHistory":
          setShowHistory(true);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleResponseMessage, handleErrorMessage, clearChat, vscode, isLoadingHistory]);

  return (
    <div style={styles.container}>
      <Header
        onNewChat={handleNewChat}
        onShowHistory={handleShowHistory}
        isNewChat={isNewChat}
      />
      {showHistory ? (
        <ChatHistory
          history={history}
          onChatSelect={handleChatSelect}
          setShowHistory={setShowHistory}
        />
      ) : (
        <div style={styles.content}>
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            currentMessage={currentMessage}
            onEditMessage={handleEditMessage}
          >
            {messages.length === 0 && !isLoading && history.length > 0 && (
              <RecentChats history={history} onChatSelect={handleChatSelect} />
            )}
          </ChatMessages>
          <ChatInput
            onSendMessage={handleSendMessage}
            projectFiles={projectFiles}
          />
        </div>
      )}
    </div>
  );
}

// Inicializar vscode una sola vez
const vscode = acquireVsCodeApi();

// Renderizar la aplicación
const root = document.getElementById("root");
ReactDOM.render(
  <AppProvider vscode={vscode}>
    <Chat />
  </AppProvider>,
  root
);
