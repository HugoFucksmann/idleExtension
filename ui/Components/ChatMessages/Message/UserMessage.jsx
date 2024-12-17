import React, { useState } from "react";
import { AttachedFiles } from "../AttachedFiles";
import { styles } from "../styles";

const IconEdit = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const UserMessage = ({ message, onEdit, messageIndex }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editedText.trim() !== "") {
        onEdit(messageIndex, editedText, message.attachedFiles);
        setIsEditing(false);
      }
    }
  };

  return (
    <div style={{ ...styles.message, ...styles.userMessage }}>
      <div style={styles.userMessageHeader}>
        <AttachedFiles files={message.attachedFiles} />
        {!isEditing && (
          <button
            onClick={handleEdit}
            style={styles.editButton}
            title="Editar mensaje"
          >
            <IconEdit />
          </button>
        )}
      </div>
      {isEditing ? (
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            ...styles.editInput,
            minHeight: "60px",
            width: "100%",
            backgroundColor: "var(--vscode-input-background)",
            color: "var(--vscode-input-foreground)",
            border: "1px solid var(--vscode-input-border)",
            borderRadius: "4px",
            padding: "8px",
            resize: "vertical",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
          autoFocus
          placeholder="Presiona Enter para enviar"
        />
      ) : (
        <div>{message.text}</div>
      )}
    </div>
  );
};
