import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { dbFirestore } from '../firebase';
import { Post } from '../types';
import { PostCard } from '../components/Feed/PostCard';
import { fetchComments, addComment } from '../hooks/usePosts';
import { ArrowLeft, Share2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface PostDetailProps {
  user: { uid: string; displayName: string } | null;
}

export const PostDetail: React.FC<PostDetailProps> = ({ user }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    
    const fetchPost = async () => {
      try {
        const postRef = doc(dbFirestore, 'posts', postId);
        const snap = await getDoc(postRef);
        if (snap.exists()) {
          const data = snap.data();
          setPost({
            id: snap.id,
            content: data.content || '',
            imageUrl: data.imageUrl,
            author: data.author || '',
            authorUid: data.authorUid || '',
            timestamp: data.timestamp ? (data.timestamp.toMillis ? data.timestamp.toMillis() : data.timestamp) : Date.now(),
            reactions: data.reactions || {},
            userReactions: data.userReactions || {},
            category: data.category,
            location: data.location,
            province: data.province,
            city: data.city,
            status: data.status || 'active',
            latitude: data.latitude,
            longitude: data.longitude,
            socialUrl: data.socialUrl,
          });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleToggleReaction = async (emoji: string) => {
    if (!user || !post) {
      toast.error('You must be logged in to endorse issues.');
      return;
    }
    const postRef = doc(dbFirestore, 'posts', post.id);
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
    setPost({
      ...post,
      reactions: newReactions,
      userReactions: newUserReactions,
    });
  };

  const handleUpdateStatus = async (status: 'active' | 'in_progress' | 'resolved') => {
    if (!post) return;
    const postRef = doc(dbFirestore, 'posts', post.id);
    await updateDoc(postRef, { status });
    setPost({ ...post, status });
    toast.success(`Status updated to ${status.replace('_', ' ')}`);
  };

  const handleCopyDirectLink = () => {
    const directUrl = `${window.location.origin}/post/${post?.id}`;
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    toast.success('Direct share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
        <span>Loading report details...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Report Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          This civic issue report may have been deleted or the link is invalid.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="btn-report-primary" 
          style={{ width: 'auto', display: 'inline-flex', padding: '10px 20px' }}
        >
          <ArrowLeft size={18} /> Back to Home Feed
        </button>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      {/* Header Sticky Back Bar */}
      <div className="post-detail-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 600, padding: '4px 0' }}
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', flex: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
          Report Details
        </h2>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleCopyDirectLink}
            className="action-btn"
            style={{ background: 'rgba(29, 155, 240, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(29, 155, 240, 0.3)', padding: '6px 12px' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span className="action-label">{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Main Single Post Card Container */}
      <div style={{ marginTop: '20px' }}>
        <PostCard 
          post={post}
          user={user}
          onToggleReaction={(_, emoji) => handleToggleReaction(emoji)}
          onDeletePost={() => {
            navigate('/');
          }}
          onUpdateStatus={(_, status) => handleUpdateStatus(status)}
          fetchComments={fetchComments}
          onAddComment={(postId, text) => {
            if (user) {
              addComment(postId, text, { uid: user.uid, displayName: user.displayName });
            }
          }}
        />
      </div>

      {/* Dedicated Share Info Box */}
      <div className="sidebar-widget" style={{ marginTop: '20px', background: 'var(--surface-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Share2 size={20} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>Share this Report with Officials & Community</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
          Share this direct URL with local municipality representatives, neighborhood watch groups, or on social media to draw attention and speed up resolution.
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            readOnly 
            value={`${window.location.origin}/post/${post.id}`} 
            style={{ flex: 1, background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--accent-primary)', fontSize: '0.85rem', outline: 'none' }}
          />
          <button 
            onClick={handleCopyDirectLink}
            className="btn-report-primary"
            style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: '0.85rem' }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};
