import React from "react";

const styles = {
  header: {
    padding: "10px",
    borderBottom: "1px solid var(--vscode-sideBar-border)",
    fontSize: "14px",
    fontWeight: "bold",
  },
};

function Header() {
  return <div style={styles.header}>AI Chat (qwen2.5-coder:7b)</div>;
}

export default Header;
