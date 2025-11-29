import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { joinRoom, leaveRoom } from '../store/slices/roomsSlice';
import { useState } from 'react';

const RoomCard = ({ room }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myRooms } = useSelector((state) => state.rooms);
  const [isLoading, setIsLoading] = useState(false);
  const isMember = myRooms.some(r => r._id === room._id);

  const handleJoinLeave = async () => {
    setIsLoading(true);
    try {
      if (isMember) {
        await dispatch(leaveRoom(room._id)).unwrap();
      } else {
        await dispatch(joinRoom(room._id)).unwrap();
      }
    } catch (error) {
      console.error('Join/Leave error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRoom = () => {
    if (isMember) {
      navigate(`/room/${room._id}`);
    }
  };

  return (
    <div 
      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent)] transition-colors cursor-pointer"
      onClick={handleOpenRoom}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{room.name}</h3>
          <p className="text-[var(--text-secondary)] text-sm line-clamp-2">
            {room.description || 'No description'}
          </p>
        </div>
        <span className="bg-[var(--accent)]/20 text-[var(--accent)] px-3 py-1 rounded-full text-xs font-medium ml-3">
          {room.topic}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            👥 {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className="flex items-center gap-1">
            💬 {room.messageCount} messages
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleJoinLeave();
          }}
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isMember
              ? 'bg-[var(--bg-tertiary)] border border-[var(--border)] hover:bg-red-500/20 hover:border-red-500 hover:text-red-400'
              : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
          }`}
        >
          {isLoading ? (isMember ? 'Leaving...' : 'Joining...') : (isMember ? 'Leave' : 'Join')}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
