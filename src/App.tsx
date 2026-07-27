import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Home as HomeIcon, User, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Pages
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';

function NavLinks() {
  const location = useLocation();
  
  return (
    <div className="nav-links">
      <Link 
        to="/" 
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        <HomeIcon size={18} /> <span className="hide-mobile">Feed</span>
      </Link>
      <Link 
        to="/profile" 
        className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
      >
        <User size={18} /> <span className="hide-mobile">Profile</span>
      </Link>
      <a 
        href="/policy.html" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="nav-link nav-link-sm"
        title="Privacy Policy & Terms"
      >
        <ShieldCheck size={18} /> <span className="hide-mobile">Terms & Privacy</span>
      </a>
    </div>
  );
}

export default function App() {
  const { user, updateUserName } = useAuth();

  // Apply theme dynamically to body
  useEffect(() => {
    document.body.className = 'theme-twitter-dark';
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="nav-bar">
          <Link to="/" className="nav-brand">
            <AlertTriangle size={24} color="var(--accent-primary)" />
            <h1>Civicly</h1>
          </Link>
          <NavLinks />
        </nav>

        <main className="main-layout">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/profile" element={<Profile user={user} updateUserName={updateUserName} />} />
          </Routes>
        </main>

        <footer className="footer-text">
          <span>Civicly &copy; 2026 &bull; </span>
          <a 
            href="/policy.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            Privacy Policy & Terms
          </a>
        </footer>

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
      </div>
    </BrowserRouter>
  );
}
