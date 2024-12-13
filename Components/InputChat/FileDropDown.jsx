import React, { useState } from 'react';
import { styles } from './FileDropDownStyles';

function FileDropdown({ isOpen, onFileSelect, files }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!isOpen) return null;

  return (
    <div style={styles.dropdown}>
      <ul style={styles.fileList}>
        {files.map((file, index) => (
          <li
            key={file}
            onClick={() => onFileSelect(file)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              ...styles.fileItem,
              ...(hoveredIndex === index && styles.fileItemHover),
            }}
          >
            {file}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileDropdown;