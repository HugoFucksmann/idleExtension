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
    vscode,
    handleSendMessage
  } = useAppContext();
  
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [isNewChat, setIsNewChat] = useState(true);
  const [projectFiles, setProjectFiles] = useState([]);

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
          setMessages(message.messages.map(transformMessage));
          setShowHistory(false);
          break;
        case "historyLoaded":
          setHistory(message.history);
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
  }, [handleResponseMessage, handleErrorMessage, clearChat, vscode]);

  const handleChatSelect = (chatId) => {
    vscode.postMessage({
      type: "loadChat",
      chatId: chatId,
    });
  };

  // Cargar historial inicial
  useEffect(() => {
    if (messages.length === 0) {
      vscode.postMessage({ type: "loadHistory" });
    }
  }, [messages.length, vscode]);

  return (
    <div style={styles.container}>
      <Header setShowHistory={setShowHistory} />
      <div style={styles.content}>
        {showHistory ? (
          <ChatHistory
            history={history}
            onChatSelect={handleChatSelect}
            setShowHistory={setShowHistory}
          />
        ) : (
          <ChatMessages
            messages={messages}
            currentMessage={currentMessage}
            isLoading={isLoading}
            onEditMessage={handleEditMessage}
          >
            {messages.length === 0 && (
              <RecentChats
                history={history.slice(0, 4)}
                onChatSelect={handleChatSelect}
              />
            )}
          </ChatMessages>
        )}
        <ChatInput
          projectFiles={projectFiles}
          isNewChat={isNewChat}
        />
      </div>
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
