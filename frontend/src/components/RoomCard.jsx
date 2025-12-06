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
    <div className="room-card" onClick={handleOpenRoom}>
      <div className="room-header">
        <div className="room-icon">
          {room.icon || '💬'}
        </div>
        <div className="room-info">
          <h3 className="room-title">{room.name}</h3>
          <span className="room-topic">{room.topic}</span>
        </div>
      </div>

      <p className="room-description">
        {room.description || 'Join this room to start chatting with the community'}
      </p>

      <div className="room-meta">
        <div className="room-stats">
          <span>👥 {room.memberCount || 0}</span>
          <span>💬 {room.messageCount || 0}</span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleJoinLeave();
          }}
          disabled={isLoading}
          className={`room-join-btn ${isMember ? 'joined' : ''}`}
        >
          {isLoading ? (isMember ? 'Leaving...' : 'Joining...') : (isMember ? 'Joined' : 'Join')}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
