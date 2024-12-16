import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Header from "./Components/Header";
import ChatMessages from "./Components/ChatMessages";
import ChatInput from "./Components/InputChat/ChatInput";
import ChatHistory from "./Components/ChatHistory";
import RecentChats from "./Components/RecentChats";

const vscode = acquireVsCodeApi();

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    color: "var(--vscode-foreground)",
    backgroundColor: "var(--vscode-sideBar-background)",
  },
};

function Chat() {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [isNewChat, setIsNewChat] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [inputMode, setInputMode] = useState("write");

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
          handleConversationCleared();
          break;
        case "chatLoaded":
          handleChatLoaded(message);
          break;
        case "historyLoaded":
          setHistory(message.history);
          break;
        case "showFullHistory":
          setShowHistory(true);
          break;
        case "projectFiles":
          setProjectFiles(message.files);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    vscode.postMessage({ type: "getProjectFiles" });
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleResponseMessage = (message) => {
    if (!message.done) {
      setCurrentMessage((prev) => prev + message.message);
    } else {
      setCurrentMessage((prev) => {
        const finalMessage = prev + message.message;
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: finalMessage, isUser: false },
        ]);
        return "";
      });
      setIsLoading(false);
      setIsNewChat(false);
    }
  };

  const handleErrorMessage = (message) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: message.message, isUser: false, isError: true },
    ]);
    setIsLoading(false);
    setCurrentMessage("");
  };

  const handleConversationCleared = () => {
    setMessages([]);
    setCurrentMessage("");
    setIsLoading(false);
    setIsNewChat(true);
    vscode.postMessage({ type: "loadHistory" });
  };

  const handleChatLoaded = (message) => {
    setMessages(
      message.messages.map((msg) => ({
        text: msg.content,
        isUser: msg.role === "user",
      }))
    );
    setIsNewChat(false);
    setShowHistory(false);
  };

  const handleSendMessage = (input, selectedFiles) => {
    const messageWithFiles =
      selectedFiles.length > 0
        ? `${input}\n\nArchivos seleccionados:\n${selectedFiles.join("\n")}`
        : input;

    setMessages((prevMessages) => [
      ...prevMessages,
      { text: messageWithFiles, isUser: true },
    ]);
    setIsLoading(true);
    setIsNewChat(false);
    vscode.postMessage({ type: "sendMessage", message: messageWithFiles });
  };

  const handleModeChange = (mode) => {
    setInputMode(mode);
  };

  return (
    <div style={styles.container}>
      <Header vscode={vscode} />
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {isNewChat && !showHistory ? (
          <RecentChats
            history={history}
            onChatSelect={(chatId) => {
              vscode.postMessage({ type: "loadChat", chatId });
            }}
          />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            currentMessage={currentMessage}
          />
        )}
        {showHistory && (
          <ChatHistory
            history={history}
            onChatSelect={(chatId) => {
              vscode.postMessage({ type: "loadChat", chatId });
            }}
            setShowHistory={setShowHistory}
          />
        )}
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        projectFiles={projectFiles}
        mode={inputMode}
        onModeChange={handleModeChange}
      />
    </div>
  );
}

ReactDOM.render(<Chat />, document.getElementById("root"));
