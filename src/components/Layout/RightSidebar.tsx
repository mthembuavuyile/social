import React from 'react';
import { Search, TrendingUp, Map, Filter } from 'lucide-react';
import { Post } from '../../types';
import { useNavigate } from 'react-router-dom';
import { EmergencyWidget } from './EmergencyWidget';

interface RightSidebarProps {
  posts: Post[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  posts,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
}) => {
  const navigate = useNavigate();

  // Dynamic Civic Stats Calculation
  const totalPosts = posts.length;
  const resolvedPosts = posts.filter(p => p.status === 'resolved').length;
  const activePosts = posts.filter(p => p.status === 'active' || !p.status).length;
  const inProgressPosts = posts.filter(p => p.status === 'in_progress').length;
  const crimeReports = posts.filter(p => p.reportType === 'crime').length;
  const civicReports = totalPosts - crimeReports;
  
  const resolutionRate = totalPosts > 0 ? Math.round((resolvedPosts / totalPosts) * 100) : 0;

  const categories = [
    { id: 'all', label: 'All Categories', icon: '🌐' },
    { id: 'pothole', label: 'Pothole', icon: '🕳️' },
    { id: 'water_leak', label: 'Water Leak', icon: '💧' },
    { id: 'electricity', label: 'Electricity', icon: '⚡' },
    { id: 'sewage', label: 'Sewage', icon: '⚠️' },
    { id: 'traffic_light', label: 'Traffic Light', icon: '🚦' },
    { id: 'other', label: 'Other Infrastructure', icon: '🏗️' },
    { id: 'theft', label: 'Theft', icon: '🔓' },
    { id: 'robbery', label: 'Robbery', icon: '🔪' },
    { id: 'assault', label: 'Assault', icon: '🚨' },
    { id: 'burglary', label: 'Burglary', icon: '🏠' },
    { id: 'vandalism', label: 'Vandalism', icon: '💥' },
    { id: 'hijacking', label: 'Hijacking', icon: '🚗' },
    { id: 'drug_activity', label: 'Drug Activity', icon: '💊' },
    { id: 'fraud', label: 'Fraud', icon: '📋' },
    { id: 'domestic_violence', label: 'Domestic Violence', icon: '🤝' },
    { id: 'crime_other', label: 'Other Crime', icon: '🔍' },
  ];

  return (
    <aside className="right-sidebar">
      {/* Search Input Bar */}
      <div className="sidebar-search-box">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search location or keyword..." 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={() => onSearchChange('')}>
            ✕
          </button>
        )}
      </div>

      {/* Civic Intelligence Stats Card */}
      <div className="sidebar-widget stats-widget">
        <div className="widget-header">
          <TrendingUp size={18} color="var(--accent-primary)" />
          <h3>Community Pulse</h3>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{totalPosts}</span>
            <span className="stat-label">Total Reports</span>
          </div>
          <div className="stat-card">
            <span className="stat-value highlight-success">{resolutionRate}%</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>

        <div className="status-progress-bar">
          <div 
            className="progress-fill resolved-fill" 
            style={{ width: `${(resolvedPosts / (totalPosts || 1)) * 100}%` }} 
            title={`Resolved: ${resolvedPosts}`}
          />
          <div 
            className="progress-fill progress-fill-active" 
            style={{ width: `${(inProgressPosts / (totalPosts || 1)) * 100}%` }}
            title={`In Progress: ${inProgressPosts}`} 
          />
          <div 
            className="progress-fill active-fill" 
            style={{ width: `${(activePosts / (totalPosts || 1)) * 100}%` }}
            title={`Open: ${activePosts}`} 
          />
        </div>

        <div className="stats-breakdown">
          <div className="breakdown-item">
            <span className="dot dot-red"></span>
            <span>Open: <strong>{activePosts}</strong></span>
          </div>
          <div className="breakdown-item">
            <span className="dot dot-orange"></span>
            <span>In Progress: <strong>{inProgressPosts}</strong></span>
          </div>
          <div className="breakdown-item">
            <span className="dot dot-green"></span>
            <span>Resolved: <strong>{resolvedPosts}</strong></span>
          </div>
        </div>

        {crimeReports > 0 && (
          <div className="stats-breakdown" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <div className="breakdown-item">
              <span className="dot" style={{ background: '#dc2626' }}></span>
              <span>Crime Reports: <strong>{crimeReports}</strong></span>
            </div>
            <div className="breakdown-item">
              <span className="dot" style={{ background: 'var(--accent-primary)' }}></span>
              <span>Civic Issues: <strong>{civicReports}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Map Quick Card */}
      <div className="sidebar-widget map-widget-card" onClick={() => navigate('/map')}>
        <div className="map-widget-bg">
          <Map size={32} color="var(--accent-primary)" />
          <span>Explore Live Issue Map</span>
        </div>
        <div className="map-widget-footer">
          <span>View {totalPosts} reports on interactive map &rarr;</span>
        </div>
      </div>

      {/* Category Quick Filters */}
      <div className="sidebar-widget categories-widget">
        <div className="widget-header">
          <Filter size={18} color="var(--accent-primary)" />
          <h3>Filter by Issue Type</h3>
        </div>

        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span className="pill-icon">{cat.icon}</span>
              <span className="pill-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Numbers Widget */}
      <EmergencyWidget />
    </aside>
  );
};
