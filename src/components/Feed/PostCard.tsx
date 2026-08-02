import React, { useState } from 'react';
import { Post, Comment } from '../../types';
import { getInitials, getUserColor, timeAgo, formatRichTextReact, extractTwitterUrlFromText } from '../../utils';
import { ThumbsUp, MapPin, Clock, Trash2, CheckCircle2, AlertTriangle, Share2, Check, ExternalLink, Link2, Shield, Phone, FileText, EyeOff, MessageSquare, Flag, X, ShieldAlert } from 'lucide-react';
import { TwitterEmbed } from './TwitterEmbed';
import { PollView } from './PollView';
import { CommentSection } from './CommentSection';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatTelUri } from '../../data/emergencyContacts';

interface PostCardProps {
  post: Post;
  user: { uid: string; displayName: string } | null;
  onToggleReaction: (postId: string, emoji: string) => void;
  onDeletePost: (postId: string) => void;
  onUpdateStatus: (postId: string, status: 'active' | 'in_progress' | 'resolved') => void;
  onVoteOnPoll?: (postId: string, optionId: string) => void;
  onAddComment?: (postId: string, text: string) => void;
  fetchComments?: (postId: string) => Promise<Comment[]>;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  user,
  onToggleReaction,
  onDeletePost,
  onUpdateStatus,
  onVoteOnPoll,
  onAddComment,
  fetchComments,
}) => {
  const [copied, setCopied] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('false_report');
  const [isFlaggedByMe, setIsFlaggedByMe] = useState(() => {
    return localStorage.getItem(`civicly_flagged_${post.id}`) === 'true';
  });
  const [showFlaggedContent, setShowFlaggedContent] = useState(false);
  
  const totalUpvotes = post.reactions?.['👍'] || 0;
  const myUpvote = user && post.userReactions?.['👍'] === '👍';
  const isOwner = user?.uid === post.authorUid;
  const isCrime = post.reportType === 'crime';
  const isAnonymous = isCrime && post.anonymous;


  const displayAuthor = isAnonymous ? 'Anonymous Citizen' : post.author;
  const authorInitials = isAnonymous ? '?' : getInitials(post.author);
  const [ac1] = getUserColor(isAnonymous ? 'Anonymous' : post.author);

  const categoryLabels: Record<string, string> = {
    // Civic categories
    pothole: '🕳️ Pothole',
    water_leak: '💧 Water Leak',
    electricity: '⚡ Electricity Outage',
    sewage: '⚠️ Sewage Overflow',
    traffic_light: '🚦 Broken Robot',
    other: '🏗️ Other Issue',
    // Crime categories
    theft: '🔓 Theft',
    robbery: '🔪 Robbery',
    assault: '🚨 Assault',
    burglary: '🏠 Burglary',
    vandalism: '💥 Vandalism',
    hijacking: '🚗 Hijacking',
    drug_activity: '💊 Drug Activity',
    fraud: '📋 Fraud',
    domestic_violence: '🤝 Domestic Violence',
    crime_other: '🔍 Other Crime',
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

  const urgencyConfig: Record<string, { label: string; className: string }> = {
    low: { label: '🟢 Low', className: 'urgency-low' },
    medium: { label: '🟡 Medium', className: 'urgency-medium' },
    high: { label: '🟠 High', className: 'urgency-high' },
    emergency: { label: '🔴 Emergency', className: 'urgency-emergency' },
  };

  const twitterUrl = post.socialUrl || extractTwitterUrlFromText(post.content);
  const directPostUrl = `${window.location.origin}/post/${post.id}`;

  const handleToggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0 && fetchComments) {
      setIsLoadingComments(true);
      try {
        const fetched = await fetchComments(post.id);
        setComments(fetched);
      } catch (e) {
        console.error('Failed to fetch comments', e);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleAddComment = (postId: string, text: string) => {
    if (onAddComment) {
      onAddComment(postId, text);
      if (user) {
        const newComment: Comment = {
          id: Date.now().toString(),
          postId,
          content: text,
          author: user.displayName,
          authorUid: user.uid,
          timestamp: Date.now(),
        };
        setComments([...comments, newComment]);
      }
    }
  };

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

  const handleReportSubmit = () => {
    localStorage.setItem(`civicly_flagged_${post.id}`, 'true');
    setIsFlaggedByMe(true);
    setIsReportModalOpen(false);
    toast.success('Report submitted. Content has been hidden from your feed for community review.');
  };

  if (isFlaggedByMe && !showFlaggedContent) {
    return (
      <div className="post-card" style={{ padding: '16px 20px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color="#ef4444" />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              You flagged this report for community review. It is hidden from your feed.
            </span>
          </div>
          <button 
            onClick={() => setShowFlaggedContent(true)}
            style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Show Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className={`post-card ${isCrime ? 'post-card--crime' : ''}`} id={`post-${post.id}`}>
      {/* Header Info */}
      <div className="post-header">
        <div className="post-author-info">
          <div 
            className={`user-avatar ${isAnonymous ? 'avatar-anonymous' : ''}`} 
            style={{ background: isAnonymous ? '#374151' : ac1 }}
          >
            {isAnonymous ? <EyeOff size={14} /> : authorInitials}
          </div>
          <div className="post-meta">
            <div className={`post-author-name ${isAnonymous ? 'author-anonymous' : ''}`}>
              {displayAuthor}
              {isAnonymous && <EyeOff size={11} style={{ marginLeft: '4px', opacity: 0.6 }} />}
            </div>
            <Link to={`/post/${post.id}`} className="post-timestamp-link">
              <Clock size={12} />
              <span>{timeAgo(post.timestamp)}</span>
            </Link>
          </div>
        </div>

        <div className="post-header-actions">
          {/* Report Type Badge */}
          {isCrime && (
            <span className="report-type-badge report-type-crime">
              <Shield size={11} />
              Crime
            </span>
          )}

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

          {!isOwner && (
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="btn-icon-secondary"
              title="Flag / Report Content"
              style={{ color: isFlaggedByMe ? '#ef4444' : undefined }}
            >
              <Flag size={15} />
            </button>
          )}

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
          <span className={`category-chip ${isCrime ? 'category-chip--crime' : ''}`}>
            {categoryLabels[post.category] || post.category}
          </span>
        )}
        {post.location && (
          post.latitude !== undefined && post.longitude !== undefined ? (
            <Link to={`/map?post=${post.id}`} className="location-chip" style={{ cursor: 'pointer', textDecoration: 'none' }} title="View on map">
              <MapPin size={12} /> {post.location}
            </Link>
          ) : (
            <span className="location-chip">
              <MapPin size={12} /> {post.location}
            </span>
          )
        )}
        {/* Crime Urgency Badge */}
        {isCrime && post.crimeUrgency && urgencyConfig[post.crimeUrgency] && (
          <span className={`urgency-badge ${urgencyConfig[post.crimeUrgency].className}`}>
            {urgencyConfig[post.crimeUrgency].label}
          </span>
        )}
      </div>

      {/* Crime-specific Meta Row */}
      {isCrime && (
        <div className="crime-meta-row">
          {post.incidentTime && (
            <span className="crime-meta-chip">
              <Clock size={11} />
              {formatIncidentTime(post.incidentTime)}
            </span>
          )}
          {post.policeContacted && (
            <span className="crime-meta-chip police-contacted">
              <Phone size={11} />
              Police Contacted
            </span>
          )}
          {post.caseNumber && (
            <span className="crime-meta-chip case-number">
              <FileText size={11} />
              Case: {post.caseNumber}
            </span>
          )}
        </div>
      )}

      {/* Main Issue Content */}
      <div className="post-content-body">
        {formatRichTextReact(post.content)}
      </div>

      {/* Poll View */}
      {post.pollOptions && post.pollOptions.length > 0 && (
        <PollView 
          options={post.pollOptions} 
          expiresAt={post.pollExpiresAt} 
          onVote={(optionId) => onVoteOnPoll && onVoteOnPoll(post.id, optionId)}
          userVotedId={null} // TODO: hook up to user data if needed
        />
      )}

      {/* Emergency CTA for high-urgency crime reports */}
      {isCrime && (post.crimeUrgency === 'high' || post.crimeUrgency === 'emergency') && post.status !== 'resolved' && (
        <div className="crime-emergency-cta">
          <a href={formatTelUri('10111')} className="emergency-call-btn">
            <Phone size={14} />
            <span>Call SAPS: 10111</span>
          </a>
          <a href={formatTelUri('112')} className="emergency-call-btn secondary">
            <Phone size={14} />
            <span>Emergency: 112</span>
          </a>
        </div>
      )}

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
          <span className="action-label">{myUpvote ? 'Endorsed' : 'Endorse Issue'}</span>
          <span className="upvote-count-badge">{totalUpvotes}</span>
        </button>

        <button 
          onClick={handleToggleComments}
          className={`action-btn comment-btn ${showComments ? 'active' : ''}`}
          title="Toggle Comments"
        >
          <MessageSquare size={16} />
          <span className="action-label">Comments</span>
          {post.commentsCount !== undefined && post.commentsCount > 0 && (
            <span className="comment-count-badge" style={{ marginLeft: '4px', fontSize: '0.8rem', opacity: 0.8 }}>{post.commentsCount}</span>
          )}
        </button>

        <button 
          onClick={handleShare}
          className="action-btn share-btn"
          title="Share Exact Post Link"
        >
          {copied ? <Check size={16} color="var(--accent-success)" /> : <Share2 size={16} />}
          <span className="action-label">{copied ? 'Link Copied!' : 'Share Post Link'}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        isLoadingComments ? (
          <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading comments...</div>
        ) : (
          <CommentSection 
            postId={post.id}
            comments={comments}
            user={user}
            onAddComment={handleAddComment}
            isAnonymousPost={isAnonymous}
          />
        )
      )}

      {/* Content Moderation Flag Modal */}
      {isReportModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }} onClick={() => setIsReportModalOpen(false)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flag size={20} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Report Violation
                </h3>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Help keep Civicly safe. Why are you reporting this post?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { id: 'false_report', label: '🚨 False or Fraudulent Civic Report' },
                { id: 'doxing', label: '👤 Doxing / Personal Private Info' },
                { id: 'hate_speech', label: '⚠️ Hate Speech, Harassment, or Bullying' },
                { id: 'spam', label: '📢 Commercial Spam or Unrelated Ads' },
                { id: 'inappropriate', label: '📷 Inappropriate / Offensive Media' }
              ].map((opt) => (
                <label 
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: reportReason === opt.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-color)',
                    border: reportReason === opt.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="radio" 
                    name="reportReason" 
                    value={opt.id} 
                    checked={reportReason === opt.id}
                    onChange={() => setReportReason(opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleReportSubmit}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

/** Format an incident time string for display */
function formatIncidentTime(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timeStr;
  }
}
