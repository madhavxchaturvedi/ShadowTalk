import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Room from './pages/Room';
import DMList from './pages/DMList';
import DirectMessage from './pages/DirectMessage';
import Profile from './pages/Profile';
import { initializeSession } from './store/slices/authSlice';
import { socket } from './services/socket';

function App() {
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeSession());
  }, [dispatch]);

  // Register user for DM delivery when user is available
  useEffect(() => {
    console.log('🔍 DM Registration Effect - User:', user, 'User ID:', user?._id);
    
    if (!user?._id) {
      console.log('⏸️  Skipping DM registration - no user ID');
      return;
    }

    const registerUser = () => {
      console.log('📧 Attempting to register user for DMs:', user._id, 'Socket connected:', socket.connected);
      socket.emit('join_dm_session', user._id);
    };

    // Register immediately if connected
    if (socket.connected) {
      registerUser();
    }

    // Also listen for connect events (in case socket reconnects)
    socket.on('connect', registerUser);

    return () => {
      socket.off('connect', registerUser);
    };
  }, [user?._id]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin"></div>
        <p className="text-[var(--text-secondary)]">Initializing anonymous session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <h2 className="text-2xl">⚠️ Error</h2>
        <p className="text-[var(--text-secondary)]">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-8 px-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/dms" element={<DMList />} />
            <Route path="/dm/:userId" element={<DirectMessage />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
