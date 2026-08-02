import React from 'react';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { Post } from '../../types';
import { NavLink } from 'react-router-dom';
import { Home, MapPin, User, AlertTriangle, Plus, Bell, Search } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  user: { uid: string; displayName: string } | null;
  posts: Post[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onOpenComposerModal?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  user,
  posts,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  activeFilter,
  onSelectFilter,
  onOpenComposerModal,
}) => {
  return (
    <div className="app-shell">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <AlertTriangle size={20} color="var(--accent-primary)" />
          <span className="mobile-title">Civicly</span>
        </div>
        <div className="mobile-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="standard-input"
              style={{ 
                width: '120px', 
                padding: '6px 8px 6px 26px', 
                fontSize: '0.8rem', 
                borderRadius: 'var(--radius-pill)', 
                background: 'var(--surface-color)', 
                color: 'var(--text-main)', 
                border: '1px solid var(--border-color)',
                outline: 'none'
              }}
            />
          </div>
          <span className="feed-badge">{posts.length} Reports</span>
        </div>
      </header>

      {/* Main 3-Column Grid Container */}
      <div className="layout-grid-container">
        {/* Left Navigation Sidebar */}
        <LeftSidebar 
          user={user} 
          onOpenComposerModal={onOpenComposerModal}
          activeFilter={activeFilter}
          onSelectFilter={onSelectFilter}
        />

        {/* Center Main Stage */}
        <main className="main-content-stage">
          {children}
        </main>

        {/* Right Intelligence Sidebar */}
        <RightSidebar 
          posts={posts}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>Feed</span>
        </NavLink>

        <NavLink to="/map" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <MapPin size={20} />
          <span>Map</span>
        </NavLink>

        <button 
          className="mobile-nav-item mobile-nav-action"
          onClick={() => {
            if (onOpenComposerModal) {
              onOpenComposerModal();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <Plus size={26} color="#ffffff" strokeWidth={2.5} />
        </button>

        <NavLink to="/alerts" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Bell size={20} />
          <span>Alerts</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};
