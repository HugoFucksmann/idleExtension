import React from 'react';
import { styles } from './modeSwitchStyles';
import { IconChat, IconEdit } from '../../Icons/Icons';

function ModeSwitch({ mode, onModeChange }) {
  return (
    <div style={styles.modeSwitch}>
      <button
        onClick={() => onModeChange('write')}
        style={{
          ...styles.modeButton,
          ...(mode === 'write' ? styles.activeMode : styles.inactiveMode),
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
        Write
      </button>
      <button
        onClick={() => onModeChange('chat')}
        style={{
          ...styles.modeButton,
          ...(mode === 'chat' ? styles.activeMode : styles.inactiveMode),
        }}
      >
         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
        Chat
      </button>
    </div>
  );
}

export default ModeSwitch;