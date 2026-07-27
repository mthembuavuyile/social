import React from 'react';
import { usePosts } from '../hooks/usePosts';
import { PostComposer } from '../components/Feed/PostComposer';
import { PostCard } from '../components/Feed/PostCard';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { dbFirestore } from '../firebase';
import toast from 'react-hot-toast';
import { Post } from '../types';

interface HomeProps {
  user: { uid: string; displayName: string } | null;
}

export const Home: React.FC<HomeProps> = ({ user }) => {
  const { posts, loading: postsLoading, createPost, updatePostStatus, deletePost } = usePosts();

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

  return (
    <>
      <PostComposer 
        user={user}
        onSubmitPost={async (data) => {
          await createPost({
            ...data,
            category: data.category as Post['category'],
            author: user?.displayName || 'Citizen',
            authorUid: user?.uid || '',
          });
        }}
      />
      
      <div className="feed" style={{ marginTop: '24px' }}>
        {postsLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading issues...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No civic issues reported yet.</div>
        ) : (
          posts.map((post) => (
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
    </>
  );
};
