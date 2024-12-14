import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Header from "./Components/Header";
import ChatMessages from "./Components/ChatMessages";
import ChatInput from "./Components/InputChat/ChatInput";

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

          if (message.metrics) {
            console.log(`Tokens generados: ${message.metrics.tokensGenerated}`);
            console.log(`Tokens totales: ${message.metrics.totalTokens}`);
            console.log(`Duración: ${message.metrics.duration}ms`);
          }
        }
      } else if (message.type === "error") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: message.message, isUser: false, isError: true },
        ]);
        setIsLoading(false);
        setCurrentMessage("");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentMessage]);

  const sendMessage = () => {
    if (input.trim() !== "" && !isLoading) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: input, isUser: true },
      ]);
      setInput("");
      setIsLoading(true);
      setCurrentMessage("");

      vscode.postMessage({ type: "sendMessage", message: input });
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        currentMessage={currentMessage}
      />
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
