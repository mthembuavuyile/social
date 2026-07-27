import React, { useMemo, useEffect } from 'react';
import { PostComposer } from '../components/Feed/PostComposer';
import { PostCard } from '../components/Feed/PostCard';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { dbFirestore } from '../firebase';
import toast from 'react-hot-toast';
import { Post } from '../types';
import { Sparkles, AlertCircle, CheckCircle2, Flame, Inbox } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HomeProps {
  user: { uid: string; displayName: string } | null;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  selectedCategory: string;
  searchQuery: string;
  posts: Post[];
  postsLoading: boolean;
  createPost: (data: Partial<Post>) => Promise<void>;
  updatePostStatus: (postId: string, status: 'active' | 'in_progress' | 'resolved') => Promise<void>;
  deletePost: (postId: string, uid: string) => Promise<void>;
}

export const Home: React.FC<HomeProps> = ({ 
  user,
  activeFilter,
  onSelectFilter,
  selectedCategory,
  searchQuery,
  posts,
  postsLoading,
  createPost,
  updatePostStatus,
  deletePost,
}) => {
  const location = useLocation();

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

  // Auto Scroll & Highlight target post if hash or query param is present
  useEffect(() => {
    if (postsLoading || posts.length === 0) return;

    let targetId = '';
    const hash = window.location.hash;
    if (hash && hash.startsWith('#post-')) {
      targetId = hash.replace('#post-', '');
    } else {
      const params = new URLSearchParams(location.search);
      targetId = params.get('post') || '';
    }

    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(`post-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('post-card-highlighted');
          setTimeout(() => el.classList.remove('post-card-highlighted'), 3000);
        }
      }, 300);
    }
  }, [location, postsLoading, posts]);

  // Filter Logic
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // 1. Status/Urgency Filter
      if (activeFilter === 'active' && post.status !== 'active') return false;
      if (activeFilter === 'resolved' && post.status !== 'resolved') return false;
      if (activeFilter === 'urgent') {
        const upvotes = post.reactions?.['👍'] || 0;
        if (upvotes < 1 && post.status === 'resolved') return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && post.category !== selectedCategory) {
        return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const contentMatch = post.content?.toLowerCase().includes(q);
        const locationMatch = post.location?.toLowerCase().includes(q);
        const authorMatch = post.author?.toLowerCase().includes(q);
        const categoryMatch = post.category?.toLowerCase().includes(q);
        return contentMatch || locationMatch || authorMatch || categoryMatch;
      }

      return true;
    }).sort((a, b) => {
      if (activeFilter === 'urgent') {
        const upvotesA = a.reactions?.['👍'] || 0;
        const upvotesB = b.reactions?.['👍'] || 0;
        return upvotesB - upvotesA;
      }
      return b.timestamp - a.timestamp;
    });
  }, [posts, activeFilter, selectedCategory, searchQuery]);

  return (
    <div className="home-feed-page">
      {/* Sticky Header with Feed Tabs */}
      <div className="feed-header-sticky">
        <div className="feed-header-top">
          <h2 className="feed-title">Home Feed</h2>
          <span className="feed-badge">{filteredPosts.length} Reports</span>
        </div>

        {/* Tab Selector */}
        <div className="feed-tabs">
          <button 
            className={`feed-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => onSelectFilter('all')}
          >
            <Sparkles size={16} />
            <span>All Issues</span>
          </button>

          <button 
            className={`feed-tab ${activeFilter === 'urgent' ? 'active' : ''}`}
            onClick={() => onSelectFilter('urgent')}
          >
            <Flame size={16} color="#ff9a00" />
            <span>Urgent</span>
          </button>

          <button 
            className={`feed-tab ${activeFilter === 'active' ? 'active' : ''}`}
            onClick={() => onSelectFilter('active')}
          >
            <AlertCircle size={16} color="#f4212e" />
            <span>Open</span>
          </button>

          <button 
            className={`feed-tab ${activeFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => onSelectFilter('resolved')}
          >
            <CheckCircle2 size={16} color="var(--accent-success)" />
            <span>Resolved</span>
          </button>
        </div>
      </div>

      {/* Composer Section */}
      <div className="composer-container" style={{ marginTop: '16px' }}>
        <PostComposer 
          user={user}
          onSubmitPost={async (data) => {
            await createPost({
              ...data,
              category: data.category as Post['category'],
              author: user?.displayName || 'Citizen',
              authorUid: user?.uid || '',
            });
            toast.success('Civic issue reported successfully!');
          }}
        />
      </div>

      {/* Active Filter Indicators */}
      {(selectedCategory !== 'all' || searchQuery) && (
        <div className="filter-active-bar" style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '16px 0 8px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Filtered by:</span>
          {selectedCategory !== 'all' && (
            <span className="filter-tag">Category: {selectedCategory.replace('_', ' ')}</span>
          )}
          {searchQuery && (
            <span className="filter-tag">Search: "{searchQuery}"</span>
          )}
        </div>
      )}

      {/* Feed Cards Stream */}
      <div className="feed" style={{ marginTop: '16px' }}>
        {postsLoading ? (
          <div className="feed-loading-state">
            <div className="spinner"></div>
            <span>Loading community reports...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="feed-empty-state">
            <Inbox size={48} color="var(--text-muted)" />
            <h3>No reports found</h3>
            <p>
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try broadening your search or clearing active filters.' 
                : 'Be the first citizen to report an issue in your area!'}
            </p>
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
