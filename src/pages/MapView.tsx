import React, { useState } from 'react';
import { CivicMap } from '../components/Map/CivicMap';
import { usePosts, fetchComments, addComment } from '../hooks/usePosts';
import { PostCard } from '../components/Feed/PostCard';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { dbFirestore } from '../firebase';
import toast from 'react-hot-toast';
import { MapPin, List } from 'lucide-react';

interface MapViewProps {
  user: { uid: string; displayName: string } | null;
}

export const MapView: React.FC<MapViewProps> = ({ user }) => {
  const { posts, loading, updatePostStatus, deletePost } = usePosts();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const selectedPost = posts.find((p) => p.id === selectedPostId);

  const handleToggleReaction = async (postId: string, emoji: string) => {
    if (!user) {
      toast.error('You must be logged in.');
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

  const geocodedPosts = posts.filter(p => p.latitude !== undefined && p.longitude !== undefined);

  return (
    <div className="map-page-container">
      <div className="feed-header-sticky">
        <div className="feed-title-bar">
          <MapPin size={22} color="var(--accent-primary)" />
          <h2>Interactive Civic Issue Map</h2>
        </div>
        <span className="feed-subtitle">
          Showing {geocodedPosts.length} location-pinned issues out of {posts.length} total reports.
        </span>
      </div>

      <div className="map-view-wrapper" style={{ height: '520px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', marginTop: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Loading map data...
          </div>
        ) : (
          <CivicMap 
            posts={posts}
            activePostId={selectedPostId}
            onViewPost={(id) => setSelectedPostId(id)}
          />
        )}
      </div>

      {/* Selected Marker Post Inspector */}
      {selectedPost && (
        <div className="map-selected-post-preview" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <List size={16} /> Selected Map Marker
            </span>
            <button 
              onClick={() => setSelectedPostId(null)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Close Preview ✕
            </button>
          </div>
          <PostCard 
            post={selectedPost}
            user={user}
            onToggleReaction={handleToggleReaction}
            onDeletePost={(postId) => {
              if (user) deletePost(postId, user.uid);
            }}
            onUpdateStatus={updatePostStatus}
            fetchComments={fetchComments}
            onAddComment={(postId, text) => {
              if (user) {
                addComment(postId, text, { uid: user.uid, displayName: user.displayName });
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
