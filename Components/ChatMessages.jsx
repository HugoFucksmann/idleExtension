import React, { useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
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
    backgroundColor: "var(--vscode-inputValidation-errorBackground)",
    border: "1px solid var(--vscode-inputValidation-errorBorder)",
  },
  codeBlock: {
    backgroundColor: "var(--vscode-editor-background)",
    border: "1px solid var(--vscode-input-border)",
    borderRadius: "4px",
    padding: "8px",
    margin: "8px 0",
  },
  title: {
    fontSize: "1.5em",
    fontWeight: "bold",
    color: "var(--vscode-foreground)",
    marginTop: "24px",
    marginBottom: "16px",
    borderBottom: "1px solid var(--vscode-input-border)",
    paddingBottom: "8px",
  },
  subtitle: {
    fontSize: "1.3em",
    fontWeight: "bold",
    color: "var(--vscode-foreground)",
    marginTop: "20px",
    marginBottom: "12px",
  },
  itemsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginLeft: "20px",
    marginTop: "8px",
    marginBottom: "12px",
  },
  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  },
  itemBullet: {
    fontWeight: "bold",
    minWidth: "20px",
  },
  itemContent: {
    flex: 1,
  },
  subItem: {
    marginLeft: "20px",
    marginTop: "4px",
    color: "var(--vscode-foreground)",
    opacity: 0.9,
  },
};

function parseMessage(message) {
  const parts = [];
  let currentText = "";

  const lines = message.split("\n");

  for (let line of lines) {
    // Detectar código como antes...
    if (line.startsWith("```")) {
      if (currentText) {
        parts.push({ type: "text", content: currentText.trim() });
        currentText = "";
      }
      continue;
    }

    // Detectar títulos principales
    if (line.startsWith("###")) {
      if (currentText) {
        parts.push({ type: "text", content: currentText.trim() });
        currentText = "";
      }
      parts.push({
        type: "title",
        content: line.replace(/^###\s*/, "").trim(),
      });
      continue;
    }

    // Detectar subtítulos
    if (line.startsWith("####")) {
      if (currentText) {
        parts.push({ type: "text", content: currentText.trim() });
        currentText = "";
      }
      parts.push({
        type: "subtitle",
        content: line.replace(/^####\s*/, "").trim(),
      });
      continue;
    }

    // Detectar items y sus sub-items
    if (line.includes("**")) {
      if (currentText) {
        parts.push({ type: "text", content: currentText.trim() });
        currentText = "";
      }

      const itemMatch = line.match(/\*\*Item \d+:\*\* (.*)/);
      if (itemMatch) {
        const itemContent = itemMatch[1].trim();
        const subItems = [];

        // Buscar sub-items (líneas que comienzan con -)
        while (lines.length > 0 && lines[0]?.trim().startsWith("-")) {
          subItems.push(lines.shift().trim().substring(1).trim());
        }

        parts.push({
          type: "item",
          content: itemContent,
          subItems: subItems,
        });
        continue;
      }
    }

    currentText += line + "\n";
  }

  if (currentText.trim()) {
    parts.push({ type: "text", content: currentText.trim() });
  }

  return parts;
}

function MessagePart({ part }) {
  useEffect(() => {
    if (part.type === "code") {
      Prism.highlightAll();
    }
  }, [part]);

  switch (part.type) {
    case "code":
      return (
        <div style={styles.codeBlock}>
          <pre>
            <code className={`language-${part.language}`}>{part.content}</code>
          </pre>
        </div>
      );
    case "title":
      return <h2 style={styles.title}>{part.content}</h2>;
    case "subtitle":
      return <h3 style={styles.subtitle}>{part.content}</h3>;
    case "item":
      return (
        <div style={styles.itemsContainer}>
          <div style={styles.item}>
            <span style={styles.itemBullet}>•</span>
            <div style={styles.itemContent}>
              {part.content}
              {part.subItems?.map((subItem, index) => (
                <div key={index} style={styles.subItem}>
                  - {subItem}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    default:
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
        </div>
      ))}
      {isLoading && <div style={styles.aiMessage}>AI is thinking...</div>}
    </div>
  );
}

export default ChatMessages;
