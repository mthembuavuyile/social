import React, { useState, useRef, useEffect } from 'react';
import { Post } from '../../types';
import { getInitials, getUserColor, timeAgo, formatRichTextReact } from '../../utils';
import { dbFirestore } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MilestonePanel } from './MilestonePanel';
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
  Loader2,
  Phone,
  ExternalLink,
  Users
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
  onApplyForGig?: (postId: string) => Promise<void>;
  onAcceptApplicant?: (postId: string, applicantUid: string) => Promise<void>;
  onOpenViralShare?: (post: Post) => void;
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
  onApplyForGig,
  onAcceptApplicant,
  onOpenViralShare,
}) => {
  const [activePanel, setActivePanel] = useState<'comments' | 'share' | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [fixImageUrlInput, setFixImageUrlInput] = useState('');
  const [isSubmittingFix, setIsSubmittingFix] = useState(false);
  const [comments, setComments] = useState<Record<string, any>>({});
  const [isUploadingFix, setIsUploadingFix] = useState(false);
  const [backAmount, setBackAmount] = useState<number>(50);
  const [isBacking, setIsBacking] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const track = post.postTrack || 'civic';

  // Real-time comments listener
  useEffect(() => {
    if (activePanel !== 'comments') return;
    const commentsRef = collection(dbFirestore, `posts/${post.id}/comments`);
    const q = query(commentsRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsMap: Record<string, any> = {};
      snapshot.forEach((doc) => { commentsMap[doc.id] = doc.data(); });
      setComments(commentsMap);
    });
    return () => unsubscribe();
  }, [activePanel, post.id]);

  // Highlight scroll
  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardRef.current.classList.add('highlight');
      const timer = setTimeout(() => { cardRef.current?.classList.remove('highlight'); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const totalUpvotes = post.reactions?.['👍'] || 0;
  const myUpvote = uid && post.userReactions?.['👍'] === '👍';

  // --- Handlers ---
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    showToast('Link copied!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpvoteClick = () => {
    if (!uid) { showToast('Please set your username first.', 'error'); return; }
    onToggleReaction(post.id, '👍');
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) { showToast('Please set your username first.', 'error'); return; }
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try { await onAddComment(post.id, commentText.trim()); setCommentText(''); }
    catch (err) { showToast('Comment failed', 'error'); }
    finally { setIsSubmittingComment(false); }
  };

  const handleClaimClick = async () => {
    if (!uid) { showToast('Please set your profile username first!', 'error'); return; }
    try { await onClaimGig(post.id); } catch (e) { showToast('Could not claim.', 'error'); }
  };

  const handlePrefillFixImage = () => {
    setFixImageUrlInput('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80');
    showToast('Demo repair photo loaded! 📸', 'info');
  };

  const handleSubmitFixClick = async () => {
    if (!fixImageUrlInput.trim()) { showToast('Please provide a photo showing the fix.', 'error'); return; }
    setIsSubmittingFix(true);
    try { await onSubmitFix(post.id, fixImageUrlInput.trim()); setFixImageUrlInput(''); }
    catch (e) { showToast('Failed to submit work.', 'error'); }
    finally { setIsSubmittingFix(false); }
  };

  const handleVerifyClick = async (type: 'verify' | 'dispute') => {
    if (!uid) { showToast('Please register first.', 'error'); return; }
    try { await onVerifyFix(post.id, type); } catch (e) { showToast('Verification failed.', 'error'); }
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
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, w, h); setFixImageUrlInput(canvas.toDataURL('image/jpeg', 0.75)); showToast('Proof photo processed! 📸', 'success'); }
        else { setFixImageUrlInput(event.target?.result as string); }
        setIsUploadingFix(false);
      };
      img.onerror = () => { showToast('Failed to load image', 'error'); setIsUploadingFix(false); };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => { showToast('Failed to read file', 'error'); setIsUploadingFix(false); };
    reader.readAsDataURL(file);
  };

  const handleBackProjectClick = async () => {
    if (!uid) { showToast('Please set your username first.', 'error'); return; }
    if (backAmount <= 0) { showToast('Please enter a valid amount.', 'error'); return; }
    if (userWalletBalance < backAmount) { showToast(`Insufficient balance. You have R${userWalletBalance}.`, 'error'); return; }
    setIsBacking(true);
    try { if (onBackProject) { await onBackProject(post.id, backAmount); showToast(`Backed with R${backAmount}! 🪙`, 'success'); } }
    catch (err) { showToast('Pledge failed.', 'error'); }
    finally { setIsBacking(false); }
  };

  const handleApplyClick = async () => {
    if (!uid) { showToast('Please set your username first.', 'error'); return; }
    setIsApplying(true);
    try { if (onApplyForGig) { await onApplyForGig(post.id); showToast('Applied for this gig! 🎉', 'success'); } }
    catch (err) { showToast('Failed to apply.', 'error'); }
    finally { setIsApplying(false); }
  };

  // Derived data
  const sortedComments = Object.entries(comments)
    .map(([id, c]: [string, any]) => ({ ...c, id, timestamp: c.timestamp ? (c.timestamp.toMillis ? c.timestamp.toMillis() : c.timestamp) : Date.now() }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const authorInitials = getInitials(post.author);
  const [ac1, ac2] = getUserColor(post.author);
  const currentUserInitials = getInitials(currentUserName);
  const [cuc1, cuc2] = getUserColor(currentUserName);

  const civicCategoryLabels: Record<string, string> = {
    pothole: 'Pothole', water_leak: 'Water Leak', electricity: 'Electricity Outage',
    sewage: 'Sewage Overflow', traffic_light: 'Broken Robot', other: 'Other Issue',
  };
  const gigCategoryLabels: Record<string, string> = {
    plumbing: '🔧 Plumbing', electrical: '⚡ Electrical', cleaning: '🧹 Cleaning',
    web_dev: '💻 Web Dev', tutoring: '📚 Tutoring', gardening: '🌿 Gardening',
    painting: '🎨 Painting', other_gig: '🛠 Other',
  };
  const projectCategoryLabels: Record<string, string> = {
    infrastructure: '🏗 Infrastructure', education: '📚 Education', sports: '⚽ Sports',
    health: '🏥 Health', environment: '🌿 Environment', community: '🤝 Community', other_project: '🌍 Other',
  };
  const trackBadgeLabels: Record<string, string> = {
    civic: 'Civic', gig: 'Gig', project: 'Project',
  };

  const getStatusBadge = () => {
    const s = post.status || 'active';
    if (track === 'gig') {
      if (s === 'resolved_complete') return { label: 'Completed', color: 'status-completed' };
      if (s === 'in_progress') return { label: 'Assigned', color: 'status-progress' };
      if (s === 'jury') return { label: 'Disputed', color: 'status-disputed' };
      return { label: 'Open', color: 'status-open' };
    }
    if (track === 'project') {
      if (s === 'resolved_complete') return { label: 'Completed', color: 'status-completed' };
      if (s === 'resolved' || s === 'in_progress') return { label: 'In Progress', color: 'status-progress' };
      return { label: 'Funding', color: 'status-open' };
    }
    // Civic
    if (s === 'resolved_complete') return { label: 'Resolved', color: 'status-completed' };
    if (s === 'resolved') return { label: 'Under Audit', color: 'status-audit' };
    if (s === 'in_progress') return { label: 'Repairing', color: 'status-progress' };
    if (s === 'jury') return { label: 'Audit Disputed', color: 'status-disputed' };
    return { label: 'Open', color: 'status-open' };
  };

  const statusBadge = getStatusBadge();

  // Archived/Flagged/Spam post
  if (post.status === 'burned') {
    return (
      <article className="post-card" style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>
        <p style={{ color: 'var(--accent-danger)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          🚫 Report archived as spam or incorrect location #AUDIT-{post.id.substring(0, 5)}
        </p>
      </article>
    );
  }

  const verCount = Object.keys(post.verifications || {}).length;
  const dispCount = Object.keys(post.disputes || {}).length;
  const hasVotedAudit = uid && (post.verifications?.[uid] || post.disputes?.[uid]);

  const applicantCount = Object.keys(post.gigApplicants || {}).length;
  const hasApplied = uid && post.gigApplicants?.[uid];
  const isGigOwner = uid && post.authorUid === uid;

  return (
    <article className={`post-card ${post.status === 'jury' ? 'jury-review' : ''}`} ref={cardRef}>

      {/* Audit overlay for civic */}
      {post.status === 'jury' && track === 'civic' && (
        <div className="court-overlay">
          <div className="court-title"><AlertTriangle size={18} /> Civic Quality Audit</div>
          <p className="court-desc font-heading" style={{ fontSize: '0.8rem' }}>Neighbors flagged this repair as incomplete. High-trust neighbors (≥40 Points) review the fix proof.</p>
          <div className="court-actions">
            <button className="court-btn court-btn-keep" onClick={() => onVoteCourt(post.id, 'keep')} disabled={!uid || userReputation < 40 || !!post.courtVotesKeep?.[uid!] || !!post.courtVotesBurn?.[uid!]}>
              Approve Fix ({Object.keys(post.courtVotesKeep || {}).length})
            </button>
            <button className="court-btn court-btn-burn" onClick={() => onVoteCourt(post.id, 'burn')} disabled={!uid || userReputation < 40 || !!post.courtVotesKeep?.[uid!] || !!post.courtVotesBurn?.[uid!]}>
              Reject Fix ({Object.keys(post.courtVotesBurn || {}).length})
            </button>
          </div>
          {uid && userReputation < 40 && (<p style={{ fontSize: '0.7rem', marginTop: '10px', color: 'var(--accent-danger)' }}>Requires ≥40 Civic Trust Points (You have {userReputation}).</p>)}
          {uid && (post.courtVotesKeep?.[uid] || post.courtVotesBurn?.[uid]) && (<p style={{ fontSize: '0.7rem', marginTop: '10px', color: 'var(--accent-success)' }}>Thank you for voting!</p>)}
        </div>
      )}

      {/* Post Header */}
      <div className="post-header">
        <div className="post-author-info">
          <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${ac1}, ${ac2})` }}>{authorInitials}</div>
          <div className="post-meta">
            <span className="post-author-name">{post.author}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} style={{ color: 'var(--text-muted)' }} />
              <span className="post-time">{timeAgo(post.timestamp)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Status Badge */}
          <span className={`status-badge ${statusBadge.color}`}>
            <span className="status-dot"></span>
            {statusBadge.label}
          </span>
          {/* Track Badge */}
          <span className={`track-badge track-badge-${track}`}>{trackBadgeLabels[track]}</span>
          {uid && post.authorUid !== uid && (
            <button className={`flag-btn ${post.flags?.[uid] ? 'flagged' : ''}`} onClick={() => onFlagPost(post.id)} disabled={post.status === 'jury'} title={post.flags?.[uid] ? "Flagged" : "Flag as spam"}>
              <AlertTriangle size={16} />
            </button>
          )}
          {uid && post.authorUid === uid && (
            <button className="btn-icon delete-btn" onClick={() => onDeletePost(post.id)} title="Delete"><Trash2 size={16} /></button>
          )}
        </div>
      </div>

      {/* Meta Row */}
      <div className="civic-meta-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {/* Category badge per track */}
        {track === 'civic' && post.category && (
          <span className="category-badge">{civicCategoryLabels[post.category] || post.category}</span>
        )}
        {track === 'gig' && post.gigCategory && (
          <span className="gig-category-badge">{gigCategoryLabels[post.gigCategory] || post.gigCategory}</span>
        )}
        {track === 'project' && post.projectCategory && (
          <span className="project-category-badge">{projectCategoryLabels[post.projectCategory] || post.projectCategory}</span>
        )}

        {post.location && (
          <span className="location-badge"><MapPin size={12} />{post.location}</span>
        )}

        {typeof post.latitude === 'number' && typeof post.longitude === 'number' && (
          <span className="location-badge" style={{ backgroundColor: 'rgba(29, 155, 240, 0.15)', cursor: 'pointer', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }} onClick={() => onShowOnMap && onShowOnMap(post.id)} title="View on Map">
            🧭 GPS
          </span>
        )}

        {/* Price/compensation badge */}
        {track === 'gig' && post.gigPrice && (
          <span className="gig-price-badge"><Coins size={12} />R{post.gigPrice}</span>
        )}
        {track === 'civic' && post.compensationValue && (
          <span className="compensation-badge"><Coins size={12} />Payout: R{post.compensationValue}</span>
        )}
      </div>

      {/* ===== GIG: Crowdfunding Panel for Project ===== */}
      {(track === 'project' || (track === 'civic' && post.isCrowdfunded)) && (
        <div className="crowdfund-container" style={{ margin: '12px 0', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: track === 'project' ? 'rgba(16, 185, 129, 0.02)' : 'rgba(29, 155, 240, 0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
            <span><strong>{track === 'project' ? '🌍 Community Project' : '💰 Crowdfunding Campaign'}</strong></span>
            <span style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>
              R{post.bountyRaised || 0} / R{post.bountyGoal || 500} Raised
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ width: `${Math.min(100, ((post.bountyRaised || 0) / (post.bountyGoal || 500)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-success))', borderRadius: '3px', transition: 'width 0.3s' }}></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <span>{Object.keys(post.backers || {}).length} backers</span>
            <span>{Math.round(Math.min(100, ((post.bountyRaised || 0) / (post.bountyGoal || 500)) * 100))}% funded</span>
          </div>

          {['active', 'approved'].includes(post.status || '') && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pledge:</span>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '85px' }}>
                <span style={{ position: 'absolute', left: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>R</span>
                <input type="number" className="standard-input" value={backAmount} onChange={(e) => setBackAmount(Math.max(10, parseInt(e.target.value) || 0))} style={{ padding: '4px 4px 4px 18px', fontSize: '0.75rem', height: '28px' }} min={10} />
              </div>
              <button className="btn-primary btn-small" onClick={handleBackProjectClick} disabled={isBacking || userWalletBalance < backAmount} style={{ height: '28px', padding: '0 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                {isBacking ? <Loader2 className="animate-spin" size={12} /> : 'Back'}
              </button>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Wallet: R{userWalletBalance})</span>
            </div>
          )}
        </div>
      )}

      {/* Milestones for Project Track */}
      {track === 'project' && post.milestones && post.milestones.length > 0 && (
        <MilestonePanel milestones={post.milestones} bountyRaised={post.bountyRaised} bountyGoal={post.bountyGoal} />
      )}

      {/* Post Content */}
      <div className="post-content" style={{ fontWeight: 500 }}>{formatRichTextReact(post.content)}</div>

      {/* Image (before/after for resolved civic; single for others) */}
      {(post.status === 'resolved' || post.status === 'jury') && track === 'civic' ? (
        <div className="fix-details-split">
          <div className="fix-details-col">
            <span className="before-lbl">🔴 Before</span>
            {post.imageUrl ? <img src={post.imageUrl} alt="Before fix" /> : <div className="no-photo-box">No photo</div>}
          </div>
          <div className="fix-details-col">
            <span className="after-lbl">🟢 After</span>
            {post.fixImageUrl ? <img src={post.fixImageUrl} alt="After fix" /> : <div className="no-photo-box">No photo</div>}
          </div>
        </div>
      ) : (
        post.imageUrl && <img className="post-image" src={post.imageUrl} alt="Post photo" style={{ display: 'block' }} />
      )}

      {/* Assigned Fixer (civic) */}
      {track === 'civic' && post.assignedFixerName && (
        <div style={{ marginTop: '10px' }}>
          <span className="fixer-tag"><Wrench size={12} /> Assigned Fixer: {post.assignedFixerName}</span>
        </div>
      )}

      {/* ===== TRACK-SPECIFIC ACTION PANELS ===== */}

      {/* CIVIC: Fixer Claim */}
      {track === 'civic' && isCurrentUserFixer && (post.status === 'active' || post.status === 'approved') && post.authorUid !== uid && (
        <div className="fix-controls-panel">
          {post.isCrowdfunded && (post.bountyRaised || 0) < (post.bountyGoal || 500) ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontStyle: 'italic', textAlign: 'center' }}>
              📢 Crowdfunding in progress — can be claimed when R{post.bountyGoal} target is met!
            </p>
          ) : (
            <>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                You are a Local Fixer. Claim this repair and earn R{post.compensationValue || 150}.
              </p>
              <button className="btn-primary full-width" onClick={handleClaimClick}><Wrench size={14} /> Claim Repair Gig</button>
            </>
          )}
        </div>
      )}

      {/* CIVIC: Submit fix */}
      {track === 'civic' && post.status === 'in_progress' && post.assignedFixerUid === uid && (
        <div className="fix-controls-panel">
          <label className="fix-image-preview-label">Submit Proof of Repair</label>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Upload a photo showing the completed repair.</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="url" className="standard-input" placeholder="Paste proof photo URL" value={fixImageUrlInput} onChange={e => setFixImageUrlInput(e.target.value)} style={{ flex: 1 }} />
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUploadFix} style={{ display: 'none' }} />
            <button type="button" className="btn-cancel" onClick={() => fileInputRef.current?.click()} disabled={isUploadingFix} style={{ padding: '10px 14px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isUploadingFix ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}<span>Upload</span>
            </button>
            <button type="button" className="btn-primary btn-small" onClick={handlePrefillFixImage} style={{ borderRadius: 'var(--radius-sm)', padding: '10px 12px' }} title="Prefill demo photo"><Camera size={13} /></button>
          </div>
          <button className="btn-primary full-width" onClick={handleSubmitFixClick} disabled={isSubmittingFix || isUploadingFix || !fixImageUrlInput.trim()} style={{ marginTop: '10px' }}>
            {isSubmittingFix ? 'Submitting...' : 'Submit Completed Fix'}
          </button>
        </div>
      )}

      {/* CIVIC: Community Audit */}
      {track === 'civic' && post.status === 'resolved' && (
        <div className="fix-controls-panel" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.01)' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-success)', marginBottom: '4px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={15} /> Community Audit
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Needs <strong>3 confirmations</strong> to release payout.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <span>Verified: {verCount} / 3</span>
            <span>Disputed: {dispCount} / 3</span>
          </div>
          {post.assignedFixerUid !== uid ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="court-btn court-btn-keep" style={{ flex: 1, padding: '8px' }} onClick={() => handleVerifyClick('verify')} disabled={!!hasVotedAudit}>Yes, looks fixed</button>
              <button className="court-btn court-btn-burn" style={{ flex: 1, padding: '8px' }} onClick={() => handleVerifyClick('dispute')} disabled={!!hasVotedAudit}>No, incomplete</button>
            </div>
          ) : (
            <p style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', textAlign: 'center', fontStyle: 'italic' }}>You are the Fixer. Awaiting neighbor audits.</p>
          )}
          {uid && hasVotedAudit && (<p style={{ fontSize: '0.75rem', color: 'var(--accent-success)', textAlign: 'center', marginTop: '6px', fontWeight: 'bold' }}>Thanks! Your feedback recorded.</p>)}
        </div>
      )}

      {/* GIG: Apply / WhatsApp Actions */}
      {track === 'gig' && post.status === 'active' && post.authorUid !== uid && !post.gigAcceptedUid && (
        <div className="fix-controls-panel" style={{ border: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.02)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            This gig pays <strong style={{ color: '#f59e0b' }}>R{post.gigPrice || post.compensationValue || 0}</strong>. Apply to let the poster know you're interested.
          </p>
          {hasApplied ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--accent-success)', textAlign: 'center', fontWeight: 600 }}>✅ You've applied! Waiting for acceptance.</p>
          ) : (
            <button className="btn-apply-gig" onClick={handleApplyClick} disabled={isApplying}>
              {isApplying ? <Loader2 className="animate-spin" size={14} /> : <><Wrench size={14} /> Apply for this Gig</>}
            </button>
          )}
        </div>
      )}

      {/* GIG: Poster sees applicants */}
      {track === 'gig' && isGigOwner && applicantCount > 0 && !post.gigAcceptedUid && (
        <div className="fix-controls-panel" style={{ border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', color: '#f59e0b', fontSize: '0.88rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={15} /> Applicants ({applicantCount})
          </h4>
          <div className="gig-applicants-list">
            {Object.entries(post.gigApplicants || {}).map(([appUid, info]) => (
              <div key={appUid} className="gig-applicant-row">
                <span className="applicant-name">{info.name}</span>
                <button className="gig-applicant-accept" onClick={() => onAcceptApplicant && onAcceptApplicant(post.id, appUid)}>
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GIG: Accepted — WhatsApp link */}
      {track === 'gig' && post.gigAcceptedUid && (
        <div className="fix-controls-panel" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
          <div style={{ marginBottom: '10px' }}>
            <span className="gig-accepted-badge">
              <CheckCircle2 size={14} /> Accepted: {post.gigAcceptedName || 'Worker'}
            </span>
          </div>
          {post.gigContactPhone && (uid === post.gigAcceptedUid || uid === post.authorUid) && (
            <a
              href={`https://wa.me/27${post.gigContactPhone.replace(/^0/, '')}?text=${encodeURIComponent(`Hi, I'm contacting you about the UbuntuFix gig: "${post.content.slice(0, 60)}..."`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{ textDecoration: 'none' }}
            >
              <Phone size={14} /> Contact via WhatsApp
              <ExternalLink size={12} />
            </a>
          )}
          {post.status !== 'resolved_complete' && uid === post.authorUid && (
            <button className="btn-primary full-width" style={{ marginTop: '8px', background: 'var(--accent-success)' }} onClick={() => handleClaimClick()}>
              <CheckCircle2 size={14} /> Mark as Completed
            </button>
          )}
        </div>
      )}

      {/* Card Actions Bar */}
      <div className="post-actions-bar">
        <button className={`action-btn ${myUpvote ? 'active' : ''}`} onClick={handleUpvoteClick} title="Confirm">
          <ThumbsUp size={15} /><span>Confirm ({totalUpvotes})</span>
        </button>
        <button className={`action-btn ${activePanel === 'comments' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'comments' ? null : 'comments')}>
          <MessageSquare size={15} /><span>Comments ({sortedComments.length})</span>
        </button>
        <button className={`action-btn ${activePanel === 'share' ? 'active' : ''}`} onClick={() => {
          if (onOpenViralShare && (track === 'project' || post.isCrowdfunded)) {
            onOpenViralShare(post);
          } else {
            setActivePanel(activePanel === 'share' ? null : 'share');
          }
        }}>
          <Share2 size={15} /><span>Share</span>
        </button>
      </div>

      {/* Share Panel */}
      <div className={`panel share-panel ${activePanel === 'share' ? 'active' : ''}`}>
        <input type="text" className="standard-input" readOnly value={`${window.location.origin}${window.location.pathname}?post=${post.id}`} />
        <button className="btn-primary" onClick={handleCopyLink}>{isCopied ? 'Copied!' : 'Copy'}</button>
      </div>

      {/* Comments Panel */}
      <div className={`panel comments-section ${activePanel === 'comments' ? 'active' : ''}`}>
        <div className="comments-list">
          {sortedComments.map((c) => {
            const ci = getInitials(c.author);
            const [cc1, cc2] = getUserColor(c.author);
            return (
              <div key={c.id} className="comment-item">
                <div className="user-avatar comment-avatar" style={{ background: `linear-gradient(135deg, ${cc1}, ${cc2})` }}>{ci}</div>
                <div className="comment-bubble">
                  <div className="comment-header">
                    <span className="comment-author">{c.author}</span>
                    <span className="comment-time">{timeAgo(c.timestamp)}</span>
                  </div>
                  <div className="comment-text">{formatRichTextReact(c.text)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={handleCommentSubmit} className="comment-composer">
          <div className="user-avatar comment-avatar" style={{ background: `linear-gradient(135deg, ${cuc1}, ${cuc2})` }}>{currentUserInitials}</div>
          <textarea className="standard-input" placeholder="Write a comment..." rows={1} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <button type="submit" className="btn-primary btn-small" disabled={isSubmittingComment || !commentText.trim()}>Send</button>
        </form>
      </div>
    </article>
  );
};
