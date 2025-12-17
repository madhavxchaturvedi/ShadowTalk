const SkeletonLoader = ({ type = 'message', count = 3 }) => {
  if (type === 'message') {
    return (
      <div className="skeleton-container">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="skeleton-message">
            <div className="skeleton skeleton-avatar"></div>
            <div className="skeleton-content">
              <div className="skeleton skeleton-line short"></div>
              <div className="skeleton skeleton-line long"></div>
              <div className="skeleton skeleton-line medium"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="skeleton-container">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="skeleton skeleton-card"></div>
        ))}
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
