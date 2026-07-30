import React, { useState } from 'react';
import { Comment } from '../../types';
import { timeAgo, getInitials, getUserColor } from '../../utils';
import { Send } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  user: { uid: string; displayName: string } | null;
  onAddComment: (postId: string, text: string) => void;
  isAnonymousPost?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, comments, user, onAddComment, isAnonymousPost }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    onAddComment(postId, newComment.trim());
    setNewComment('');
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
        {comments.map((comment) => {
          const [ac] = getUserColor(comment.author);
          
          return (
            <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
              <div 
                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}
              >
                {getInitials(comment.author)}
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--surface-hover)', padding: '12px', borderRadius: '0 12px 12px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{comment.author}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{timeAgo(comment.timestamp)}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {comment.content}
                </div>
              </div>
            </div>
          );
        })}
        {comments.length === 0 && (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '16px 0' }}>
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div 
            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: getUserColor(user.displayName)[0], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, alignSelf: 'center' }}
          >
            {getInitials(user.displayName)}
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              style={{ width: '100%', minHeight: '40px', maxHeight: '120px', padding: '10px 40px 10px 12px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'none', overflowY: 'hidden', outline: 'none', fontFamily: 'inherit' }}
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
              style={{ position: 'absolute', right: '8px', bottom: '8px', background: 'transparent', border: 'none', cursor: newComment.trim() ? 'pointer' : 'not-allowed', color: newComment.trim() ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Please log in to leave a comment.
        </div>
      )}
    </div>
  );
};
