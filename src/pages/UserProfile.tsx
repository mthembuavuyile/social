import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePosts, fetchComments, addComment } from '../hooks/usePosts';
import { PostCard } from '../components/Feed/PostCard';
import { getInitials, getUserColor } from '../utils';
import { ArrowLeft, Inbox, ShieldCheck, EyeOff, Settings } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { dbFirestore } from '../firebase';
import toast from 'react-hot-toast';

interface UserProfileProps {
  user: { uid: string; displayName: string } | null;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { posts, loading: postsLoading, updatePostStatus, deletePost } = usePosts();
  
  const [profileName, setProfileName] = useState<string>('Citizen');
  const [isAnonymousProfile, setIsAnonymousProfile] = useState(false);

  // We find all posts by this UID
  const userPosts = useMemo(() => {
    return posts.filter(p => p.authorUid === uid).sort((a, b) => b.timestamp - a.timestamp);
  }, [posts, uid]);

  useEffect(() => {
    if (userPosts.length > 0) {
      // Check if all their posts are anonymous, or if we can find a non-anonymous name
      const nonAnonPost = userPosts.find(p => !p.anonymous);
      if (nonAnonPost) {
        setProfileName(nonAnonPost.author || 'Citizen');
        setIsAnonymousProfile(false);
      } else {
        setProfileName('Anonymous Citizen');
        setIsAnonymousProfile(true);
      }
    }
  }, [userPosts]);

  const authorInitials = isAnonymousProfile ? '?' : getInitials(profileName);
  const [avatarBg] = getUserColor(isAnonymousProfile ? 'Anonymous' : profileName);

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

  if (postsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header Sticky Back Bar */}
      <div className="post-detail-header" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 600, padding: '4px 0' }}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="profile-card" style={{ marginBottom: '24px', textAlign: 'center', padding: '30px 20px', position: 'relative' }}>
        {user?.uid === uid && (
          <button 
            onClick={() => navigate('/settings')}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--surface-color-hover)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s ease' }}
            title="Account Settings"
          >
            <Settings size={18} />
          </button>
        )}
        <div 
          className="user-avatar" 
          style={{ 
            width: '80px', 
            height: '80px', 
            fontSize: '2rem', 
            background: isAnonymousProfile ? '#374151' : avatarBg,
            margin: '0 auto 16px auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {isAnonymousProfile ? <EyeOff size={32} /> : authorInitials}
        </div>
        
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          {profileName}
          {!isAnonymousProfile && (
            <ShieldCheck size={20} color="var(--accent-success)" title="Active Citizen" />
          )}
        </h2>
        
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          {userPosts.length} Reports Submitted
        </p>
      </div>

      {/* User's Posts Feed */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {isAnonymousProfile ? "Anonymous Reports" : "Recent Reports"}
      </h3>
      
      <div className="feed">
        {userPosts.length === 0 ? (
          <div className="feed-empty-state">
            <Inbox size={48} color="var(--text-muted)" />
            <h3>No reports found</h3>
            <p>This user hasn't submitted any reports yet.</p>
          </div>
        ) : (
          userPosts.map((post) => (
            <PostCard 
              key={post.id}
              post={post}
              user={user}
              onToggleReaction={handleToggleReaction}
              onDeletePost={(postId) => {
                if (user) deletePost(postId, user.uid);
              }}
              onUpdateStatus={updatePostStatus}
              fetchComments={fetchComments}
              onAddComment={(postId, text, parentId) => {
                if (user) {
                  addComment(postId, text, { uid: user.uid, displayName: user.displayName }, parentId);
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
