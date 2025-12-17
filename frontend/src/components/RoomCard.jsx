import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiHash, FiVolume2, FiLock, FiUnlock } from 'react-icons/fi';
import { HiSpeakerWave, HiUserGroup } from 'react-icons/hi2';
import { joinRoom, leaveRoom } from '../store/slices/roomsSlice';
import { useState } from 'react';

const RoomCard = ({ room, variant = 'card' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myRooms } = useSelector((state) => state.rooms);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isMember = myRooms.some(r => r._id === room._id);

  const handleJoinLeave = async (e) => {
    e.stopPropagation();
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

  const getRoomIcon = () => {
    const roomType = room.roomType || 'text';
    if (roomType === 'voice') {
      return <HiSpeakerWave className="channel-icon" />;
    }
    return <FiHash className="channel-icon" />;
  };

  const isActive = window.location.pathname.includes(room._id);

  // Discord-style compact list item
  if (variant === 'list') {
    return (
      <div 
        className={`channel-item ${isMember ? 'channel-joined' : 'channel-locked'} ${isActive ? 'channel-active' : ''}`}
        onClick={handleOpenRoom}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="channel-main">
          {getRoomIcon()}
          <span className="channel-name">{room.name}</span>
          {room.roomType === 'voice' && room.voiceSettings?.maxParticipants && (
            <span className="channel-limit">{room.memberCount || 0}/{room.voiceSettings.maxParticipants}</span>
          )}
        </div>
        
        {isHovered && !isMember && (
          <button
            onClick={handleJoinLeave}
            disabled={isLoading}
            className="channel-join-icon"
            title="Join channel"
          >
            {isLoading ? '...' : '+'}
          </button>
        )}
        
        {!isMember && <FiLock className="channel-lock-icon" />}
      </div>
    );
  }

  // Card variant for discovery page
  return (
    <div 
      className={`room-card-compact ${isMember ? 'room-joined' : ''} ${isActive ? 'room-active' : ''}`}
      onClick={handleOpenRoom}
    >
      <div className="room-card-header">
        <div className={`room-card-icon ${room.roomType === 'voice' ? 'icon-voice' : 'icon-text'}`}>
          {getRoomIcon()}
        </div>
        <div className="room-card-content">
          <div className="room-card-title-row">
            <h3 className="room-card-title">{room.name}</h3>
            {room.roomType === 'voice' && (
              <span className="room-type-badge voice">
                <HiSpeakerWave className="badge-icon" />
                Voice
              </span>
            )}
          </div>
          <p className="room-card-desc">{room.description || 'No description'}</p>
        </div>
      </div>

      <div className="room-card-footer">
        <div className="room-card-stats">
          <div className="room-card-stat">
            <HiUserGroup className="stat-icon" />
            <span>{room.memberCount || 0}</span>
          </div>
          <span className="room-card-topic">{room.topic}</span>
        </div>
        
        <button
          onClick={handleJoinLeave}
          disabled={isLoading}
          className={`room-card-btn ${isMember ? 'btn-joined' : 'btn-join'}`}
        >
          {isLoading ? '...' : isMember ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
