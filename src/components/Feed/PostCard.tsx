import React, { useState, useRef, useEffect } from 'react';
import { Post } from '../../types';
import { getInitials, getUserColor, timeAgo, formatRichTextReact } from '../../utils';
import { dbFirestore } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  MapPin, 
  Coins, 
  Wrench, 
  Clock, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  Check,
  Loader2
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  uid: string | null;
  currentUserName: string;
  isCurrentUserFixer: boolean;
  onToggleReaction: (postId: string, emoji: string) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
  onDeletePost: (postId: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  isHighlighted?: boolean;
  userReputation: number;
  onFlagPost: (postId: string) => void;
  onVoteCourt: (postId: string, vote: 'keep' | 'burn') => void;
  onClaimGig: (postId: string) => Promise<void>;
  onSubmitFix: (postId: string, fixImageUrl: string) => Promise<void>;
  onVerifyFix: (postId: string, vote: 'verify' | 'dispute') => Promise<void>;
  onBackProject?: (postId: string, amount: number) => Promise<void>;
  userWalletBalance?: number;
  onShowOnMap?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  uid,
  currentUserName,
  isCurrentUserFixer,
  onToggleReaction,
  onAddComment,
  onDeletePost,
  showToast,
  isHighlighted = false,
  userReputation,
  onFlagPost,
  onVoteCourt,
  onClaimGig,
  onSubmitFix,
  onVerifyFix,
  onBackProject,
  userWalletBalance = 0,
  onShowOnMap,
}) => {
  const [activePanel, setActivePanel] = useState<'comments' | 'share' | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [fixImageUrlInput, setFixImageUrlInput] = useState('');
  const [isSubmittingFix, setIsSubmittingFix] = useState(false);
  const [comments, setComments] = useState<Record<string, any>>({});
  
  // Storage photo upload and crowdfunding pledge states
  const [isUploadingFix, setIsUploadingFix] = useState(false);
  const [backAmount, setBackAmount] = useState<number>(50);
  const [isBacking, setIsBacking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activePanel !== 'comments') return;

    const commentsRef = collection(dbFirestore, `posts/${post.id}/comments`);
    const q = query(commentsRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsMap: Record<string, any> = {};
      snapshot.forEach((doc) => {
        commentsMap[doc.id] = doc.data();
      });
      setComments(commentsMap);
    });

    return () => unsubscribe();
  }, [activePanel, post.id]);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardRef.current.classList.add('highlight');
      const timer = setTimeout(() => {
        cardRef.current?.classList.remove('highlight');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const totalUpvotes = post.reactions?.['👍'] || 0;
  const myUpvote = uid && post.userReactions?.['👍'] === '👍';

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    showToast('Report link copied!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpvoteClick = () => {
    if (!uid) {
      showToast('Please set your username first.', 'error');
      return;
    }
    onToggleReaction(post.id, '👍');
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      showToast('Please set your username first.', 'error');
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(post.id, commentText.trim());
      setCommentText('');
    } catch (err) {
      showToast('Comment failed', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleClaimClick = async () => {
    if (!uid) {
      showToast('Please set your profile username first!', 'error');
      return;
    }
    try {
      await onClaimGig(post.id);
    } catch (e) {
      showToast('Could not claim gig.', 'error');
    }
  };

  const handlePrefillFixImage = () => {
    setFixImageUrlInput('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80');
    showToast('Demo repair photo loaded! 📸', 'info');
  };

  const handleSubmitFixClick = async () => {
    if (!fixImageUrlInput.trim()) {
      showToast('Please provide a photo URL showing the fix.', 'error');
      return;
    }
    setIsSubmittingFix(true);
    try {
      await onSubmitFix(post.id, fixImageUrlInput.trim());
      setFixImageUrlInput('');
    } catch (e) {
      showToast('Failed to submit work.', 'error');
    } finally {
      setIsSubmittingFix(false);
    }
  };

  const handleVerifyClick = async (type: 'verify' | 'dispute') => {
    if (!uid) {
      showToast('Please register profile first.', 'error');
      return;
    }
    try {
      await onVerifyFix(post.id, type);
    } catch (e) {
      showToast('Verification failed.', 'error');
    }
  };

  const handleFileUploadFix = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFix(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setFixImageUrlInput(dataUrl);
          showToast('Proof photo processed successfully! 📸', 'success');
        } else {
          setFixImageUrlInput(event.target?.result as string);
          showToast('Photo loaded! 📸', 'success');
        }
        setIsUploadingFix(false);
      };
      img.onerror = () => {
        showToast('Failed to load image', 'error');
        setIsUploadingFix(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      showToast('Failed to read file', 'error');
      setIsUploadingFix(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInputFix = () => {
    fileInputRef.current?.click();
  };

  const handleBackProjectClick = async () => {
    if (!uid) {
      showToast('Please set your username first.', 'error');
      return;
    }
    if (backAmount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }
    if (userWalletBalance < backAmount) {
      showToast(`Insufficient simulated balance. You have R${userWalletBalance}.`, 'error');
      return;
    }
    setIsBacking(true);
    try {
      if (onBackProject) {
        await onBackProject(post.id, backAmount);
        showToast(`Backed project with R${backAmount}! 🪙`, 'success');
      }
    } catch (err) {
      showToast('Failed to pledge funds.', 'error');
    } finally {
      setIsBacking(false);
    }
  };

  const sortedComments = Object.entries(comments)
    .map(([id, c]: [string, any]) => ({
      ...c,
      id,
      timestamp: c.timestamp ? (c.timestamp.toMillis ? c.timestamp.toMillis() : c.timestamp) : Date.now()
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const authorInitials = getInitials(post.author);
  const [ac1, ac2] = getUserColor(post.author);

  const currentUserInitials = getInitials(currentUserName);
  const [cuc1, cuc2] = getUserColor(currentUserName);

  // Map category to plain text label (CSS/icons handle design now)
  const categoryLabels: Record<string, string> = {
    pothole: 'Pothole',
    water_leak: 'Water Leak',
    electricity: 'Electricity Outage',
    sewage: 'Sewage Overflow',
    traffic_light: 'Broken Robot',
    other: 'Other Issue',
  };

  if (post.status === 'burned') {
    return (
      <article className="post-card" style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>
        <p style={{ color: 'var(--accent-danger)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          🔥 Report marked as Spam/Fake by community vote #DAO-{post.id.substring(0, 5)}
        </p>
      </article>
    );
  }

  // Count verifications/disputes
  const verCount = Object.keys(post.verifications || {}).length;
  const dispCount = Object.keys(post.disputes || {}).length;
  const hasVotedAudit = uid && (post.verifications?.[uid] || post.disputes?.[uid]);

  // Stepper calculations
  const getSteps = (status?: string) => {
    return [
      { label: 'Reported', completed: true, active: status === 'active' },
      { label: 'Approved', completed: status !== 'active', active: status === 'approved' },
      { label: 'In Progress', completed: !['active', 'approved'].includes(status || ''), active: status === 'in_progress' },
      { label: 'Audit', completed: !['active', 'approved', 'in_progress'].includes(status || ''), active: status === 'resolved' || status === 'jury' },
      { label: 'Resolved', completed: status === 'resolved_complete', active: status === 'resolved_complete' }
    ];
  };

  const steps = getSteps(post.status);
  const completedCount = steps.filter(s => s.completed).length;
  const progressWidth = `${((completedCount - 1) / 4) * 100}%`;

  return (
    <article className={`post-card ${post.status === 'jury' ? 'jury-review' : ''}`} ref={cardRef}>
      
      {/* Visual Workflow Stepper */}
      <div className="status-stepper">
        <div className="stepper-progress" style={{ width: progressWidth }}></div>
        {steps.map((step, idx) => (
          <div key={idx} className={`step-node ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}>
            <div className="step-circle">
              {step.completed && !step.active && idx < 4 ? <Check size={12} strokeWidth={3} /> : idx + 1}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Legacy dispute court overlay */}
      {post.status === 'jury' && (
        <div className="court-overlay">
          <div className="court-title">
            <AlertTriangle size={18} /> Community Court Trial
          </div>
          <p className="court-desc">
            This repair job has been disputed. High-reputation members (≥40 Ubuntu Points) vote Keep (accept fix) or Burn (reject & penalize fixer).
          </p>
          <div className="court-actions">
            <button 
              className="court-btn court-btn-keep" 
              onClick={() => onVoteCourt(post.id, 'keep')}
              disabled={!uid || userReputation < 40 || post.courtVotesKeep?.[uid] || post.courtVotesBurn?.[uid]}
            >
              Keep & Pay ({Object.keys(post.courtVotesKeep || {}).length})
            </button>
            <button 
              className="court-btn court-btn-burn" 
              onClick={() => onVoteCourt(post.id, 'burn')}
              disabled={!uid || userReputation < 40 || post.courtVotesKeep?.[uid] || post.courtVotesBurn?.[uid]}
            >
              Reject ({Object.keys(post.courtVotesBurn || {}).length})
            </button>
          </div>
          {!uid && <p style={{ fontSize: '0.7rem', marginTop: '10px', color: 'var(--accent-danger)' }}>Set username to vote.</p>}
          {uid && userReputation < 40 && (
            <p style={{ fontSize: '0.7rem', marginTop: '10px', color: 'var(--accent-danger)' }}>
              Requires ≥40 Ubuntu Points (You have {userReputation}).
            </p>
          )}
          {uid && (post.courtVotesKeep?.[uid] || post.courtVotesBurn?.[uid]) && (
            <p style={{ fontSize: '0.7rem', marginTop: '10px', color: 'var(--accent-success)' }}>
              Thank you for voting!
            </p>
          )}
        </div>
      )}

      {/* Post Header */}
      <div className="post-header">
        <div className="post-author-info">
          <div
            className="user-avatar"
            style={{ background: `linear-gradient(135deg, ${ac1}, ${ac2})` }}
          >
            {authorInitials}
          </div>
          <div className="post-meta">
            <span className="post-author-name">{post.author}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} style={{ color: 'var(--text-muted)' }} />
              <span className="post-time">{timeAgo(post.timestamp)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {uid && post.authorUid !== uid && (
            <button
              className={`flag-btn ${post.flags?.[uid] ? 'flagged' : ''}`}
              onClick={() => onFlagPost(post.id)}
              disabled={post.status === 'jury'}
              title={post.flags?.[uid] ? "You flagged this" : "Flag as spam/fake (costs 1 Ubuntu Point)"}
            >
              <AlertTriangle size={16} />
            </button>
          )}
          {uid && post.authorUid === uid && (
            <button
              className="btn-icon delete-btn"
              style={{ display: 'block' }}
              onClick={() => onDeletePost(post.id)}
              title="Delete Report"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Meta Row: Category, Location, Compensation */}
      <div className="civic-meta-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {post.category && (
          <span className="category-badge">
            {categoryLabels[post.category] || post.category}
          </span>
        )}
        {post.location && (
          <span className="location-badge">
            <MapPin size={12} />
            {post.location}
          </span>
        )}
        {typeof post.latitude === 'number' && typeof post.longitude === 'number' && (
          <span 
            className="location-badge" 
            style={{ backgroundColor: 'rgba(29, 155, 240, 0.15)', cursor: 'pointer', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }} 
            onClick={() => onShowOnMap && onShowOnMap(post.id)}
            title="Click to view on Map"
          >
            🧭 GPS: {post.latitude.toFixed(5)}, {post.longitude.toFixed(5)}
          </span>
        )}
        {post.compensationValue && (
          <span className="compensation-badge">
            <Coins size={12} />
            Payout: R{post.compensationValue}
          </span>
        )}
      </div>

      {/* Crowdfunding Campaign Panel */}
      {post.isCrowdfunded && (
        <div className="crowdfund-container" style={{ margin: '12px 0', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'rgba(29, 155, 240, 0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
            <span><strong>Crowdfunding Campaign</strong></span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
              R{post.bountyRaised || 0} / R{post.bountyGoal || 500} Raised
            </span>
          </div>
          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ width: `${Math.min(100, ((post.bountyRaised || 0) / (post.bountyGoal || 500)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-success))', borderRadius: '3px', transition: 'width 0.3s' }}></div>
          </div>
          
          {/* Backing Controls - only show if status is active or approved and not claimed */}
          {['active', 'approved'].includes(post.status || '') && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pledge Simulated Rands:</span>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '85px' }}>
                <span style={{ position: 'absolute', left: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>R</span>
                <input 
                  type="number"
                  className="standard-input"
                  value={backAmount}
                  onChange={(e) => setBackAmount(Math.max(10, parseInt(e.target.value) || 0))}
                  style={{ padding: '4px 4px 4px 18px', fontSize: '0.75rem', height: '28px' }}
                  min={10}
                />
              </div>
              <button 
                className="btn-primary btn-small"
                onClick={handleBackProjectClick}
                disabled={isBacking || userWalletBalance < backAmount}
                style={{ height: '28px', padding: '0 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                {isBacking ? <Loader2 className="animate-spin" size={12} /> : 'Back'}
              </button>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Wallet: R{userWalletBalance})</span>
            </div>
          )}
        </div>
      )}

      {/* Issue Description */}
      <div className="post-content" style={{ fontWeight: 500 }}>
        {formatRichTextReact(post.content)}
      </div>

      {/* Before / After Images Layout */}
      {post.status !== 'resolved' && post.status !== 'jury' && post.imageUrl && (
        <img className="post-image" src={post.imageUrl} alt="Issue photo" style={{ display: 'block' }} />
      )}

      {(post.status === 'resolved' || post.status === 'jury') && (
        <div className="fix-details-split">
          <div className="fix-details-col">
            <span className="before-lbl">🔴 Before (Citizen)</span>
            {post.imageUrl ? (
              <img src={post.imageUrl} alt="Before fix" />
            ) : (
              <div className="no-photo-box">No photo</div>
            )}
          </div>
          <div className="fix-details-col">
            <span className="after-lbl">🟢 After (Fixer)</span>
            {post.fixImageUrl ? (
              <img src={post.fixImageUrl} alt="After fix" />
            ) : (
              <div className="no-photo-box">No photo</div>
            )}
          </div>
        </div>
      )}

      {/* Assigned Fixer Badge */}
      {post.assignedFixerName && (
        <div style={{ marginTop: '10px' }}>
          <span className="fixer-tag">
            <Wrench size={12} /> Assigned Fixer: {post.assignedFixerName}
          </span>
        </div>
      )}

      {/* ACTION CONTROLS PANEL FOR FIXERS AND COMMUNITY */}
      
      {/* 1. Open Active Job - Fixer Claim Option */}
      {isCurrentUserFixer && (post.status === 'active' || post.status === 'approved') && post.authorUid !== uid && (
        <div className="fix-controls-panel">
          {post.isCrowdfunded && (post.bountyRaised || 0) < (post.bountyGoal || 500) ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: 0, fontStyle: 'italic', textAlign: 'center' }}>
              📢 This project is crowdfunding. It can be claimed by a fixer once the target of R{post.bountyGoal} is met!
            </p>
          ) : (
            <>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                You are registered as a Local Fixer. You can claim this repair job and earn R{post.compensationValue || 150}.
              </p>
              <button className="btn-primary full-width" style={{ marginTop: 0 }} onClick={handleClaimClick}>
                <Wrench size={14} /> Claim Repair Gig
              </button>
            </>
          )}
        </div>
      )}

      {/* 2. Job In Progress - Assigned Fixer controls to submit work */}
      {post.status === 'in_progress' && post.assignedFixerUid === uid && (
        <div className="fix-controls-panel">
          <label className="fix-image-preview-label">Submit Proof of Repair</label>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Complete the repair and upload/provide a photo showing the fixed road/infrastructure.
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="url" 
              className="standard-input" 
              placeholder="Or paste proof photo URL"
              value={fixImageUrlInput}
              onChange={e => setFixImageUrlInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUploadFix}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn-cancel"
              onClick={triggerFileInputFix}
              disabled={isUploadingFix}
              style={{ padding: '10px 14px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isUploadingFix ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
              <span>Upload</span>
            </button>
            <button 
              type="button" 
              className="btn-primary btn-small"
              onClick={handlePrefillFixImage}
              style={{ borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}
              title="Prefill a sample fix photo"
            >
              <Camera size={13} />
            </button>
          </div>
          <button 
            className="btn-primary full-width" 
            onClick={handleSubmitFixClick}
            disabled={isSubmittingFix || isUploadingFix || !fixImageUrlInput.trim()}
            style={{ marginTop: '10px' }}
          >
            {isSubmittingFix ? 'Submitting...' : 'Submit Completed Fix'}
          </button>
        </div>
      )}

      {/* 3. Job Resolved - Community Audit / Neighbor Reviews */}
      {post.status === 'resolved' && (
        <div className="fix-controls-panel" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.01)' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-success)', marginBottom: '4px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={15} /> Community Audit Verification
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Neighbors, please verify if the repair is completed properly. Needs <strong>3 confirmations</strong> to pay out the fixer.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <span>Verified: {verCount} / 3</span>
            <span>Disputed: {dispCount} / 3</span>
          </div>

          {post.assignedFixerUid !== uid ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="court-btn court-btn-keep" 
                style={{ flex: 1, padding: '8px' }} 
                onClick={() => handleVerifyClick('verify')}
                disabled={!!hasVotedAudit}
              >
                Yes, looks fixed
              </button>
              <button 
                className="court-btn court-btn-burn" 
                style={{ flex: 1, padding: '8px' }} 
                onClick={() => handleVerifyClick('dispute')}
                disabled={!!hasVotedAudit}
              >
                No, incomplete
              </button>
            </div>
          ) : (
            <p style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', textAlign: 'center', fontStyle: 'italic' }}>
              You are the assigned Fixer. Awaiting neighbor audits.
            </p>
          )}

          {uid && hasVotedAudit && (
            <p style={{ fontSize: '0.75rem', color: 'var(--accent-success)', textAlign: 'center', marginTop: '6px', fontWeight: 'bold' }}>
              Thanks! Your feedback has been recorded.
            </p>
          )}
        </div>
      )}

      {/* Card Actions bar */}
      <div className="post-actions-bar">
        <button
          className={`action-btn ${myUpvote ? 'active' : ''}`}
          onClick={handleUpvoteClick}
          title="Verify this issue exists"
        >
          <ThumbsUp size={15} />
          <span>Confirm ({totalUpvotes})</span>
        </button>
        <button
          className={`action-btn ${activePanel === 'comments' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'comments' ? null : 'comments')}
        >
          <MessageSquare size={15} />
          <span>Comments ({sortedComments.length})</span>
        </button>
        <button
          className={`action-btn ${activePanel === 'share' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'share' ? null : 'share')}
        >
          <Share2 size={15} />
          <span>Share</span>
        </button>
      </div>

      {/* Share Panel */}
      <div className={`panel share-panel ${activePanel === 'share' ? 'active' : ''}`}>
        <input
          type="text"
          className="standard-input"
          readOnly
          value={`${window.location.origin}${window.location.pathname}?post=${post.id}`}
        />
        <button className="btn-primary" onClick={handleCopyLink}>
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Comments Panel */}
      <div className={`panel comments-section ${activePanel === 'comments' ? 'active' : ''}`}>
        <div className="comments-list">
          {sortedComments.map((c) => {
            const commentInitials = getInitials(c.author);
            const [cc1, cc2] = getUserColor(c.author);
            return (
              <div key={c.id} className="comment-item">
                <div
                  className="user-avatar comment-avatar"
                  style={{ background: `linear-gradient(135deg, ${cc1}, ${cc2})` }}
                >
                  {commentInitials}
                </div>
                <div className="comment-bubble">
                  <div className="comment-header">
                    <span className="comment-author">{c.author}</span>
                    <span className="comment-time">{timeAgo(c.timestamp)}</span>
                  </div>
                  <div className="comment-text">
                    {formatRichTextReact(c.text)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleCommentSubmit} className="comment-composer">
          <div
            className="user-avatar comment-avatar"
            style={{ background: `linear-gradient(135deg, ${cuc1}, ${cuc2})` }}
          >
            {currentUserInitials}
          </div>
          <textarea
            className="standard-input"
            placeholder="Write a comment..."
            rows={1}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary btn-small"
            disabled={isSubmittingComment || !commentText.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </article>
  );
};
