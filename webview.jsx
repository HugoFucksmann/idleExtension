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
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [isNewChat, setIsNewChat] = useState(true);

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;

      if (message.type === "response") {
        if (!message.done) {
          setCurrentMessage((prev) => prev + message.message);
        } else {
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: currentMessage + message.message, isUser: false },
          ]);
          setCurrentMessage("");
          setIsLoading(false);
          setIsNewChat(false);
        }
      } else if (message.type === "error") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: message.message, isUser: false, isError: true },
        ]);
        setIsLoading(false);
        setCurrentMessage("");
      } else if (message.type === "conversationCleared") {
        setMessages([]);
        setCurrentMessage("");
        setIsLoading(false);
        setIsNewChat(true);
        vscode.postMessage({ type: "loadHistory" });
      } else if (message.type === "chatLoaded") {
        setMessages(
          message.messages.map((msg) => ({
            text: msg.content,
            isUser: msg.role === "user",
          }))
        );
        setIsNewChat(false);
        setShowHistory(false);
      } else if (message.type === "historyLoaded") {
        setHistory(message.history);
      } else if (message.type === "showFullHistory") {
        setShowHistory(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentMessage]);

  useEffect(() => {
    vscode.postMessage({ type: "loadHistory" });
  }, []);

  const sendMessage = () => {
    if (input.trim() !== "" && !isLoading) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: input, isUser: true },
      ]);
      setInput("");
      setIsLoading(true);
      setCurrentMessage("");
      setIsNewChat(false);

      vscode.postMessage({ type: "sendMessage", message: input });
    }
  };

  return (
    <div style={styles.container}>
      <Header vscode={vscode} />
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {isNewChat && !showHistory ? (
          <RecentChats history={history} vscode={vscode} />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            currentMessage={currentMessage}
          />
        )}
        {showHistory && (
          <ChatHistory
            vscode={vscode}
            history={history}
            setShowHistory={setShowHistory}
          />
        )}
      </div>
      <ChatInput
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

ReactDOM.render(<Chat />, document.getElementById("root"));
