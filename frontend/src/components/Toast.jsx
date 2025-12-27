import { useState, useEffect } from 'react';
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiXMark } from 'react-icons/hi2';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const success = (message) => showToast(message, 'success');
  const error = (message) => showToast(message, 'error');
  const info = (message) => showToast(message, 'info');
  const warning = (message) => showToast(message, 'warning');

  return { toasts, success, error, info, warning };
};

const Toast = ({ message, type = 'info', isVisible, onClose }) => {
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <HiCheckCircle className="toast-icon" />,
    error: <HiXCircle className="toast-icon" />,
    info: <HiInformationCircle className="toast-icon" />,
    warning: <HiInformationCircle className="toast-icon" />,
  };

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {icons[type]}
        <span className="toast-message">{message}</span>
        <button onClick={onClose} className="toast-close" aria-label="Close notification">
          <HiXMark />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <HiCheckCircle className="toast-icon" />}
          {toast.type === 'error' && <HiXCircle className="toast-icon" />}
          {(toast.type === 'info' || toast.type === 'warning') && <HiInformationCircle className="toast-icon" />}
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default Toast;
