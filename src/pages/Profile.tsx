import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, ShieldCheck, Check } from 'lucide-react';
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

  return (
    <div className="profile-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
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
          className="form-input"
          placeholder="Enter display name..."
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
          This name will be shown publicly on your reports unless submitted anonymously.
        </span>
      </div>

      <button 
        onClick={handleSaveProfile}
        disabled={isSaving}
        className="btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}
      >
        <Check size={16} />
        {isSaving ? 'Saving...' : 'Save Profile'}
      </button>

      {/* Legal & Policies */}
      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '28px', paddingTop: '20px' }}>
        <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 700 }}>
          Legal & Policies
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
            <span style={{ fontWeight: 500 }}>Privacy Policy & Terms of Service</span>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" />
        </Link>
      </div>
    </div>
  );
};
