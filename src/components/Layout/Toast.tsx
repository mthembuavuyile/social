import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'error';
  show: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, show }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} style={{ flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={16} style={{ flexShrink: 0 }} />;
      default:
        return <Info size={16} style={{ flexShrink: 0 }} />;
    }
  };

  return (
    <div className={`toast ${show ? 'show' : ''} ${type}`}>
      <span id="toastIcon" style={{ display: 'flex', alignItems: 'center' }}>
        {getIcon()}
      </span>
      <span id="toastMessage" style={{ fontWeight: 600 }}>{message}</span>
    </div>
  );
};
