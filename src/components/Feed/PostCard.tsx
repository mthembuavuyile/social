import React, { useState } from 'react';
import { Post } from '../../types';
import { getInitials, getUserColor, timeAgo, formatRichTextReact, extractTwitterUrlFromText } from '../../utils';
import { ThumbsUp, MapPin, Clock, Trash2, CheckCircle2, AlertTriangle, Share2, Check, ExternalLink, Link2 } from 'lucide-react';
import { TwitterEmbed } from './TwitterEmbed';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
  user: { uid: string; displayName: string } | null;
  onToggleReaction: (postId: string, emoji: string) => void;
  onDeletePost: (postId: string) => void;
  onUpdateStatus: (postId: string, status: 'active' | 'in_progress' | 'resolved') => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  user,
  onToggleReaction,
  onDeletePost,
  onUpdateStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const totalUpvotes = post.reactions?.['👍'] || 0;
  const myUpvote = user && post.userReactions?.['👍'] === '👍';
  const isOwner = user?.uid === post.authorUid;

  const authorInitials = getInitials(post.author);
  const [ac1] = getUserColor(post.author);

  const categoryLabels: Record<string, string> = {
    pothole: '🕳️ Pothole',
    water_leak: '💧 Water Leak',
    electricity: '⚡ Electricity Outage',
    sewage: '⚠️ Sewage Overflow',
    traffic_light: '🚦 Broken Robot',
    other: '🏗️ Other Issue',
  };

  const statusColors: Record<string, string> = {
    active: 'status-open',
    in_progress: 'status-progress',
    resolved: 'status-completed',
  };
  
  const statusLabels: Record<string, string> = {
    active: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
  };

  const twitterUrl = post.socialUrl || extractTwitterUrlFromText(post.content);
  const directPostUrl = `${window.location.origin}/post/${post.id}`;

  const handleShare = async () => {
    const shareData = {
      title: `Civicly Report: ${post.category || 'Issue'}`,
      text: post.content.substring(0, 100) + '...',
      url: directPostUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(directPostUrl);
    setCopied(true);
    toast.success('Exact post link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="post-card" id={`post-${post.id}`}>
      {/* Header Info */}
      <div className="post-header">
        <div className="post-author-info">
          <div className="user-avatar" style={{ background: ac1 }}>
            {authorInitials}
          </div>
          <div className="post-meta">
            <div className="post-author-name">{post.author}</div>
            <Link to={`/post/${post.id}`} className="post-timestamp-link">
              <Clock size={12} />
              <span>{timeAgo(post.timestamp)}</span>
            </Link>
          </div>
        </div>

        <div className="post-header-actions">
          <span className={`status-badge ${statusColors[post.status || 'active']}`}>
            {post.status === 'resolved' ? (
              <CheckCircle2 size={12} />
            ) : post.status === 'active' ? (
              <AlertTriangle size={12} />
            ) : (
              <div className="status-dot"></div>
            )}
            {statusLabels[post.status || 'active']}
          </span>

          <Link 
            to={`/post/${post.id}`} 
            className="btn-icon-secondary" 
            title="Open Dedicated Post Page"
          >
            <Link2 size={15} />
          </Link>

          {isOwner && (
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                  onDeletePost(post.id);
                }
              }} 
              className="btn-icon-danger"
              title="Delete Report"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Civic Meta Info Chips */}
      <div className="civic-meta-row">
        {post.category && (
          <span className="category-chip">
            {categoryLabels[post.category] || post.category}
          </span>
        )}
        {post.location && (
          <span className="location-chip">
            <MapPin size={12} /> {post.location}
          </span>
        )}
      </div>

      {/* Main Issue Content */}
      <div className="post-content-body">
        {formatRichTextReact(post.content)}
      </div>

      {/* Embedded Social Media Preview */}
      {twitterUrl && (
        <TwitterEmbed url={twitterUrl} />
      )}

      {/* Image Attachment */}
      {post.imageUrl && (
        <div className="post-image-container">
          <img src={post.imageUrl} alt="Civic Issue" className="post-image" />
          <div className="image-source-meta">
            <ExternalLink size={12} />
            <a 
              href={post.imageUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="image-link"
            >
              View Full Attachment Photo
            </a>
          </div>
        </div>
      )}

      {/* Owner Status Management Bar */}
      {isOwner && (
        <div className="status-management-bar">
          <span className="bar-label">Update Status:</span>
          <div className="bar-buttons">
            <button 
              onClick={() => onUpdateStatus(post.id, 'active')} 
              disabled={post.status === 'active'}
              className={`status-btn ${post.status === 'active' ? 'active-open' : ''}`}
            >
              Open
            </button>
            <button 
              onClick={() => onUpdateStatus(post.id, 'in_progress')} 
              disabled={post.status === 'in_progress'}
              className={`status-btn ${post.status === 'in_progress' ? 'active-progress' : ''}`}
            >
              In Progress
            </button>
            <button 
              onClick={() => onUpdateStatus(post.id, 'resolved')} 
              disabled={post.status === 'resolved'}
              className={`status-btn ${post.status === 'resolved' ? 'active-resolved' : ''}`}
            >
              Resolved
            </button>
          </div>
        </div>
      )}

      {/* Post Action Footer Toolbar */}
      <div className="post-actions-bar">
        <button 
          onClick={() => { if (user) onToggleReaction(post.id, '👍'); }} 
          className={`action-btn upvote-btn ${myUpvote ? 'upvoted' : ''}`}
          title="Endorse & Confirm Urgency"
        >
          <ThumbsUp size={16} />
          <span>{myUpvote ? 'Endorsed' : 'Endorse Issue'}</span>
          <span className="upvote-count-badge">{totalUpvotes}</span>
        </button>

        <button 
          onClick={handleShare}
          className="action-btn share-btn"
          title="Share Exact Post Link"
        >
          {copied ? <Check size={16} color="var(--accent-success)" /> : <Share2 size={16} />}
          <span>{copied ? 'Link Copied!' : 'Share Post Link'}</span>
        </button>
      </div>
    </article>
  );
};
