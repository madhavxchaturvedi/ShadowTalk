import { useState, useEffect } from 'react';
import { HiXMark, HiShieldExclamation } from 'react-icons/hi2';
import api from '../services/api';
import Toast from './Toast';

const ReportModal = ({ isOpen, onClose, reportedUserId, reportedMessageId, messageType, reportedUserName }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const reasons = [
    { value: 'spam', label: 'Spam or Scam' },
    { value: 'harassment', label: 'Harassment or Bullying' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/reports', {
        reportedUser: reportedUserId,
        reportedMessage: reportedMessageId || undefined,
        messageType: messageType || undefined,
        reason,
        description,
      });

      setShowToast(true);
      setTimeout(() => {
        setReason('');
        setDescription('');
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {showToast && (
        <Toast 
          message="Report submitted successfully. Our team will review it."
          type="success"
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      )}
      
      <div 
        className={`modal-overlay ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <div className={`modal-content report-modal ${isClosing ? 'closing' : ''}`}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="report-icon">
                <HiShieldExclamation />
              </div>
              <h2 className="modal-title">Report User</h2>
            </div>
            <button
              onClick={handleClose}
              className="modal-close"
              aria-label="Close modal"
            >
              <HiXMark />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            {reportedUserName && (
              <div className="report-target">
                <span className="text-[var(--text-muted)]">Reporting:</span>
                <span className="text-white font-semibold">{reportedUserName}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Reason <span className="text-red-400">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-select"
                required
                autoFocus
              >
                <option value="">Select a reason...</option>
                {reasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Additional Details <span className="text-[var(--text-muted)] text-xs">(Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows="4"
                maxLength="500"
                placeholder="Provide more context about this report..."
              />
              <p className="form-hint">
                {description.length}/500 characters
              </p>
            </div>

            {error && (
              <div className="error-alert">
                ⚠️ {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-danger"
                disabled={loading || !reason}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner-small"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ReportModal;
