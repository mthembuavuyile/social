import React, { useMemo } from 'react';
import { PostCard } from '../components/Feed/PostCard';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { dbFirestore } from '../firebase';
import toast from 'react-hot-toast';
import { Post } from '../types';
import { ShieldAlert, Inbox } from 'lucide-react';

interface AlertsProps {
  user: { uid: string; displayName: string } | null;
  searchQuery: string;
  posts: Post[];
  postsLoading: boolean;
  updatePostStatus: (postId: string, status: 'active' | 'in_progress' | 'resolved') => Promise<void>;
  deletePost: (postId: string, uid: string) => Promise<void>;
}

export const Alerts: React.FC<AlertsProps> = ({
  user,
  searchQuery,
  posts,
  postsLoading,
  updatePostStatus,
  deletePost,
}) => {
  const handleToggleReaction = async (postId: string, emoji: string) => {
    if (!user) {
      toast.error('You must be logged in to endorse issues.');
      return;
    }
    const postRef = doc(dbFirestore, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    
    const data = postSnap.data();
    const currentReactions = data.reactions || {};
    const currentUserReactions = data.userReactions || {};
    
    const hasReacted = currentUserReactions[user.uid] === emoji;
    
    const newReactions = { ...currentReactions };
    const newUserReactions = { ...currentUserReactions };
    
    if (hasReacted) {
      newReactions[emoji] = Math.max(0, (newReactions[emoji] || 1) - 1);
      delete newUserReactions[user.uid];
    } else {
      newReactions[emoji] = (newReactions[emoji] || 0) + 1;
      newUserReactions[user.uid] = emoji;
    }
    
    await updateDoc(postRef, { reactions: newReactions, userReactions: newUserReactions });
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Show crime reports and highly urgent civic issues
      const isCrime = post.reportType === 'crime';
      const isUrgentCivic = post.reportType !== 'crime' && (post.reactions?.['👍'] || 0) >= 1 && post.status !== 'resolved';
      
      if (!isCrime && !isUrgentCivic) return false;

      // Filter by search query if any
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return post.content?.toLowerCase().includes(q) || 
               post.location?.toLowerCase().includes(q) || 
               post.category?.toLowerCase().includes(q);
      }
      
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [posts, searchQuery]);

  return (
    <div className="home-feed-page">
      <div className="feed-header-top" style={{ marginBottom: '16px' }}>
        <h2 className="feed-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-danger)' }}>
          <ShieldAlert size={24} />
          Safety & Urgent Alerts
        </h2>
        <span className="feed-badge">{filteredPosts.length} Alerts</span>
      </div>

      <div className="feed" style={{ marginTop: '16px' }}>
        {postsLoading ? (
          <div className="feed-loading-state">
            <div className="spinner"></div>
            <span>Loading alerts...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="feed-empty-state">
            <Inbox size={48} color="var(--text-muted)" />
            <h3>No active alerts</h3>
            <p>Your neighborhood is safe and there are no urgent issues right now.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard 
              key={post.id}
              post={post}
              user={user}
              onToggleReaction={handleToggleReaction}
              onDeletePost={(postId) => {
                if (user) deletePost(postId, user.uid);
              }}
              onUpdateStatus={updatePostStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};
