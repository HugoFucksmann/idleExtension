import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";
import "./webview.css";

const vscode = acquireVsCodeApi();

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    color: "var(--vscode-foreground)",
    backgroundColor: "var(--vscode-sideBar-background)",
  },
  header: {
    padding: "10px",
    borderBottom: "1px solid var(--vscode-sideBar-border)",
    fontSize: "14px",
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
  },
  message: {
    marginBottom: "10px",
    padding: "8px",
    borderRadius: "4px",
    maxWidth: "100%",
    wordWrap: "break-word",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "var(--vscode-button-background)",
    color: "var(--vscode-button-foreground)",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "var(--vscode-editor-background)",
    border: "1px solid var(--vscode-input-border)",
  },
  codeBlock: {
    margin: "10px 0",
    padding: "10px",
    borderRadius: "4px",
    backgroundColor: "var(--vscode-editor-background)",
    border: "1px solid var(--vscode-input-border)",
    overflow: "auto",
  },
  inputContainer: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid var(--vscode-sideBar-border)",
  },
  input: {
    flex: 1,
    padding: "8px",
    marginRight: "10px",
    backgroundColor: "var(--vscode-input-background)",
    color: "var(--vscode-input-foreground)",
    border: "1px solid var(--vscode-input-border)",
    borderRadius: "4px",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "var(--vscode-button-background)",
    color: "var(--vscode-button-foreground)",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  error: {
    color: "var(--vscode-errorForeground)",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "4px",
    backgroundColor: "var(--vscode-inputValidation-errorBackground)",
    border: "1px solid var(--vscode-inputValidation-errorBorder)",
  },
};

function parseMessage(message) {
  const parts = [];
  const codeRegex = /```(\w+)?\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: message.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: "code",
      language: match[1] || "javascript",
      content: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < message.length) {
    parts.push({ type: "text", content: message.slice(lastIndex) });
  }

  return parts;
}

function MessagePart({ part }) {
  if (part.type === "code") {
    const highlightedCode = Prism.highlight(
      part.content,
      Prism.languages[part.language] || Prism.languages.javascript,
      part.language
    );
    return (
      <pre style={styles.codeBlock}>
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    );
  } else {
    return <p>{part.content}</p>;
  }
}

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;
      switch (message.type) {
        case "receiveMessage":
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage && lastMessage.isPartial) {
              return [
                ...prevMessages.slice(0, -1),
                {
                  ...lastMessage,
                  text: message.message,
                  isPartial: message.isPartial,
                },
              ];
            } else {
              return [
                ...prevMessages,
                {
                  text: message.message,
                  isUser: false,
                  isPartial: message.isPartial,
                },
              ];
            }
          });
          setIsLoading(message.isPartial);
          break;
        case "error":
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: message.message, isError: true },
          ]);
          setIsLoading(false);
          break;
      }
    });
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() !== "" && !isLoading) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: input, isUser: true },
      ]);
      vscode.postMessage({ type: "sendMessage", message: input });
      setInput("");
      setIsLoading(true);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>AI Chat (qwen2.5-coder:7b)</div>
      <div ref={chatContainerRef} style={styles.chatContainer}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              ...(msg.isUser ? styles.userMessage : styles.aiMessage),
              ...(msg.isError ? styles.error : {}),
            }}
          >
            {msg.isUser
              ? msg.text
              : parseMessage(msg.text).map((part, i) => (
                  <MessagePart key={i} part={part} />
                ))}
            {msg.isPartial && <span style={{ marginLeft: "5px" }}>...</span>}
          </div>
        ))}
        {isLoading && <div style={styles.aiMessage}>AI is thinking...</div>}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          style={styles.input}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          style={styles.button}
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
}

ReactDOM.render(<Chat />, document.getElementById("root"));
