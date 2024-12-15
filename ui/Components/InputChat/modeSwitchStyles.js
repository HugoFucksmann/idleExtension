export const styles = {
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
  };