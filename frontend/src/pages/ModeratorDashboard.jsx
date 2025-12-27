import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  HiShieldCheck, 
  HiClock, 
  HiCheckCircle, 
  HiXCircle,
  HiExclamationTriangle,
  HiTrash,
  HiUserMinus,
  HiUserPlus
} from 'react-icons/hi2';
import api from '../services/api';

const ModeratorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [allReports, setAllReports] = useState([]); // All reports for stats
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, resolved, all

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Always fetch ALL reports for accurate stats
      const response = await api.get('/reports');
      console.log('📊 Reports data:', response.data.reports);
      setAllReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setAllReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter reports based on active tab
  const filteredReports = allReports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

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
    <div className="mod-dashboard">
      {/* Header */}
      <div className="mod-header">
        <div className="mod-header-content">
          <div className="mod-header-text">
            <div className="mod-title-row">
              <HiShieldCheck className="mod-title-icon" />
              <h1 className="mod-title">Moderation Dashboard</h1>
            </div>
            <p className="mod-subtitle">Review and manage reported content</p>
          </div>
          
          {/* Stats */}
          <div className="mod-stats">
            <div className="mod-stat-card">
              <div className="mod-stat-icon mod-stat-pending">
                <HiClock />
              </div>
              <div className="mod-stat-info">
                <div className="mod-stat-value">
                  {allReports.filter(r => r.status === 'pending').length}
                </div>
                <div className="mod-stat-label">Pending</div>
              </div>
            </div>
            <div className="mod-stat-card">
              <div className="mod-stat-icon mod-stat-resolved">
                <HiCheckCircle />
              </div>
              <div className="mod-stat-info">
                <div className="mod-stat-value">
                  {allReports.filter(r => r.status === 'resolved').length}
                </div>
                <div className="mod-stat-label">Resolved</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mod-main">
        {/* Filter Tabs */}
        <div className="mod-tabs">
          {['pending', 'resolved', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`mod-tab ${filter === tab ? 'active' : ''}`}
            >
              {tab === 'pending' && <HiClock />}
              {tab === 'resolved' && <HiCheckCircle />}
              {tab === 'all' && <HiShieldCheck />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="mod-loading">
            <div className="spinner"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="mod-empty-state">
            <div className="mod-empty-icon">
              <HiShieldCheck />
            </div>
            <h3 className="mod-empty-title">No {filter !== 'all' && filter} reports</h3>
            <p className="mod-empty-text">
              {filter === 'pending' 
                ? 'All reports have been reviewed'
                : 'No reports found in this category'}
            </p>
          </div>
        ) : (
          <div className="mod-reports-list">
            {filteredReports.map((report) => (
              <div key={report._id} className="mod-report-card">
                {/* Report Header */}
                <div className="mod-report-header">
                  <div className="mod-report-meta">
                    <span className={`mod-reason-badge mod-reason-${report.reason}`}>
                      <HiExclamationTriangle />
                      {report.reason}
                    </span>
                    <span className="mod-report-time">
                      {formatDate(report.createdAt)}
                    </span>
                  </div>
                  
                  <div className="mod-report-actions">
                    {report.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleResolve(report._id, 'delete')}
                          className="mod-action-btn mod-action-danger"
                          title={report.reportedMessage ? 'Delete Content' : 'Suspend User'}
                        >
                          {report.reportedMessage ? <HiTrash /> : <HiUserMinus />}
                          {report.reportedMessage ? 'Delete' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleResolve(report._id, 'ignore')}
                          className="mod-action-btn mod-action-secondary"
                        >
                          <HiXCircle />
                          Ignore
                        </button>
                      </>
                    ) : (
                      <div className="mod-status-badge mod-status-resolved">
                        <HiCheckCircle />
                        Resolved
                      </div>
                    )}
                  </div>
                </div>

                {/* Report Content */}
                <div className="mod-report-content">
                  {/* Reporter Info */}
                  <div className="mod-info-section">
                    <div className="mod-info-label">Reported by:</div>
                    <div className="mod-info-value">
                      {report.reporter?.nickname || report.reporter?.anonymousId || 'Unknown'}
                    </div>
                  </div>

                  {/* Reported Message */}
                  {report.reportedMessage && (
                    <div className="mod-info-section">
                      <div className="mod-info-label">Message content:</div>
                      <div className="mod-message-box">
                        <div className="mod-message-sender">
                          From: {report.reportedMessage.sender?.nickname || report.reportedMessage.sender?.anonymousId || 'Unknown'}
                        </div>
                        <div className="mod-message-content">
                          {report.reportedMessage.content}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reported User */}
                  {report.reportedUser && (
                    <div className="mod-info-section">
                      <div className="mod-info-label">Reported user:</div>
                      <div className="mod-user-info">
                        <span className="mod-info-value">
                          {report.reportedUser.nickname || report.reportedUser.anonymousId}
                        </span>
                        {report.reportedUser.suspended && (
                          <span className="mod-user-badge mod-user-suspended">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                      {report.reportedUser.suspended && (
                        <button
                          onClick={() => handleUnsuspend(report.reportedUser._id)}
                          className="mod-unsuspend-btn"
                        >
                          <HiUserPlus />
                          Unsuspend User
                        </button>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {report.description && (
                    <div className="mod-info-section">
                      <div className="mod-info-label">Description:</div>
                      <div className="mod-info-text">{report.description}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorDashboard;
