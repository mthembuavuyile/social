import { useState, useEffect } from 'react';
import { usePosts } from './hooks/usePosts';
import { useAuth } from './hooks/useAuth';
import { PostComposer } from './components/Feed/PostComposer';
import { PostCard } from './components/Feed/PostCard';
import { Toast } from './components/Layout/Toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { dbFirestore } from './firebase';
import { Home, User, AlertTriangle } from 'lucide-react';

export default function App() {
  const { user, updateUserName } = useAuth();
  const { posts, loading: postsLoading, createPost, updatePostStatus, deletePost } = usePosts();
  
  const [activeView, setActiveView] = useState<'home' | 'profile'>('home');
  const [profileNameInput, setProfileNameInput] = useState('');
  
  // Toast System
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'info',
    show: false,
  });

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type, show: true });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    if (user?.displayName) {
      setProfileNameInput(user.displayName);
    }
  }, [user]);

  // Apply theme dynamically to body
  useEffect(() => {
    document.body.className = 'theme-twitter-dark';
  }, []);

  const handleToggleReaction = async (postId: string, emoji: string) => {
    if (!user) {
      showToast('You must be logged in.', 'error');
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

  const handleSaveProfile = async () => {
    const trimmedName = profileNameInput.trim();
    if (!trimmedName) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    if (trimmedName.length > 50) {
      showToast('Name must be under 50 characters', 'error');
      return;
    }
    await updateUserName(trimmedName);
    showToast('Profile updated!', 'success');
  };

  return (
    <div className="app-container">
      <nav className="main-nav" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <AlertTriangle size={24} color="var(--accent-primary)" />
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>UbuntuFix</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => setActiveView('home')} style={{ background: 'transparent', border: 'none', color: activeView === 'home' ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Home size={18} /> <span className="hide-mobile">Feed</span>
          </button>
          <button onClick={() => setActiveView('profile')} style={{ background: 'transparent', border: 'none', color: activeView === 'profile' ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={18} /> <span className="hide-mobile">Profile</span>
          </button>
        </div>
      </nav>

      <main className="main-content" style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        {activeView === 'home' && (
          <>
            <PostComposer 
              user={user}
              onSubmitPost={async (data) => {
                await createPost({
                  ...data,
                  category: data.category as any,
                  author: user?.displayName || 'Citizen',
                  authorUid: user?.uid || '',
                });
              }}
              showToast={showToast}
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
        )}

        {activeView === 'profile' && (
          <div className="profile-section" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text-main)' }}>Your Profile</h2>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Display Name</label>
              <input 
                type="text" 
                value={profileNameInput} 
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    setProfileNameInput(e.target.value);
                  }
                }}
                maxLength={50}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
              />
            </div>
            <button 
              onClick={handleSaveProfile}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Save Profile
            </button>
            <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Reporting as: {user?.displayName || 'Citizen'}
            </p>
          </div>
        )}
      </main>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
}
