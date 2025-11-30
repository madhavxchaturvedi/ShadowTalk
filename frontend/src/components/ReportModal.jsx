import { useState } from 'react';
import api from '../services/api';

const ReportModal = ({ isOpen, onClose, reportedUserId, reportedMessageId, messageType, reportedUserName }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      alert('Report submitted successfully. Our team will review it.');
      onClose();
      setReason('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] rounded-lg max-w-md w-full p-6 border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Report User</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {reportedUserName && (
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Reporting: <span className="text-white font-medium">{reportedUserName}</span>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              required
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-none"
              rows="4"
              maxLength="500"
              placeholder="Provide more context about this report..."
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg hover:bg-opacity-80 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
