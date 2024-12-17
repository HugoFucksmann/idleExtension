import React from "react";
import CodeBlock from "../MessageContent/CodeBlock";
import { styles } from "../styles";
import AttachedFiles from "../AttachedFiles";

const parseMessage = (message) => {
  const parts = [];
  const codeRegex = /```([\w:\/\\.-]+)?\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: message.slice(lastIndex, match.index),
      });
    }

    const [language, filename] = (match[1] || "javascript").split(":");

    parts.push({
      type: "code",
      language,
      filename: filename || undefined,
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < message.length) {
    parts.push({ type: "text", content: message.slice(lastIndex) });
  }

  return parts;
};

export const AIMessage = ({ message }) => {
  const parts = parseMessage(message.text);
  const attachedFiles = message.attachedFiles || [];

  return (
    <div style={{ ...styles.message, ...styles.aiMessage }}>
      {attachedFiles.length > 0 && <AttachedFiles files={attachedFiles} />}
      {parts.map((part, i) =>
        part.type === "code" ? (
          <CodeBlock key={i} {...part} filename={message.attachedFiles?.[0]} />
        ) : (
          <p key={i}>{part.content}</p>
        )
      )}
    </div>
  );
};
