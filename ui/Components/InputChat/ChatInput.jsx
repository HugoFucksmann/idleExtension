import React, { useState, useEffect } from "react";

import ModeSwitch from "./ModeSwitch";
import { EnterIcon } from "./Icons";
import { styles } from "./ChatInputStyles";
import SelectedFiles from "./SelectedFiles";

const ChatInput = ({ onSendMessage, isLoading, vscode }) => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("write");
  const [projectFiles, setProjectFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleTextareaChange = (e) => {
    const textarea = e.target;
    setInput(textarea.value);

    textarea.style.height = "auto";

    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = `${newHeight}px`;

    textarea.style.overflowY = textarea.scrollHeight > 150 ? "auto" : "hidden";
  };

  useEffect(() => {
    const handleProjectFiles = (event) => {
      const message = event.data;
      if (message.type === "projectFiles") {
        setProjectFiles(message.files);
      }
    };

    if (vscode) {
      vscode.postMessage({ type: "getProjectFiles" });
      window.addEventListener("message", handleProjectFiles);
    }

    return () => {
      window.removeEventListener("message", handleProjectFiles);
    };
  }, []);

  const sendMessage = () => {
    if ((input.trim() !== "" || selectedFiles.length > 0) && !isLoading) {
      const messageWithFiles =
        selectedFiles.length > 0
          ? `${input}\n\nArchivos seleccionados:\n${selectedFiles.join("\n")}`
          : input;

      onSendMessage(messageWithFiles);
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
      sendMessage();
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

  const handleSendClick = () => {
    if (!isLoading) {
      sendMessage();
    }
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
          <EnterIcon style={styles.sendIcon} />
        </button>
      </div>

      <div style={styles.actionsRow}>
        <ModeSwitch mode={mode} onModeChange={setMode} />
      </div>
    </div>
  );
};

export default ChatInput;
