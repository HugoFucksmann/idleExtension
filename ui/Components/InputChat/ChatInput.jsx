import React, { memo, useState } from "react";
import { EnterIcon, WriteIcon, ChatIcon, FileIcon } from "./Icons";
import { styles } from "./ChatInputStyles";
import { useAppContext } from "../../context/AppContext";
import { useTextareaResize } from "../../hooks/useTextareaResize";

const FileSelector = memo(({ files, onRemove, projectFiles, onFileSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  console.log("[FileSelector] Props received:", {
    filesCount: files.length,
    projectFilesCount: projectFiles?.length || 0,
    isDropdownOpen
  });

  const handleFileSelect = (file) => {
    console.log("[FileSelector] File selected:", file);
    onFileSelect(file);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const toggleDropdown = () => {
    console.log("[FileSelector] Toggling dropdown, current state:", !isDropdownOpen);
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setSearchTerm("");
    }
  };

  const filteredFiles = projectFiles?.filter(file => 
    file.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.filesWrapper}>
      <div style={styles.filesContainer}>
        <button
          onClick={toggleDropdown}
          style={styles.addButton}
          title="Add file"
        >
          <FileIcon />
        </button>
        {files.map((file) => (
          <div key={file} style={styles.fileTag}>
            <span>{file}</span>
            <button
              onClick={() => {
                console.log("[FileSelector] Removing file:", file);
                onRemove(file);
              }}
              style={styles.removeButton}
              title="Remove file"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {isDropdownOpen && (
        <div style={styles.dropdown}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              style={styles.searchInput}
            />
          </div>
          <ul style={styles.fileList}>
            {filteredFiles?.length > 0 ? (
              filteredFiles.map((file) => (
                <li
                  key={file}
                  onClick={() => handleFileSelect(file)}
                  style={styles.fileItem}
                >
                  {file}
                </li>
              ))
            ) : (
              <li style={styles.fileItem}>
                {searchTerm ? "No matching files" : "No files available"}
              </li>
            )}
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
