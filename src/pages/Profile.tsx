import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, ShieldCheck, Check, Trash2, Key, RefreshCw, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInitials, getUserColor } from '../utils';

interface ProfileProps {
  user: { uid: string; displayName: string } | null;
  updateUserName: (name: string) => Promise<void>;
}

export const Profile: React.FC<ProfileProps> = ({ user, updateUserName }) => {
  const [profileNameInput, setProfileNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const authorName = user?.displayName || 'Citizen';
  const authorInitials = getInitials(authorName);
  const [avatarBg] = getUserColor(authorName);

  useEffect(() => {
    if (user?.displayName) {
      setProfileNameInput(user.displayName);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    const trimmedName = profileNameInput.trim();
    if (!trimmedName) {
      toast.error('Name cannot be empty');
      return;
    }
    if (trimmedName.length > 50) {
      toast.error('Name must be under 50 characters');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserName(trimmedName);
      toast.success('Profile updated!');
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLocalSession = () => {
    if (window.confirm('Are you sure you want to clear your cached local identity and reset local data?')) {
      localStorage.removeItem('civicly_username');
      toast.success('Local session data cleared. Refreshing page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleResetFlaggedPosts = () => {
    let cleared = 0;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('civicly_flagged_')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    toast.success(`Reset ${cleared} flagged post filters.`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="profile-card" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <div 
          className="user-avatar" 
          style={{ width: '56px', height: '56px', fontSize: '1.2rem', background: avatarBg }}
        >
          {authorInitials}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{authorName}</h2>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px', 
              padding: '2px 8px', 
              borderRadius: '9999px', 
              background: 'rgba(0, 186, 124, 0.12)', 
              color: 'var(--accent-success)', 
              fontSize: '0.75rem', 
              fontWeight: 600 
            }}>
              <ShieldCheck size={12} /> Active Citizen
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Civic Contributor • Reporting as {authorName}
          </p>
        </div>
      </div>

      {/* Anonymous ID Security Badge */}
      <div style={{ 
        background: 'var(--surface-color)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '10px', 
        padding: '14px 16px', 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Key size={18} color="var(--accent-primary)" />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Firebase Anonymous Session UID
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
              {user?.uid || 'Not Connected'}
            </div>
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)', background: 'rgba(0, 186, 124, 0.1)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
          Encrypted
        </span>
      </div>

      {/* Account Settings Form */}
      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Display Name
        </label>
        <input 
          type="text" 
          value={profileNameInput} 
          onChange={(e) => {
            if (e.target.value.length <= 50) {
              setProfileNameInput(e.target.value);
            }
          }}
          maxLength={50}
          className="standard-input"
          placeholder="Enter display name..."
          style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
          This name will be shown publicly on your reports unless submitted anonymously.
        </span>
      </div>

      <button 
        onClick={handleSaveProfile}
        disabled={isSaving}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '12px 24px', 
          fontWeight: 600, 
          marginBottom: '28px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--accent-primary)',
          color: '#ffffff',
          border: 'none',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          opacity: isSaving ? 0.7 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        <Check size={16} />
        {isSaving ? 'Saving...' : 'Save Profile'}
      </button>

      {/* Privacy & Data Management */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={15} color="var(--accent-primary)" /> Privacy & Data Rights (POPIA / GDPR)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleClearLocalSession}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trash2 size={16} color="#ef4444" />
              <span>Clear Cached Local Identity</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Reset localStorage</span>
          </button>

          <button
            onClick={handleResetFlaggedPosts}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshCw size={16} color="var(--accent-primary)" />
              <span>Reset Hidden Flagged Posts</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Restore feed filters</span>
          </button>
        </div>
      </div>

      {/* Legal & Policies */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 700 }}>
          Legal, Compliance & Safety
        </h3>
        <Link 
          to="/terms" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 500 }}>Legal, Privacy & Compliance Hub</span>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" />
        </Link>
      </div>
    </div>
  );
};

