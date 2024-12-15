import React, { memo } from "react";

import { WriteIcon, ChatIcon } from "./Icons";
import { styles } from "./modeSwitchStyles";

const ModeSwitch = memo(({ mode, onModeChange }) => {
  return (
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
  );
});

export default ModeSwitch;
