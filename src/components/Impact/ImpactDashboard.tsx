import React from 'react';
import { Post } from '../../types';

interface ImpactDashboardProps {
  posts: Post[];
  onlineCount: number;
}

export const ImpactDashboard: React.FC<ImpactDashboardProps> = ({
  posts,
  onlineCount,
}) => {
  // Calculate stats
  const civicPosts = posts.filter(p => (p.postTrack || 'civic') === 'civic');
  const gigPosts = posts.filter(p => p.postTrack === 'gig');
  const projectPosts = posts.filter(p => p.postTrack === 'project');

  const totalResolved = posts.filter(p => p.status === 'resolved_complete').length;
  const totalInProgress = posts.filter(p => p.status === 'in_progress').length;

  const totalRaised = posts.reduce((sum, p) => sum + (p.bountyRaised || 0), 0);
  const totalBackers = new Set(
    posts.flatMap(p => Object.keys(p.backers || {}))
  ).size;

  const gigsCompleted = gigPosts.filter(p => p.status === 'resolved_complete').length;

  // Top locations
  const locationMap: Record<string, number> = {};
  posts.forEach(p => {
    if (p.location) {
      const loc = p.location.split(',').pop()?.trim() || p.location;
      locationMap[loc] = (locationMap[loc] || 0) + 1;
    }
  });
  const topLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Most backed project
  const mostBackedProject = [...posts]
    .filter(p => (p.bountyRaised || 0) > 0)
    .sort((a, b) => (b.bountyRaised || 0) - (a.bountyRaised || 0))[0];

  return (
    <div className="impact-dashboard">
      <div className="impact-hero">
        <div className="impact-hero-title">🇿🇦 UbuntuFix Impact Dashboard</div>
        <div className="impact-hero-subtitle">
          South Africa solving South Africa's problems — in real time
        </div>
      </div>

      <div className="impact-stats-grid">
        <div className="impact-stat-card">
          <span className="impact-stat-icon">🤝</span>
          <span className="impact-stat-value">{civicPosts.length}</span>
          <span className="impact-stat-label">Civic Issues</span>
        </div>
        <div className="impact-stat-card">
          <span className="impact-stat-icon">🔧</span>
          <span className="impact-stat-value">{gigPosts.length}</span>
          <span className="impact-stat-label">Gigs Posted</span>
        </div>
        <div className="impact-stat-card">
          <span className="impact-stat-icon">🌍</span>
          <span className="impact-stat-value">{projectPosts.length}</span>
          <span className="impact-stat-label">Projects</span>
        </div>
        <div className="impact-stat-card">
          <span className="impact-stat-icon">✅</span>
          <span className="impact-stat-value">{totalResolved}</span>
          <span className="impact-stat-label">Issues Fixed</span>
        </div>
        <div className="impact-stat-card">
          <span className="impact-stat-icon">💰</span>
          <span className="impact-stat-value" style={{ color: 'var(--accent-success)' }}>
            R{totalRaised.toLocaleString()}
          </span>
          <span className="impact-stat-label">Total Raised</span>
        </div>
        <div className="impact-stat-card">
          <span className="impact-stat-icon">👥</span>
          <span className="impact-stat-value">{onlineCount}</span>
          <span className="impact-stat-label">Active Now</span>
        </div>
      </div>

      {mostBackedProject && (
        <div className="impact-highlight-card">
          <div className="impact-highlight-title">
            🔥 Most Backed Campaign
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span className={`track-badge track-badge-${mostBackedProject.postTrack || 'civic'}`}>
              {mostBackedProject.postTrack || 'civic'}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
            {mostBackedProject.content.slice(0, 100)}{mostBackedProject.content.length > 100 ? '…' : ''}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.82rem' }}>
            <span>
              <strong style={{ color: 'var(--accent-success)' }}>
                R{(mostBackedProject.bountyRaised || 0).toLocaleString()}
              </strong>{' '}
              raised
            </span>
            <span>
              {Object.keys(mostBackedProject.backers || {}).length} backers
            </span>
            {mostBackedProject.location && (
              <span style={{ color: 'var(--text-muted)' }}>
                📍 {mostBackedProject.location}
              </span>
            )}
          </div>
        </div>
      )}

      {topLocations.length > 0 && (
        <div className="impact-highlight-card">
          <div className="impact-highlight-title">📍 Most Active Areas</div>
          {topLocations.map(([loc, count]) => (
            <div key={loc} className="stat-row">
              <span>{loc}</span>
              <strong>{count} reports</strong>
            </div>
          ))}
        </div>
      )}

      <div className="impact-highlight-card">
        <div className="impact-highlight-title">📊 Activity Summary</div>
        <div className="stat-row">
          <span>Active Repairs In Progress</span>
          <strong>{totalInProgress}</strong>
        </div>
        <div className="stat-row">
          <span>Gigs Completed</span>
          <strong>{gigsCompleted}</strong>
        </div>
        <div className="stat-row">
          <span>Unique Backers / Donors</span>
          <strong>{totalBackers}</strong>
        </div>
        <div className="stat-row">
          <span>Total Posts</span>
          <strong>{posts.length}</strong>
        </div>
      </div>
    </div>
  );
};
