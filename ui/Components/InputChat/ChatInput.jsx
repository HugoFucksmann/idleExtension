import React, { useState, memo } from "react";
import ModeSwitch from "./ModeSwitch";
import FileDropdown from "./FileDropDown";
import { EnterIcon, ImageIcon, FileIcon } from "./Icons";
import { styles } from "./ChatInputStyles";

const ChatInput = memo(({ input, setInput, sendMessage, isLoading }) => {
  const [mode, setMode] = useState("write");
  const [isFileDropdownOpen, setIsFileDropdownOpen] = useState(false);

  // Mock file list - replace with actual project files
  const projectFiles = [
    "src/App.jsx",
    "src/main.jsx",
    "src/styles.css",
    "package.json",
    "index.html",
    "README.md",
  ];

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageUpload = () => {
    console.log("Image upload clicked");
  };

  const handleFileSelect = (file) => {
    console.log("Selected file:", file);
    setIsFileDropdownOpen(false);
  };

  return (
    <div style={styles.container}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          mode === "write" ? "Write something..." : "Ask something..."
        }
        disabled={isLoading}
        style={{
          ...styles.input,
          ...(isLoading && styles.inputDisabled),
        }}
      />
      <div style={styles.enterIcon}>
        <EnterIcon />
      </div>

      <div style={styles.actionsRow}>
        <div style={styles.uploadButtons}>
          <button
            onClick={handleImageUpload}
            style={styles.iconButton}
            title="Upload image"
          >
            <ImageIcon />
          </button>
          <button
            onClick={() => setIsFileDropdownOpen(!isFileDropdownOpen)}
            style={styles.iconButton}
            title="Select file"
          >
            <FileIcon />
          </button>
          <FileDropdown
            isOpen={isFileDropdownOpen}
            onFileSelect={handleFileSelect}
            files={projectFiles}
          />
        </div>

        <ModeSwitch mode={mode} onModeChange={setMode} />
      </div>
    </div>
  );
});

export default ChatInput;
