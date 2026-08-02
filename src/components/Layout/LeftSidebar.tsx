import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  ShieldCheck, 
  PlusCircle,
  Activity,
  Shield,
  Phone
} from 'lucide-react';
import { getInitials, getUserColor } from '../../utils';

interface LeftSidebarProps {
  user: { uid: string; displayName: string } | null;
  onOpenComposerModal?: () => void;
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  user,
  onOpenComposerModal,
  activeFilter = 'all',
  onSelectFilter,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const authorName = user?.displayName || 'Citizen';
  const authorInitials = getInitials(authorName);
  const [avatarBg] = getUserColor(authorName);

  return (
    <aside className="left-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <AlertTriangle size={24} color="var(--accent-primary)" />
        </div>
        <div className="brand-text">
          <span className="brand-title">Civicly</span>
          <span className="brand-tagline">Civic Intelligence</span>
        </div>
      </div>

      {/* Primary Navigation Menu */}
      <nav className="sidebar-nav">
        <div style={{ marginTop: '8px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, paddingLeft: '16px', marginBottom: '8px', letterSpacing: '0.05em' }}>Civic Hub</div>
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `sidebar-link ${isActive && activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onSelectFilter?.('all')}
        >
          <Home size={20} />
          <span>Home Feed</span>
        </NavLink>

        <button 
          className={`sidebar-link btn-link ${isHome && activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => { onSelectFilter?.('active'); navigate('/'); }}
        >
          <AlertTriangle size={20} color="#f4212e" />
          <span>Open Issues</span>
        </button>

        <button 
          className={`sidebar-link btn-link ${isHome && activeFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => { onSelectFilter?.('resolved'); navigate('/'); }}
        >
          <CheckCircle2 size={20} color="var(--accent-success)" />
          <span>Resolved</span>
        </button>

        <NavLink 
          to="/map" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <MapPin size={20} />
          <span>Interactive Map</span>
        </NavLink>

        <div style={{ marginTop: '24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, paddingLeft: '16px', marginBottom: '8px', letterSpacing: '0.05em' }}>Safety & Crime</div>
        
        <button 
          className={`sidebar-link btn-link ${isHome && activeFilter === 'crime' ? 'active' : ''}`}
          onClick={() => { onSelectFilter?.('crime'); navigate('/'); }}
        >
          <Shield size={20} color="#dc2626" />
          <span>Crime Reports</span>
        </button>
        
        <button 
          className={`sidebar-link btn-link ${isHome && activeFilter === 'urgent' ? 'active' : ''}`}
          onClick={() => { onSelectFilter?.('urgent'); navigate('/'); }}
        >
          <Activity size={20} color="#ff9a00" />
          <span>High Urgency</span>
        </button>

        <NavLink 
          to="/emergency" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Phone size={20} color="#dc2626" />
          <span>Emergency Lines</span>
        </NavLink>

        <div style={{ marginTop: '24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, paddingLeft: '16px', marginBottom: '8px', letterSpacing: '0.05em' }}>Account</div>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Profile & Reports</span>
        </NavLink>

        <a 
          href="/about" 
          className="sidebar-link"
        >
          <ShieldCheck size={20} />
          <span>About Civicly</span>
        </a>

        <NavLink 
          to="/terms" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <ShieldCheck size={20} />
          <span>Terms & Privacy</span>
        </NavLink>
      </nav>

      {/* Primary Action Call to Action */}
      <div className="sidebar-action">
        <button 
          className="btn-report-primary"
          onClick={() => {
            if (onOpenComposerModal) {
              onOpenComposerModal();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <PlusCircle size={20} />
          <span>Report Civic Issue</span>
        </button>
      </div>

      {/* User Footer Profile */}
      <div className="sidebar-user-footer">
        <div 
          className="user-avatar" 
          style={{ background: avatarBg, width: '38px', height: '38px', borderRadius: '50%' }}
        >
          {authorInitials}
        </div>
        <div className="user-info">
          <span className="user-name">{authorName}</span>
          <span className="user-role">Community Member</span>
        </div>
      </div>
    </aside>
  );
};
