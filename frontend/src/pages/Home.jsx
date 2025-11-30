import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRooms, fetchMyRooms, setFilters } from '../store/slices/roomsSlice';
import CreateRoomModal from '../components/CreateRoomModal';
import RoomCard from '../components/RoomCard';

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
    <div className="container mx-auto px-4 mt-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Discover Rooms</h1>
          <p className="text-[var(--text-secondary)]">Join anonymous communities and start chatting</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium"
        >
          + Create Room
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium mb-2">Filter by Topic</label>
            <div className="flex flex-wrap gap-2">
              {topics.map(topic => (
                <button
                  key={topic}
                  onClick={() => handleTopicChange(topic)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.topic === topic
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  {topic.charAt(0).toUpperCase() + topic.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="trending">Trending</option>
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="active">Most Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin"></div>
        </div>
      ) : allRooms.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-12 text-center">
          <h3 className="text-xl font-bold mb-2">No rooms found</h3>
          <p className="text-[var(--text-secondary)] mb-6">
            Be the first to create a room in this category!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
          >
            Create First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allRooms.map(room => (
            <RoomCard key={room._id} room={room} />
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
};

export default Home;
