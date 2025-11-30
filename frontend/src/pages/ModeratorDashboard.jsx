import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

const ModeratorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, resolved, all

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports?status=${filter === 'all' ? '' : filter}`);
      console.log('📊 Reports data:', response.data.reports);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId, action) => {
    try {
      await api.patch(`/reports/${reportId}`, { status: 'resolved', action });
      fetchReports();
    } catch (error) {
      console.error('Failed to resolve report:', error);
    }
  };

  const handleUnsuspend = async (userId) => {
    try {
      await api.post(`/reports/unsuspend/${userId}`);
      alert('User unsuspended successfully');
      fetchReports();
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
      alert('Failed to unsuspend user');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonBadge = (reason) => {
    const colors = {
      spam: 'bg-yellow-500',
      harassment: 'bg-red-500',
      inappropriate: 'bg-orange-500',
      other: 'bg-gray-500',
    };
    return colors[reason] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto px-4 mt-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Moderation Dashboard</h1>
        <p className="text-[var(--text-secondary)]">
          Review and manage reported content
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
        {['pending', 'resolved', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-3 font-medium capitalize transition-colors ${
              filter === tab
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-12 text-center">
          <p className="text-[var(--text-secondary)]">
            No {filter !== 'all' && filter} reports found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getReasonBadge(report.reason)}`}>
                    {report.reason}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {formatDate(report.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {report.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleResolve(report._id, 'delete')}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm transition-colors"
                      >
                        {report.reportedMessage ? 'Delete Content' : 'Suspend User'}
                      </button>
                      <button
                        onClick={() => handleResolve(report._id, 'ignore')}
                        className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] rounded-lg text-white text-sm transition-colors"
                      >
                        Ignore
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1 bg-green-500 rounded-full text-xs font-medium text-white">
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-[var(--text-secondary)] mb-1">Reported by:</div>
                  <div className="font-medium">{report.reporter?.anonymousId || 'Unknown'}</div>
                </div>

                {report.reportedMessage && (
                  <div>
                    <div className="text-sm text-[var(--text-secondary)] mb-1">Message content:</div>
                    <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded p-3">
                      <div className="text-sm text-[var(--text-secondary)] mb-1">
                        From: {report.reportedMessage.sender?.anonymousId || 'Unknown'}
                      </div>
                      <div>{report.reportedMessage.content}</div>
                    </div>
                  </div>
                )}

                {report.reportedUser && (
                  <div>
                    <div className="text-sm text-[var(--text-secondary)] mb-1">Reported user:</div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{report.reportedUser.anonymousId}</div>
                      {report.reportedUser.suspended && (
                        <span className="px-2 py-1 bg-red-500 rounded text-xs font-medium text-white">
                          SUSPENDED
                        </span>
                      )}
                    </div>
                    {report.reportedUser.suspended && (
                      <button
                        onClick={() => handleUnsuspend(report.reportedUser._id)}
                        className="mt-2 px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-white text-sm transition-colors"
                      >
                        Unsuspend User
                      </button>
                    )}
                  </div>
                )}

                {report.description && (
                  <div>
                    <div className="text-sm text-[var(--text-secondary)] mb-1">Description:</div>
                    <div className="text-sm">{report.description}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeratorDashboard;
