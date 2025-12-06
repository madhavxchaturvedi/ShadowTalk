import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRooms, fetchMyRooms, setFilters } from '../store/slices/roomsSlice';
import CreateRoomModal from '../components/CreateRoomModal';
import RoomCard from '../components/RoomCard';
import { HiHome, HiPlus } from 'react-icons/hi2';

const Home = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { allRooms, loading, filters } = useSelector((state) => state.rooms);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const topics = [
    'all', 'General', 'Technology', 'Gaming', 'Music', 'Movies',
    'Sports', 'Art', 'Books', 'Food', 'Travel',
    'Mental Health', 'Relationships', 'Career', 'Hobbies', 'Other'
  ];

  // Fetch rooms and user's joined rooms ONLY when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchRooms(filters));
      dispatch(fetchMyRooms());
    }
  }, [dispatch, isAuthenticated]); // Removed filters from dependencies to prevent infinite loop

  // Refetch when filters change
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchRooms(filters));
    }
  }, [dispatch, filters, isAuthenticated]);

  const handleTopicChange = (topic) => {
    dispatch(setFilters({ topic }));
  };

  const handleSortChange = (sort) => {
    dispatch(setFilters({ sort }));
  };

  return (
    <>
      {/* Header */}
      <div className="main-header">
        <div>
          <h1>Discover Rooms</h1>
          <p>Join anonymous communities and start chatting</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="create-room-btn"
        >
          <HiPlus style={{ fontSize: '20px' }} />
          <span>Create Room</span>
        </button>
      </div>

      <div className="main-body">


        {/* Filters */}
        <div className="filter-section">
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Filter by Topic</label>
            <div className="filter-chips">
              {topics.map(topic => (
                <button
                  key={topic}
                  onClick={() => handleTopicChange(topic)}
                  className={`filter-chip ${filters.topic === topic ? 'active' : ''}`}
                >
                  {topic.charAt(0).toUpperCase() + topic.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '200px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Sort By</label>
            <select
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="trending">Trending</option>
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="active">Most Active</option>
            </select>
          </div>
        </div>

        {/* Room List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 20px' }}>
            <div className="w-12 h-12 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin"></div>
          </div>
        ) : allRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '24px' }}>
            <HiHome style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>No rooms found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Be the first to create a room in this category!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ padding: '12px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <HiPlus style={{ fontSize: '18px' }} />
              Create First Room
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
    </>
  );
};

export default Home;
