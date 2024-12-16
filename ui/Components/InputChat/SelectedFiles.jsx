// ui/Components/InputChat/SelectedFiles.jsx
import React, { useState } from "react";
import { FileIcon } from "./Icons";
import FileDropdown from "./FileDropDown";

const styles = {
  wrapper: {
    position: "relative",
  },
  container: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    padding: "4px",
    alignItems: "center",
  },
  fileTag: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "var(--vscode-button-secondaryBackground)",
    color: "var(--vscode-button-secondaryForeground)",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    // border: "0.5px solid #f2f2f2",
  },
  removeButton: {
    marginLeft: "4px",
    border: "none",
    background: "none",
    color: "var(--vscode-button-secondaryForeground)",
    cursor: "pointer",
    padding: "0 4px",
    fontSize: "12px",
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    padding: "2px 2px",
    backgroundColor: "transparent",
    border: "1px dashed var(--vscode-button-secondaryBackground)",
    borderRadius: "4px",
    cursor: "pointer",
    color: "var(--vscode-button-secondaryForeground)",
  },
};

const SelectedFiles = ({ files, onRemove, projectFiles, onFileSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleFileSelect = (file) => {
    onFileSelect(file);
    setIsDropdownOpen(false);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            ...styles.addButton,
            ...styles.fileTag,
            border: "none",
          }}
          title="add context"
        >
          <FileIcon />
          {files.length === 0 && (
            <span style={{ marginLeft: "4px" }}>add context</span>
          )}
        </button>
        {files.map((file) => (
          <div key={file} style={styles.fileTag}>
            <span>{file}</span>
            <button style={styles.removeButton} onClick={() => onRemove(file)}>
              ×
            </button>
          </div>
        ))}
      </div>
      {isDropdownOpen && (
        <FileDropdown
          isOpen={isDropdownOpen}
          onFileSelect={handleFileSelect}
          files={projectFiles.filter((file) => !files.includes(file))}
        />
      )}
    </div>
  );
};

export default SelectedFiles;
