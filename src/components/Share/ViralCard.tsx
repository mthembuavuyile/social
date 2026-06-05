import React, { useState } from 'react';
import { Post } from '../../types';
import { X, Share2, Copy, Check } from 'lucide-react';

interface ViralCardProps {
  post: Post;
  onClose: () => void;
}

export const ViralCard: React.FC<ViralCardProps> = ({ post, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
  const track = post.postTrack || 'civic';
  const raised = post.bountyRaised || 0;
  const goal = post.bountyGoal || post.compensationValue || 500;
  const pct = Math.min(100, (raised / goal) * 100);
  const backerCount = Object.keys(post.backers || {}).length;
  const title = post.content.slice(0, 120) + (post.content.length > 120 ? '…' : '');

  const trackLabels: Record<string, string> = {
    civic: '🤝 Civic Action',
    gig: '🔧 Gig / Service',
    project: '🌍 Community Project',
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `🇿🇦 UbuntuFix: ${title}\n\n💰 R${raised.toLocaleString()} / R${goal.toLocaleString()} raised\n👥 ${backerCount} backers\n📍 ${post.location || 'South Africa'}\n\nSupport this cause: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `🇿🇦 ${title}\n\n💰 R${raised.toLocaleString()} raised on @UbuntuFix\n\nSupport this cause 👇`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="viral-modal-overlay" onClick={onClose}>
      <button className="viral-close-btn" onClick={onClose}>
        <X size={18} />
      </button>

      <div className="viral-card" onClick={(e) => e.stopPropagation()}>
        {post.imageUrl && (
          <img
            className="viral-card-image"
            src={post.imageUrl}
            alt="Campaign"
          />
        )}

        <div className="viral-card-body">
          <div className="viral-card-track">
            <span className={`track-badge track-badge-${track}`}>
              {trackLabels[track] || track}
            </span>
          </div>

          <div className="viral-card-title">{title}</div>

          {post.location && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📍 {post.location}
            </div>
          )}

          {(post.isCrowdfunded || track === 'project') && (
            <div className="viral-progress-section">
              <div className="viral-progress-labels">
                <span className="viral-progress-raised">
                  R{raised.toLocaleString()} raised
                </span>
                <span className="viral-progress-goal">
                  of R{goal.toLocaleString()}
                </span>
              </div>
              <div className="viral-progress-bar">
                <div
                  className="viral-progress-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="viral-stats-row">
                <div className="viral-stat">
                  <span className="viral-stat-value">{backerCount}</span>
                  <span className="viral-stat-label">Backers</span>
                </div>
                <div className="viral-stat">
                  <span className="viral-stat-value">{Math.round(pct)}%</span>
                  <span className="viral-stat-label">Funded</span>
                </div>
                {post.milestones && (
                  <div className="viral-stat">
                    <span className="viral-stat-value">
                      {post.milestones.filter(m => m.completed).length}/{post.milestones.length}
                    </span>
                    <span className="viral-stat-label">Milestones</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {track === 'gig' && (
            <div style={{ marginBottom: '16px' }}>
              <span className="gig-price-badge">R{post.gigPrice || post.compensationValue || 0}</span>
            </div>
          )}
        </div>

        <div className="viral-card-actions">
          <div className="viral-share-row">
            <button className="btn-whatsapp" onClick={handleShareWhatsApp}>
              <Share2 size={14} />
              WhatsApp
            </button>
            <button className="btn-twitter-share" onClick={handleShareTwitter}>
              <Share2 size={14} />
              𝕏 / Twitter
            </button>
          </div>
          <button
            className="btn-cancel"
            onClick={handleCopyLink}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            {isCopied ? 'Link Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
