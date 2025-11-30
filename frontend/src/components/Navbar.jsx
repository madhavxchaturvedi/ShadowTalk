import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-12 py-5">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
          🌑 ShadowTalk
        </Link>

        <div className="flex items-center gap-8">
          <Link 
            to="/" 
            className="text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            Rooms
          </Link>
          {user && (
            <>
              <Link 
                to="/dms" 
                className="text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                Messages
              </Link>
              <Link 
                to="/profile" 
                className="text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                Profile
              </Link>
              <span className="text-[var(--accent)] font-medium">
                {user.anonymousId}
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-[var(--bg-tertiary)] text-white border border-[var(--border)] rounded-md hover:bg-[var(--danger)] hover:border-[var(--danger)] transition-all"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
