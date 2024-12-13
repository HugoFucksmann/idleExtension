import React, { useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";

const styles = {
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
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    );
  } else {
    return <p>{part.content}</p>;
  }
}

function ChatMessages({ messages, isLoading }) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
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
  );
}

export default ChatMessages;
