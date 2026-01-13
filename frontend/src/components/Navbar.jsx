import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { HiHome, HiChatBubbleLeftRight, HiUser, HiShieldCheck, HiMoon, HiArrowRightOnRectangle, HiSparkles, HiBars3, HiXMark } from 'react-icons/hi2';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setShowProfileMenu(false);
  };

  const navItems = [
    { path: '/', label: 'Rooms', icon: HiHome },
    { path: '/dms', label: 'Messages', icon: HiChatBubbleLeftRight },
    { path: '/profile', label: 'Profile', icon: HiUser },
    { path: '/moderator', label: 'Moderator', icon: HiShieldCheck },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="mobile-header">
        <Link to="/" className="mobile-logo">
          <div className="logo-icon-wrapper">
            <HiMoon className="sidebar-logo-icon" />
          </div>
          <span className="logo-main">ShadowTalk</span>
        </Link>
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <HiXMark /> : <HiBars3 />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <div className="logo-icon-wrapper">
              <HiMoon className="sidebar-logo-icon" />
            </div>
            <div className="logo-text">
              <span className="logo-main">ShadowTalk</span>
              <span className="logo-tagline">Anonymous Chat</span>
            </div>
          </Link>
          <button 
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HiXMark />
          </button>
        </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-item-content">
                  <IconComponent className="nav-item-icon" />
                  <span>{item.label}</span>
                </div>
                {isActive && <div className="nav-item-indicator"></div>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Footer */}
      {user && (
        <div className="sidebar-footer">
          <div 
            className={`user-profile ${showProfileMenu ? 'menu-open' : ''}`}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="user-avatar">
              <span className="avatar-text">{user.nickname?.charAt(0).toUpperCase() || 'A'}</span>
              <div className="status-indicator online"></div>
            </div>
            <div className="user-info">
              <div className="user-name">
                {user.nickname || 'Anonymous'}
              </div>
              <div className="user-status">
                <div className="level-badge-small">
                  <HiSparkles className="level-icon" />
                  Level {user.reputation?.level || 1}
                </div>
              </div>
            </div>
          </div>
          
          {showProfileMenu && (
            <div className="profile-menu">
              <button onClick={handleLogout} className="profile-menu-item logout">
                <HiArrowRightOnRectangle className="menu-icon" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <IconComponent className="mobile-nav-icon" />
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;

