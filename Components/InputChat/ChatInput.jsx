import React, { useState } from 'react';

import ModeSwitch from './ModeSwitch';
import FileDropdown from './FileDropDown';
import { styles } from './ChatInputStyles';


function ChatInput({ input, setInput, sendMessage, isLoading }) {
  const [mode, setMode] = useState('write');
  const [isFileDropdownOpen, setIsFileDropdownOpen] = useState(false);

  // Mock file list - replace with actual project files
  const projectFiles = [
    'src/App.jsx',
    'src/main.jsx',
    'src/styles.css',
    'package.json',
    'index.html',
    'README.md',
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageUpload = () => {
    console.log('Image upload clicked');
  };

  const handleFileSelect = (file) => {
    console.log('Selected file:', file);
    setIsFileDropdownOpen(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputWrapper}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'write' ? 'Write something...' : 'Ask something...'}
          disabled={isLoading}
          style={{
            ...styles.input,
            ...(isLoading && styles.inputDisabled),
          }}
        />
        {isLoading ? (
          <div style={styles.enterIcon}>
            <div style={styles.spinner} />
          </div>
        ) : (
          <div style={styles.enterIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 13L17 13" />
      <path d="M17 13L13 17" />
      <path d="M17 13L13 9" />
    </svg>
          </div>
        )}
      </div>
      
      <div style={styles.actionsRow}>
        <div style={styles.uploadButtons}>
          <button
            onClick={handleImageUpload}
            style={styles.iconButton}
            title="Upload image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
          </button>
          <button
            onClick={() => setIsFileDropdownOpen(!isFileDropdownOpen)}
            style={styles.iconButton}
            title="Select file"
          >
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
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
}



export default ChatInput;