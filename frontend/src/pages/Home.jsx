import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRooms, fetchMyRooms, setFilters } from '../store/slices/roomsSlice';
import CreateRoomModal from '../components/CreateRoomModal';
import RoomCard from '../components/RoomCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { HiPlus, HiMagnifyingGlass, HiHome } from 'react-icons/hi2';

const Home = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { allRooms, myRooms, loading, filters } = useSelector((state) => state.rooms);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const topics = [
    'all', 'General', 'Technology', 'Gaming', 'Music', 'Movies',
    'Sports', 'Art', 'Books', 'Food'
  ];

  // Fetch rooms when component mounts or when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchRooms(filters));
      dispatch(fetchMyRooms());
    }
  }, [dispatch, isAuthenticated, filters.topic, filters.search, filters.sort]);

  const handleTopicChange = (topic) => {
    dispatch(setFilters({ topic }));
  };

  const handleSearch = (value) => {
    setSearchInput(value);
    const timer = setTimeout(() => {
      dispatch(setFilters({ search: value }));
    }, 300);
    return () => clearTimeout(timer);
  };

  return (
    <div className="home-page">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-content">
          <div>
            <h1 className="home-title">Discover Rooms</h1>
            <p className="home-subtitle">Join conversations anonymously</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-create-room">
            <HiPlus />
            Create Room
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="home-main">
        {/* Search & Filters Bar */}
        <div className="home-toolbar">
          <div className="search-bar">
            <HiMagnifyingGlass className="search-icon" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search rooms..."
              className="search-input"
            />
          </div>
          
          <select
            value={filters.sort}
            onChange={(e) => dispatch(setFilters({ sort: e.target.value }))}
            className="sort-select"
          >
            <option value="trending">🔥 Trending</option>
            <option value="popular">⭐ Popular</option>
            <option value="newest">✨ Newest</option>
            <option value="active">💬 Active</option>
          </select>
        </div>

        {/* Topic Filters */}
        <div className="topic-filters">
          <span className="filter-label">Topics:</span>
          <div className="topic-chips">
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => handleTopicChange(topic)}
                className={`topic-chip ${filters.topic === topic ? 'active' : ''}`}
              >
                {topic.charAt(0).toUpperCase() + topic.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <SkeletonLoader type="card" count={6} />
        ) : allRooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <HiHome />
            </div>
            <h3 className="empty-state-title">No rooms found</h3>
            <p className="empty-state-text">
              {filters.search 
                ? 'Try different search terms or filters'
                : 'Be the first to create a room!'}
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <HiPlus />
              Create Room
            </button>
          </div>
        ) : (
          <div className="rooms-grid">
            {allRooms.map(room => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
};

export default Home;
