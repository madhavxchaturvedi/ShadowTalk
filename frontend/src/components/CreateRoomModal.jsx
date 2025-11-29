import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createRoom } from '../store/slices/roomsSlice';

const CreateRoomModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: 'General',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const topics = [
    'General', 'Technology', 'Gaming', 'Music', 'Movies',
    'Sports', 'Art', 'Books', 'Food', 'Travel',
    'Mental Health', 'Relationships', 'Career', 'Hobbies', 'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await dispatch(createRoom(formData)).unwrap();
      setFormData({ name: '', description: '', topic: 'General' });
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl max-w-2xl w-full p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Room</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Room Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              placeholder="Enter room name (3-50 characters)"
              minLength={3}
              maxLength={50}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)] resize-none"
              placeholder="What's this room about?"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Topic *
            </label>
            <select
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              required
            >
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--border)] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
