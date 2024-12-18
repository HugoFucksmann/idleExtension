import React, { memo, useState } from "react";
import { EnterIcon, WriteIcon, ChatIcon, FileIcon } from "./Icons";
import { styles } from "./ChatInputStyles";
import { useAppContext } from "../../context/AppContext";
import { useTextareaResize } from "../../hooks/useTextareaResize";

// FileSelector Component
const FileSelector = memo(({ files, onRemove, projectFiles, onFileSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleFileSelect = (file) => {
    onFileSelect(file);
    setIsDropdownOpen(false);
  };

  return (
    <div style={styles.filesWrapper}>
      <div style={styles.filesContainer}>
        {files.map((file) => (
          <div key={file} style={styles.fileTag}>
            <span>{file}</span>
            <button
              onClick={() => onRemove(file)}
              style={styles.removeButton}
              title="Remove file"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={styles.addButton}
          title="Add file"
        >
          <FileIcon />
        </button>
      </div>

      {isDropdownOpen && (
        <div style={styles.dropdown}>
          <ul style={styles.fileList}>
            {projectFiles.map((file) => (
              <li
                key={file}
                onClick={() => handleFileSelect(file)}
                style={styles.fileItem}
              >
                {file}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

// ModeSwitch Component
const ModeSwitch = memo(({ mode, onModeChange }) => (
  <div style={styles.modeSwitch}>
    <button
      onClick={() => onModeChange("write")}
      style={{
        ...styles.modeButton,
        ...(mode === "write" ? styles.activeMode : styles.inactiveMode),
      }}
    >
      <WriteIcon />
      Write
    </button>
    <button
      onClick={() => onModeChange("chat")}
      style={{
        ...styles.modeButton,
        ...(mode === "chat" ? styles.activeMode : styles.inactiveMode),
      }}
    >
      <ChatIcon />
      Chat
    </button>
  </div>
));

// Main ChatInput Component
const ChatInput = ({ projectFiles }) => {
  const {
    input,
    setInput,
    selectedFiles,
    isLoading,
    mode,
    handleModeChange,
    handleSendMessage,
    handleFileSelect,
    handleRemoveFile
  } = useAppContext();

  const handleResize = useTextareaResize();

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    handleResize(e.target);
  };

  const handleSendClick = () => {
    if (input.trim() || selectedFiles.length > 0) {
      handleSendMessage(input, selectedFiles);
      const textarea = document.querySelector("textarea");
      if (textarea) textarea.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div style={styles.container}>
      <FileSelector
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
          placeholder={mode === "write" ? "Write something..." : "Ask something..."}
          disabled={isLoading}
          rows={1}
          style={{
            ...styles.textarea,
            ...(isLoading && styles.disabled),
          }}
        />
        <button
          onClick={handleSendClick}
          disabled={isLoading}
          style={{
            ...styles.sendButton,
            ...(isLoading && styles.disabled),
            ...(!input.trim() && !selectedFiles.length && styles.inactive),
          }}
          title="Send message (Enter)"
        >
          <EnterIcon />
        </button>
      </div>

      <div style={styles.actionsRow}>
        <ModeSwitch mode={mode} onModeChange={handleModeChange} />
      </div>
    </div>
  );
};

export default ChatInput;
