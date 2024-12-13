import React, { useState } from 'react';


const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: 'white',
  },
  inputWrapper: {
    position: 'relative',
    flex: 1,
  },
  input: {
    width: '100%',
    padding: '10px 40px 10px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    color: '#111827',
    fontSize: '14px',
    outline: 'none',
  },
  inputDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  enterIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadButtons: {
    display: 'flex',
    gap: '8px',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '6px',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeSwitch: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
  },
  modeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeMode: {
    backgroundColor: 'white',
    color: '#111827',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  inactiveMode: {
    backgroundColor: 'transparent',
    color: '#6b7280',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #e5e7eb',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

function ChatInput({ input, setInput, sendMessage, isLoading }) {
  const [mode, setMode] = useState('write');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageUpload = () => {
    console.log('Image upload clicked');
  };

  const handleFileUpload = () => {
    console.log('File upload clicked');
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
           CornerDownLeft
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
           ImagePlus
          </button>
          <button
            onClick={handleFileUpload}
            style={styles.iconButton}
            title="Upload file"
          >
           FilePlus
          </button>
        </div>

        <div style={styles.modeSwitch}>
          <button
            onClick={() => setMode('write')}
            style={{
              ...styles.modeButton,
              ...(mode === 'write' ? styles.activeMode : styles.inactiveMode),
            }}
          >
           Edit
            Write
          </button>
          <button
            onClick={() => setMode('chat')}
            style={{
              ...styles.modeButton,
              ...(mode === 'chat' ? styles.activeMode : styles.inactiveMode),
            }}
          >
          MessageSquare
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;