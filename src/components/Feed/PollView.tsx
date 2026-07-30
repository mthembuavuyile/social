import React, { useState, useEffect } from 'react';
import { PollOption } from '../../types';

interface PollViewProps {
  options: PollOption[];
  expiresAt?: number;
  onVote: (optionId: string) => void;
  userVotedId?: string | null;
}

export const PollView: React.FC<PollViewProps> = ({ options, expiresAt, onVote, userVotedId }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const isExpired = expiresAt ? Date.now() > expiresAt : false;
  const showResults = isExpired || !!userVotedId;
  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  useEffect(() => {
    if (!expiresAt || isExpired) {
      if (isExpired) setTimeLeft('Ended');
      return;
    }
    
    const updateTime = () => {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setTimeLeft('Ended');
        return false;
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m left`);
        return true;
      }
    };

    updateTime();
    const interval = setInterval(() => {
      if (!updateTime()) clearInterval(interval);
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, [expiresAt, isExpired]);

  return (
    <div style={{ margin: '16px 0', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <span style={{ fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Community Poll</span>
        <span>{isExpired ? 'Poll Ended' : timeLeft}</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map((opt) => {
          const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
          const isSelected = userVotedId === opt.id;
          
          if (showResults) {
            return (
              <div key={opt.id} style={{ position: 'relative', height: '40px', backgroundColor: 'var(--surface-hover)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                <div 
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percentage}%`, backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--border)', opacity: 0.3, transition: 'width 0.5s ease-in-out' }} 
                />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400 }}>
                  <span>{opt.text} {isSelected && '✓'}</span>
                  <span>{percentage}%</span>
                </div>
              </div>
            );
          }

          return (
            <button 
              key={opt.id} 
              onClick={() => onVote(opt.id)}
              style={{ width: '100%', textAlign: 'left', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.9rem', transition: 'border-color 0.2s ease, background-color 0.2s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      
      <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {totalVotes} votes
      </div>
    </div>
  );
};
