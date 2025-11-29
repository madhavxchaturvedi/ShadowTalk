import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import { initializeSession } from './store/slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeSession());
  }, [dispatch]);

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
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
