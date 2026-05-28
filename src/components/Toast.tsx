import { useEffect, useState } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'info' | 'warning' | 'error';
}

let toastId = 0;
let addToastFn: ((text: string, type?: 'info' | 'warning' | 'error') => void) | null = null;

export function showToast(text: string, type: 'info' | 'warning' | 'error' = 'info') {
  addToastFn?.(text, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (text: string, type: 'info' | 'warning' | 'error' = 'info') => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  const bgColor = (type: string) => {
    switch (type) {
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#4CAF50';
    }
  };

  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: '12px 24px',
            background: bgColor(t.type),
            color: 'white',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: 16,
            animation: 'slideDown 0.3s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
