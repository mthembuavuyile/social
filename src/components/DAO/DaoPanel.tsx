import React, { useState } from 'react';
import { Proposal, Post } from '../../types';
import { 
  FileText, 
  Scale, 
  Trophy, 
  Plus, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  Check, 
  MapPin 
} from 'lucide-react';

interface DaoPanelProps {
  uid: string | null;
  username: string;
  reputation: number;
  reputationsMap: Record<string, number>;
  proposals: Proposal[];
  flaggedPosts: Post[];
  onCreateProposal: (
    title: string,
    description: string,
    type: 'setting' | 'text',
    settingKey?: 'announcement',
    settingValue?: string
  ) => Promise<void>;
  onVoteOnProposal: (proposalId: string, vote: 'for' | 'against') => Promise<void>;
  onVoteCourt: (postId: string, vote: 'keep' | 'burn') => Promise<void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const DaoPanel: React.FC<DaoPanelProps> = ({
  uid,
  username,
  reputation,
  reputationsMap,
  proposals,
  flaggedPosts,
  onCreateProposal,
  onVoteOnProposal,
  onVoteCourt,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'court' | 'leaderboard'>('proposals');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propType, setPropType] = useState<'setting' | 'text'>('setting');
  const [settingKey] = useState<'announcement'>('announcement');
  const [settingValue, setSettingValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      showToast('Please set your username first.', 'error');
      return;
    }
    if (reputation < 10) {
      showToast('Requires at least 10 Ubuntu Points to propose.', 'error');
      return;
    }
    if (!title.trim() || !description.trim()) {
      showToast('Title and description are required.', 'error');
      return;
    }
    if (propType === 'setting' && !settingValue.trim()) {
      showToast('Setting value is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateProposal(
        title.trim(),
        description.trim(),
        propType,
        propType === 'setting' ? settingKey : undefined,
        propType === 'setting' ? settingValue.trim() : undefined
      );
      setTitle('');
      setDescription('');
      setSettingValue('');
      setShowCreateForm(false);
    } catch (err) {
      showToast('Failed to create proposal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort leaderboards descending
  const leaderboard = Object.entries(reputationsMap)
    .map(([userUid, rep]) => ({ uid: userUid, rep }))
    .sort((a, b) => b.rep - a.rep)
    .slice(0, 10);

  return (
    <div className="dao-panel">
      <div className="dao-header">
        <h2>Local Board</h2>
        <p className="profile-sub">You hold the power to shape the community. Start community polls, vote on settings, and review disputed repair jobs.</p>
      </div>

      <div className="dao-tabs">
        <button 
          className={`dao-tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileText size={15} /> Community Polls
        </button>
        <button 
          className={`dao-tab-btn ${activeTab === 'court' ? 'active' : ''}`}
          onClick={() => setActiveTab('court')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Scale size={15} /> Community Review ({flaggedPosts.length})
        </button>
        <button 
          className={`dao-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Trophy size={15} /> Top Contributors
        </button>
      </div>

      {activeTab === 'proposals' && (
        <div className="dao-grid">
          <div className="widget-card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="widget-title" style={{ marginBottom: '4px' }}>Community Initiatives & Settings</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Submit setting changes or community initiatives. Costs <strong>10 Ubuntu Points</strong>.
                </p>
              </div>
              <button 
                className="btn-primary" 
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'Cancel' : <><Plus size={14} /> New Poll</>}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleSubmit} className="new-proposal-form" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label>Poll Title</label>
                  <input 
                    type="text" 
                    className="standard-input" 
                    placeholder="e.g. Set global announcement to Loadshedding Block 4 update"
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    className="standard-input" 
                    rows={3} 
                    placeholder="Explain how this benefits the neighborhood..."
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    className="standard-input" 
                    value={propType} 
                    onChange={e => setPropType(e.target.value as 'setting' | 'text')}
                    style={{ background: 'var(--surface-color)', color: 'var(--text-main)', padding: '10px' }}
                  >
                    <option value="setting">Setting Change (Auto-Executable)</option>
                    <option value="text">General Announcement / Suggestion</option>
                  </select>
                </div>

                {propType === 'setting' && (
                  <div className="form-group">
                    <label>New Announcement Text</label>
                    <input 
                      type="text" 
                      className="standard-input" 
                      placeholder="Type announcement..."
                      value={settingValue}
                      onChange={e => setSettingValue(e.target.value)}
                      required
                    />
                  </div>
                )}

                <button type="submit" className="btn-primary full-width" disabled={isSubmitting || reputation < 10}>
                  {isSubmitting ? 'Submitting...' : 'Submit (Costs 10 Ubuntu Points)'}
                </button>
              </form>
            )}
          </div>

          <div className="proposal-list">
            {proposals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No proposals submitted yet.</p>
            ) : (
              [...proposals].sort((a, b) => {
                if (a.status === 'active' && b.status !== 'active') return -1;
                if (a.status !== 'active' && b.status === 'active') return 1;
                return b.timestamp - a.timestamp;
              }).map(proposal => {
                const totalVotes = proposal.totalVotesFor + proposal.totalVotesAgainst;
                const forPct = totalVotes > 0 ? (proposal.totalVotesFor / totalVotes) * 100 : 50;
                const againstPct = totalVotes > 0 ? (proposal.totalVotesAgainst / totalVotes) * 100 : 50;
                const timeLeft = Math.max(0, Math.round((proposal.endTime - Date.now()) / 1000));
                const timeStr = timeLeft > 60 
                  ? `${Math.ceil(timeLeft / 60)}m left` 
                  : timeLeft > 0 ? `${timeLeft}s left` : 'Voting closed';

                const hasVoted = uid && (proposal.votesFor?.[uid] !== undefined || proposal.votesAgainst?.[uid] !== undefined);

                return (
                  <div key={proposal.id} className="proposal-item">
                    <div className="proposal-header">
                      <div>
                        <span className={`proposal-badge ${proposal.status}`}>
                          {proposal.status}
                        </span>
                        {proposal.type === 'setting' && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginLeft: '8px', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>
                            Setting: {proposal.settingKey}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} />
                        {proposal.status === 'active' ? timeStr : 'Finalized'}
                      </span>
                    </div>

                    <h3 className="proposal-title">{proposal.title}</h3>
                    <p className="proposal-desc">{proposal.description}</p>

                    {proposal.type === 'setting' && proposal.status === 'passed' && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px dashed var(--accent-success)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent-success)', marginBottom: '12px' }}>
                        ⚙️ Executed: Changed {proposal.settingKey} to "{proposal.settingValue}"
                      </div>
                    )}

                    {proposal.status === 'defeated' && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px dashed var(--accent-danger)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent-danger)', marginBottom: '12px' }}>
                        ❌ Defeated: Not enough support. {totalVotes === 0 ? '(10 Points Refunded)' : ''}
                      </div>
                    )}

                    {proposal.status === 'active' && uid && (
                      <div className="proposal-vote-box">
                        <button 
                          className="proposal-vote-btn proposal-vote-btn-for" 
                          onClick={() => onVoteOnProposal(proposal.id, 'for')}
                          disabled={!!hasVoted}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <ThumbsUp size={13} /> Support ({proposal.totalVotesFor})
                        </button>
                        <button 
                          className="proposal-vote-btn proposal-vote-btn-against" 
                          onClick={() => onVoteOnProposal(proposal.id, 'against')}
                          disabled={!!hasVoted}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <ThumbsDown size={13} /> Oppose ({proposal.totalVotesAgainst})
                        </button>
                      </div>
                    )}

                    <div className="proposal-progress-bar">
                      <div className="vote-fill-for" style={{ width: `${forPct}%` }} />
                      <div className="vote-fill-against" style={{ width: `${againstPct}%` }} />
                    </div>

                    <div className="proposal-meta-row">
                      <span>By: {proposal.creator}</span>
                      <span>Votes (Weight): {totalVotes}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'court' && (
        <div className="court-view">
          <div className="widget-card" style={{ marginBottom: '20px' }}>
            <h3 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={16} /> Neighbor Dispute Reviews
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              When a repair is submitted but disputed by the community, it comes here for review. Neighbors with <strong>≥40 Ubuntu Points</strong> vote to accept or reject the fixer's work.
            </p>
          </div>

          {flaggedPosts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No active disputes to review.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {flaggedPosts.map(post => {
                const keeps = Object.keys(post.courtVotesKeep || {}).length;
                const burns = Object.keys(post.courtVotesBurn || {}).length;
                const hasVoted = uid && (post.courtVotesKeep?.[uid] || post.courtVotesBurn?.[uid]);

                return (
                  <div key={post.id} className="proposal-item" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong>Fixer: {post.assignedFixerName || 'Unknown'}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Case #{post.id.substring(0, 5)}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>Issue Description:</strong>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>"{post.content}"</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        <MapPin size={12} /> Location: {post.location}
                      </div>
                      {post.fixImageUrl && (
                        <div style={{ marginTop: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fixer Proof Image:</span>
                          <img src={post.fixImageUrl} alt="Fix proof" style={{ display: 'block', width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                        </div>
                      )}
                    </div>

                    <div className="proposal-vote-box">
                      <button 
                        className="court-btn court-btn-keep"
                        onClick={() => onVoteCourt(post.id, 'keep')}
                        disabled={!uid || reputation < 40 || !!hasVoted}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Check size={14} /> Accept Fix ({keeps} / 3)
                      </button>
                      <button 
                        className="court-btn court-btn-burn"
                        onClick={() => onVoteCourt(post.id, 'burn')}
                        disabled={!uid || reputation < 40 || !!hasVoted}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <AlertTriangle size={14} /> Reject Fix ({burns} / 3)
                      </button>
                    </div>

                    {uid && reputation < 40 && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--accent-danger)', textAlign: 'center', marginTop: '6px' }}>
                        Requires ≥40 Ubuntu Points to participate (You have {reputation}).
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="widget-card">
          <h3 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={16} /> Ubuntu Leaderboard
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>Top contributors who earn Ubuntu Points by verifying and repairing civic infrastructure.</p>

          <div className="leaderboard-list">
            {leaderboard.map((user, idx) => {
              const isCurrentUser = user.uid === uid;
              let rankStyle = {};
              let medal = '';

              if (idx === 0) {
                rankStyle = { borderLeft: '3px solid #ffd700', background: 'rgba(255, 215, 0, 0.02)' };
                medal = '🥇 ';
              } else if (idx === 1) {
                rankStyle = { borderLeft: '3px solid #c0c0c0', background: 'rgba(192, 192, 192, 0.02)' };
                medal = '🥈 ';
              } else if (idx === 2) {
                rankStyle = { borderLeft: '3px solid #cd7f32', background: 'rgba(205, 127, 50, 0.02)' };
                medal = '🥉 ';
              }

              return (
                <div 
                  key={user.uid} 
                  className="leaderboard-row" 
                  style={{ 
                    ...rankStyle, 
                    fontWeight: isCurrentUser ? 'bold' : 'normal',
                    borderColor: isCurrentUser ? 'var(--accent-primary)' : 'var(--border-color)'
                  }}
                >
                  <div className="leaderboard-user">
                    <span style={{ width: '24px' }}>{medal || `#${idx + 1}`}</span>
                    <span style={{ fontFamily: 'var(--font-heading)' }}>
                      {isCurrentUser ? `${username} (You)` : `Citizen_${user.uid.substring(0, 6)}`}
                    </span>
                  </div>
                  <strong>{user.rep} Pts</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
