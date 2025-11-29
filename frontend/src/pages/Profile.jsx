import { useSelector } from 'react-redux';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return (
      <div className="text-center py-8 text-[var(--text-secondary)]">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 mt-8 max-w-7xl">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] p-12 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <div className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
            Anonymous User
          </div>
        </div>

        <div className="p-12">
          <div className="mb-8">
            <h2 className="text-xl mb-4 text-[var(--text-secondary)]">Identity</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-3 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Anonymous ID:</span>
                <span className="font-medium">{user.anonymousId}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Member Since:</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl mb-4 text-[var(--text-secondary)]">Reputation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg p-8 flex items-center gap-6">
                <div className="text-4xl">⭐</div>
                <div>
                  <div className="text-3xl font-bold">{user.reputation?.level || 1}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Level</div>
                </div>
              </div>
              <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg p-8 flex items-center gap-6">
                <div className="text-4xl">💎</div>
                <div>
                  <div className="text-3xl font-bold">{user.reputation?.points || 0}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Points</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl mb-4 text-[var(--text-secondary)]">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {user.reputation?.badges && user.reputation.badges.length > 0 ? (
                user.reputation.badges.map((badge, index) => (
                  <div 
                    key={index} 
                    className="bg-[var(--accent)] text-white px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {badge}
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-secondary)] italic">
                  No badges yet. Start participating to earn badges!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
