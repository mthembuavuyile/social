import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { usePosts } from './hooks/usePosts';
import { Toaster } from 'react-hot-toast';

// Layout & Pages
import { AppLayout } from './components/Layout/AppLayout';
import { Home } from './pages/Home';
import { MapView } from './pages/MapView';
import { Settings } from './pages/Settings';
import { UserProfile } from './pages/UserProfile';
import { PostDetail } from './pages/PostDetail';
import { Terms } from './pages/Terms';
import { NotFound } from './pages/NotFound';
import { EmergencyContacts } from './pages/EmergencyContacts';
import { Alerts } from './pages/Alerts';
import { DevAdmin } from './pages/DevAdmin';
import { PostComposer } from './components/Feed/PostComposer';
import { Post } from './types';
import { X } from 'lucide-react';

function AppContent() {
  const { user, updateUserName } = useAuth();
  const { posts, loading: postsLoading, createPost, updatePostStatus, deletePost } = usePosts();

  // Shared Global State for Filtering and Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);

  // Apply dark theme dynamically to body
  useEffect(() => {
    document.body.className = 'theme-twitter-dark';
  }, []);

  return (
    <AppLayout
      user={user}
      posts={posts}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
      activeFilter={activeFilter}
      onSelectFilter={setActiveFilter}
      onOpenComposerModal={() => setIsComposerModalOpen(true)}
    >
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              user={user} 
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              posts={posts}
              postsLoading={postsLoading}
              createPost={createPost}
              updatePostStatus={updatePostStatus}
              deletePost={deletePost}
            />
          } 
        />
        <Route 
          path="/post/:postId" 
          element={<PostDetail user={user} />} 
        />
        <Route 
          path="/map" 
          element={<MapView user={user} />} 
        />
        <Route 
          path="/alerts" 
          element={
            <Alerts 
              user={user}
              searchQuery={searchQuery}
              posts={posts}
              postsLoading={postsLoading}
              updatePostStatus={updatePostStatus}
              deletePost={deletePost}
            />
          } 
        />
        <Route 
          path="/emergency" 
          element={<EmergencyContacts />} 
        />
        <Route 
          path="/settings" 
          element={<Settings user={user} updateUserName={updateUserName} />} 
        />
        <Route 
          path="/profile/:uid" 
          element={<UserProfile user={user} />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Navigate to={`/profile/${user.uid}`} replace /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/terms" 
          element={<Terms />} 
        />
        <Route 
          path="/privacy" 
          element={<Terms />} 
        />
        <Route 
          path="/policy" 
          element={<Terms />} 
        />
        <Route 
          path="/policy.html" 
          element={<Terms />} 
        />
        <Route 
          path="/dev-admin" 
          element={<DevAdmin />} 
        />
        <Route 
          path="/index.html" 
          element={<Navigate to="/" replace />} 
        />
        <Route 
          path="/404" 
          element={<NotFound />} 
        />
        <Route 
          path="*" 
          element={<NotFound />} 
        />
      </Routes>

      {/* Optional Report Issue Modal */}
      {isComposerModalOpen && (
        <div className="composer-modal-overlay" onClick={() => setIsComposerModalOpen(false)}>
          <div className="composer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Civic Issue</h3>
              <button className="modal-close-btn" onClick={() => setIsComposerModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <PostComposer 
              user={user}
              onSubmitPost={async (data) => {
                await createPost({
                  ...data,
                  category: data.category as Post['category'],
                  author: user?.displayName || 'Citizen',
                  authorUid: user?.uid || '',
                  reportType: data.reportType,
                  crimeUrgency: data.crimeUrgency as Post['crimeUrgency'],
                  incidentTime: data.incidentTime,
                  policeContacted: data.policeContacted,
                  caseNumber: data.caseNumber,
                  anonymous: data.anonymous,
                });
                setIsComposerModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--surface-color)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
          },
          success: {
            iconTheme: {
              primary: 'var(--accent-success)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--accent-danger)',
              secondary: 'white',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}
