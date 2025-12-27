import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { HiXMark } from 'react-icons/hi2';
import { createRoom } from '../store/slices/roomsSlice';
import Toast from './Toast';

const CreateRoomModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: 'General',
    roomType: 'text',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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

  const topics = [
    'General', 'Technology', 'Gaming', 'Music', 'Movies',
    'Sports', 'Art', 'Books', 'Food', 'Travel',
    'Mental Health', 'Relationships', 'Career', 'Hobbies', 'Other'
  ];

  const roomTypes = [
    { value: 'text', label: '💬 Text Only', description: 'Traditional text-based chat' },
    { value: 'voice', label: '🎤 Voice Only', description: 'Voice channel with no text' },
    { value: 'both', label: '🎧 Text + Voice', description: 'Both text chat and voice' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await dispatch(createRoom(formData)).unwrap();
      setFormData({ name: '', description: '', topic: 'General', roomType: 'text' });
      setToastMessage(`Room "${formData.name}" created successfully!`);
      setToastType('success');
      setShowToast(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err);
      setToastMessage(err || 'Failed to create room');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {showToast && (
        <Toast 
          message={toastMessage}
          type={toastType}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      )}
      
      <div 
        className={`modal-overlay ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
      <div className={`modal-content ${isClosing ? 'closing' : ''}`}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Room</h2>
          <button
            onClick={handleClose}
            className="modal-close"
            aria-label="Close modal"
          >
            <HiXMark />
          </button>
        </div>

        {error && (
          <div className="error-alert">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">
              Room Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="Enter room name (3-50 characters)"
              minLength={3}
              maxLength={50}
              required
              autoFocus
            />
            <p className="form-hint">
              {formData.name.length}/50 characters
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Description <span className="text-[var(--text-muted)] text-xs">(Optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              placeholder="What's this room about?"
              rows={3}
              maxLength={200}
            />
            <p className="form-hint">
              {formData.description.length}/200 characters
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Topic <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="form-select"
              required
            >
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Room Type <span className="text-red-400">*</span>
              <span className="ml-2 px-2 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded-full">NEW</span>
            </label>
            <div className="room-type-options">
              {roomTypes.map(type => (
                <label
                  key={type.value}
                  className={`room-type-option ${formData.roomType === type.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="roomType"
                    value={type.value}
                    checked={formData.roomType === type.value}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <div className="room-type-label">{type.label}</div>
                    <div className="room-type-description">{type.description}</div>
                  </div>
                  {formData.roomType === type.value && (
                    <div className="room-type-check">✓</div>
                  )}
                </label>
              ))}
            </div>
            {formData.roomType !== 'text' && (
              <div className="info-alert">
                🎙️ Voice rooms use WebRTC for peer-to-peer audio. Microphone permission required.
              </div>
            )}
          </div>

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
              className="btn-primary"
              disabled={loading || formData.name.length < 3}
            >
              {loading ? (
                <>
                  <div className="btn-spinner-small"></div>
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default CreateRoomModal;
