import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileProps {
  user: { uid: string; displayName: string } | null;
  updateUserName: (name: string) => Promise<void>;
}

export const Profile: React.FC<ProfileProps> = ({ user, updateUserName }) => {
  const [profileNameInput, setProfileNameInput] = useState('');

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
    await updateUserName(trimmedName);
    toast.success('Profile updated!');
  };

  return (
    <div className="profile-card">
      <h2>Your Profile</h2>
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Display Name</label>
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
        />
      </div>
      <button 
        onClick={handleSaveProfile}
        className="btn-primary"
      >
        Save Profile
      </button>
      <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Reporting as: {user?.displayName || 'Citizen'}
      </p>

      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px', paddingTop: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '8px' }}>Legal & Policies</h3>
        <Link 
          to="/terms" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--accent-primary)" />
            <span>Privacy Policy & Terms of Service</span>
          </div>
          <ChevronRight size={14} color="var(--text-muted)" />
        </Link>
      </div>
    </div>
  );
};
