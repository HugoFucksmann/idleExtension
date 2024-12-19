import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { EnterIcon, WriteIcon, ChatIcon, FileIcon } from "./Icons";
import { styles } from "./ChatInputStyles";
import { useAppContext } from "../../context/AppContext";
import { useTextareaResize } from "../../hooks/useTextareaResize";


const FileSelector = memo(({ files, onRemove, projectFiles, onFileSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

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

  const handleFileSelect = useCallback((file) => {
    onFileSelect(file);
    setSearchTerm("");
    setIsDropdownOpen(false);
  }, [onFileSelect]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
    setSearchTerm("");
  }, []);

  const filteredFiles = projectFiles?.filter(file => 
    file.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div style={styles.filesWrapper} ref={dropdownRef}>
      <div style={styles.filesContainer}>
        <button
          onClick={toggleDropdown}
          style={styles.addButton}
          title="Add file"
          disabled={!projectFiles?.length}
        >
          <FileIcon />
        </button>
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
              autoFocus
            />
          </div>
          <ul style={styles.fileList}>
            {filteredFiles.length > 0 ? (
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
              <li style={styles.noFiles}>
                {searchTerm ? "No files found" : "No files available"}
              </li>
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
    selectedFiles, 
    setSelectedFiles,
    handleSendMessage,
    isLoading,
    projectFiles
  } = useAppContext();

  const textareaRef = useRef(null);
  const { textareaHeight } = useTextareaResize(textareaRef, input);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if ((input.trim() || selectedFiles.length > 0) && !isLoading) {
      handleSendMessage(input.trim(), selectedFiles);
    }
  }, [input, selectedFiles, isLoading, handleSendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleFileSelect = useCallback((file) => {
    if (!selectedFiles.includes(file)) {
      setSelectedFiles(prev => [...prev, file]);
    }
  }, [selectedFiles, setSelectedFiles]);

  const handleFileRemove = useCallback((file) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  }, [setSelectedFiles]);

  return (
    <div style={styles.container}>
      <FileSelector
        files={selectedFiles}
        onRemove={handleFileRemove}
        onFileSelect={handleFileSelect}
        projectFiles={projectFiles}
      />
      <div style={styles.inputContainer}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ ...styles.input, height: textareaHeight }}
          placeholder="Escribe un mensaje..."
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          style={styles.sendButton}
          disabled={(!input.trim() && !selectedFiles.length) || isLoading}
        >
          <EnterIcon />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;