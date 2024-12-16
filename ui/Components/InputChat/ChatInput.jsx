import React, { useState } from "react";

import ModeSwitch from "./ModeSwitch";
import { EnterIcon } from "./Icons";
import { styles } from "./ChatInputStyles";
import SelectedFiles from "./SelectedFiles";

const ChatInput = ({
  onSendMessage,
  isLoading,
  projectFiles,
  mode,
  onModeChange,
}) => {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleTextareaChange = (e) => {
    const textarea = e.target;
    setInput(textarea.value);

    textarea.style.height = "auto";

    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = `${newHeight}px`;

    textarea.style.overflowY = textarea.scrollHeight > 150 ? "auto" : "hidden";
  };

  const handleSendClick = () => {
    if ((input.trim() !== "" || selectedFiles.length > 0) && !isLoading) {
      onSendMessage(input, selectedFiles);
      setInput("");
      setSelectedFiles([]);

      const textarea = document.querySelector("textarea");
      if (textarea) {
        textarea.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleFileSelect = (file) => {
    if (!selectedFiles.includes(file)) {
      setSelectedFiles((prev) => [...prev, file]);
    }
  };

  const handleRemoveFile = (file) => {
    setSelectedFiles((prev) => prev.filter((f) => f !== file));
  };

  return (
    <div style={styles.container}>
      <SelectedFiles
        files={selectedFiles}
        onRemove={handleRemoveFile}
        projectFiles={projectFiles}
        onFileSelect={handleFileSelect}
      />
      <div style={styles.textareaContainer}>
        <textarea
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "write" ? "Write something..." : "Ask something..."
          }
          disabled={isLoading}
          rows={1}
          style={{
            ...styles.textarea,
            ...(isLoading && styles.inputDisabled),
          }}
        />
        <button
          onClick={handleSendClick}
          disabled={isLoading}
          style={{
            ...styles.sendButton,
            ...(isLoading && styles.buttonDisabled),
            ...(input.trim() === "" &&
              selectedFiles.length === 0 &&
              styles.buttonInactive),
          }}
          title="Send message (Enter)"
        >
          <EnterIcon />
        </button>
      </div>

      <div style={styles.actionsRow}>
        <ModeSwitch mode={mode} onModeChange={onModeChange} />
      </div>
    </div>
  );
};

export default ChatInput;
