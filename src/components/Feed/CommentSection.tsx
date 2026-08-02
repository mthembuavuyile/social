import React, { useState } from 'react';
import { Comment } from '../../types';
import { timeAgo, getInitials, getUserColor } from '../../utils';
import { Send, MessageSquare, Reply, X } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  user: { uid: string; displayName: string } | null;
  onAddComment: (postId: string, text: string, parentId?: string) => void;
  isAnonymousPost?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, comments, user, onAddComment }) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, author: string } | null>(null);

  // Group comments
  const topLevelComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    onAddComment(postId, newComment.trim(), replyingTo?.id);
    setNewComment('');
    setReplyingTo(null);
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
      {/* Comments Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '14px' }}>
        <MessageSquare size={14} />
        <span>Comments ({comments.length})</span>
      </div>

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
        {topLevelComments.map((comment) => {
          const [ac] = getUserColor(comment.author);
          const commentReplies = replies.filter(r => r.parentId === comment.id);
          
          return (
            <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div 
                  className="user-avatar"
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    minWidth: '32px', 
                    minHeight: '32px', 
                    backgroundColor: ac, 
                    fontSize: '0.75rem',
                    boxShadow: 'none'
                  }}
                >
                  {getInitials(comment.author)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    backgroundColor: 'var(--surface-color-hover)', 
                    border: '1px solid var(--border-color)', 
                    padding: '10px 14px', 
                    borderRadius: '0 14px 14px 14px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{comment.author}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(comment.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {comment.content}
                    </div>
                  </div>
                  
                  {/* Action Bar */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', marginLeft: '4px' }}>
                    <button 
                      onClick={() => setReplyingTo({ id: comment.id, author: comment.author })}
                      style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Reply size={12} /> Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Nested Replies */}
              {commentReplies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '42px', marginTop: '4px' }}>
                  {commentReplies.map(reply => {
                    const [rac] = getUserColor(reply.author);
                    return (
                      <div key={reply.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div 
                          className="user-avatar"
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            minWidth: '24px', 
                            minHeight: '24px', 
                            backgroundColor: rac, 
                            fontSize: '0.65rem',
                            boxShadow: 'none'
                          }}
                        >
                          {getInitials(reply.author)}
                        </div>
                        <div style={{ 
                          flex: 1, 
                          backgroundColor: 'var(--surface-color-hover)', 
                          border: '1px solid var(--border-color)', 
                          padding: '8px 12px', 
                          borderRadius: '0 12px 12px 12px' 
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{reply.author}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeAgo(reply.timestamp)}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {reply.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {comments.length === 0 && (
          <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', padding: '12px 0', background: 'var(--surface-color-hover)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
            No comments yet. Share your thoughts or updates below.
          </div>
        )}
      </div>

      {/* Comment Input Box */}
      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {replyingTo && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent-primary)', padding: '0 8px', fontWeight: 500 }}>
              <span>Replying to @{replyingTo.author}</span>
              <button 
                onClick={() => setReplyingTo(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div 
              className="user-avatar"
              style={{ 
                width: '32px', 
                height: '32px', 
                minWidth: '32px', 
                minHeight: '32px', 
                backgroundColor: getUserColor(user.displayName)[0], 
                fontSize: '0.75rem',
                boxShadow: 'none'
              }}
            >
              {getInitials(user.displayName)}
            </div>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                rows={1}
                style={{ 
                  width: '100%', 
                  minHeight: '38px', 
                  maxHeight: '120px', 
                  padding: '9px 42px 9px 14px', 
                  borderRadius: '20px', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--bg-color)', 
                  color: 'var(--text-main)', 
                  fontSize: '0.88rem', 
                  resize: 'none', 
                  outline: 'none', 
                  fontFamily: 'inherit',
                  lineHeight: '1.4'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button 
                type="submit" 
                disabled={!newComment.trim()}
                style={{ 
                  position: 'absolute', 
                  right: '6px', 
                  background: newComment.trim() ? 'var(--accent-primary)' : 'transparent', 
                  border: 'none', 
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: newComment.trim() ? 'pointer' : 'default', 
                  color: newComment.trim() ? '#ffffff' : 'var(--text-muted)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  transition: 'background 0.15s ease, color 0.15s ease' 
                }}
                title="Send Comment"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Log in to leave a comment.
        </div>
      )}
    </div>
  );
};
