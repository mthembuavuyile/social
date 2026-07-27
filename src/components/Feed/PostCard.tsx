import React from 'react';
import { Post } from '../../types';
import { getInitials, getUserColor, timeAgo, formatRichTextReact, extractTwitterUrlFromText } from '../../utils';
import { ThumbsUp, MapPin, Clock, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TwitterEmbed } from './TwitterEmbed';

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
  const totalUpvotes = post.reactions?.['👍'] || 0;
  const myUpvote = user && post.userReactions?.['👍'] === '👍';
  const isOwner = user?.uid === post.authorUid;

  const authorInitials = getInitials(post.author);
  const [ac1] = getUserColor(post.author);

  const categoryLabels: Record<string, string> = {
    pothole: 'Pothole',
    water_leak: 'Water Leak',
    electricity: 'Electricity Outage',
    sewage: 'Sewage Overflow',
    traffic_light: 'Broken Robot',
    other: 'Other Issue',
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

  return (
    <article className="post-card" style={{ padding: '16px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
      <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="post-author-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: ac1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            {authorInitials}
          </div>
          <div className="post-meta">
            <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{post.author}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Clock size={12} />
              <span>{timeAgo(post.timestamp)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`status-badge ${statusColors[post.status || 'active']}`} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {post.status === 'resolved' ? <CheckCircle2 size={12} /> : post.status === 'active' ? <AlertTriangle size={12} /> : <div className="status-dot"></div>}
            {statusLabels[post.status || 'active']}
          </span>
          {isOwner && (
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                  onDeletePost(post.id);
                }
              }} 
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }} 
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="civic-meta-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {post.category && (
          <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(29, 155, 240, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(29, 155, 240, 0.2)' }}>
            {categoryLabels[post.category] || post.category}
          </span>
        )}
        {post.location && (
          <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {post.location}
          </span>
        )}
      </div>

      <div className="post-content" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)', marginBottom: '12px' }}>
        {formatRichTextReact(post.content)}
      </div>

      {twitterUrl && (
        <TwitterEmbed url={twitterUrl} />
      )}

      {post.imageUrl && (
        <img src={post.imageUrl} alt="Issue" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />
      )}

      {/* Status Controls — restricted to post owner */}
      {isOwner && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
          <button 
            onClick={() => onUpdateStatus(post.id, 'active')} 
            disabled={post.status === 'active'}
            style={{ flex: 1, padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: post.status === 'active' ? 'var(--accent-danger)' : 'transparent', color: post.status === 'active' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            Mark Open
          </button>
          <button 
            onClick={() => onUpdateStatus(post.id, 'in_progress')} 
            disabled={post.status === 'in_progress'}
            style={{ flex: 1, padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: post.status === 'in_progress' ? '#f59e0b' : 'transparent', color: post.status === 'in_progress' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            Mark In Progress
          </button>
          <button 
            onClick={() => onUpdateStatus(post.id, 'resolved')} 
            disabled={post.status === 'resolved'}
            style={{ flex: 1, padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: post.status === 'resolved' ? 'var(--accent-success)' : 'transparent', color: post.status === 'resolved' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            Mark Resolved
          </button>
        </div>
      )}

      <div className="post-actions-bar" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex' }}>
        <button 
          onClick={() => { if (user) onToggleReaction(post.id, '👍'); }} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: myUpvote ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
        >
          <ThumbsUp size={16} />
          <span>Confirm Issue ({totalUpvotes})</span>
        </button>
      </div>
    </article>
  );
};
