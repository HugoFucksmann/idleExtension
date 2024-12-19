import React, { memo, useState, useEffect, useRef } from "react";
import { EnterIcon, WriteIcon, ChatIcon, FileIcon } from "./Icons";
import { styles } from "./ChatInputStyles";
import { useAppContext } from "../../context/AppContext";
import { useTextareaResize } from "../../hooks/useTextareaResize";

const FileSelector = memo(({ files, onRemove, projectFiles, onFileSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  
  console.log("[FileSelector] Props received:", {
    filesCount: files.length,
    projectFilesCount: projectFiles?.length || 0,
    isDropdownOpen
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleFileSelect = (file) => {
    console.log("[FileSelector] File selected:", file);
    onFileSelect(file);
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
    <div style={styles.filesWrapper} ref={dropdownRef}>
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
              <li style={styles.noFiles}>No files available</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
});

const ChatInput = () => {
  const {
    input,
    setInput,
    handleSendMessage,
    selectedFiles,
    setSelectedFiles,
    projectFiles
  } = useAppContext();
  
  const textareaRef = useRef(null);
  useTextareaResize(textareaRef);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() !== "" || selectedFiles.length > 0) {
      handleSendMessage(input, selectedFiles);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (file) => {
    if (!selectedFiles.includes(file)) {
      setSelectedFiles(prev => [...prev, file]);
    }
  };

  const handleFileRemove = (file) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };

  return (
    <div style={styles.container}>
      <FileSelector
        files={selectedFiles}
        onRemove={handleFileRemove}
        projectFiles={projectFiles}
        onFileSelect={handleFileSelect}
      />
      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={styles.textarea}
        />
        <button type="submit" style={styles.button} title="Send message">
          <EnterIcon />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
