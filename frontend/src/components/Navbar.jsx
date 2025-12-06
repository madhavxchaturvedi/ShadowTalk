import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { HiHome, HiChatBubbleLeftRight, HiUser, HiShieldCheck, HiMoon, HiArrowRightOnRectangle } from 'react-icons/hi2';

const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    { path: '/', label: 'Rooms', icon: HiHome },
    { path: '/dms', label: 'Messages', icon: HiChatBubbleLeftRight },
    { path: '/profile', label: 'Profile', icon: HiUser },
    { path: '/moderator', label: 'Moderator', icon: HiShieldCheck },
  ];

  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <HiMoon className="sidebar-logo-icon" />
          <span>ShadowTalk</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <IconComponent className="nav-item-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Footer */}
      {user && (
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user.anonymousId?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="user-info">
              <div className="user-name">{user.anonymousId}</div>
              <div className="user-status">Level {user.reputation?.level || 1}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <HiArrowRightOnRectangle style={{ fontSize: '18px' }} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Navbar;
