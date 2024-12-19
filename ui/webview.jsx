import React from "react";
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
    isLoading,
    currentMessage,
    handleSendMessage,
    clearChat,
    handleShowHistory,
    handleChatSelect,
    showHistory,
    setShowHistory,
    history,
    isNewChat,
    setMessages
  } = useAppContext();

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

  return (
    <div style={styles.container}>
      <Header
        onNewChat={clearChat}
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
          <ChatInput />
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
