export const styles = {
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: '0',
      width: '250px',
      maxHeight: '300px',
      overflowY: 'auto',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 10,
      marginTop: '4px',
    },
    fileList: {
      listStyle: 'none',
      margin: 0,
      padding: '4px 0',
    },
    fileItem: {
      padding: '8px 12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#374151',
      transition: 'background-color 0.2s',
    },
    fileItemHover: {
      backgroundColor: '#f3f4f6',
    },
  };