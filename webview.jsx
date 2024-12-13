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

  useEffect(() => {
    const handleMessage = (event) => {
      console.log("Mensaje recibido:", event.data);
      const { type, message } = event.data;

      if (type === "response") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: message, isUser: false },
        ]);
        setIsLoading(false);
      } else if (type === "error") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: message, isUser: false, isError: true },
        ]);
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() !== "" && !isLoading) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: input, isUser: true },
      ]);
      setInput("");
      setIsLoading(true);

      vscode.postMessage({ type: "sendMessage", message: input });
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <ChatMessages messages={messages} isLoading={isLoading} />
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
