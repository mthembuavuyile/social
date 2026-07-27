import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, MapPin, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      {/* 404 Visual Icon Badge */}
      <div style={{
        position: 'relative',
        marginBottom: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(29, 155, 240, 0.1)',
          border: '1px solid rgba(29, 155, 240, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(29, 155, 240, 0.15)'
        }}>
          <Compass size={48} color="var(--accent-primary)" />
        </div>
        <span style={{
          position: 'absolute',
          bottom: '-6px',
          right: '-6px',
          background: 'var(--accent-danger)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.75rem',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          border: '2px solid var(--bg-color)'
        }}>
          404
        </span>
      </div>

      {/* Heading & Subtitle */}
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 800, 
        color: 'var(--text-main)', 
        marginBottom: '12px',
        letterSpacing: '-0.02em'
      }}>
        Page Not Found
      </h1>
      
      <p style={{ 
        color: 'var(--text-muted)', 
        fontSize: '1rem', 
        maxWidth: '440px', 
        lineHeight: 1.6, 
        marginBottom: '32px' 
      }}>
        The page or report route you are trying to reach doesn't exist, has been removed, or has moved to another address.
      </p>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'wrap', 
        justifyContent: 'center' 
      }}>
        <Link 
          to="/" 
          className="btn-primary" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 20px', 
            borderRadius: 'var(--radius-pill)', 
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          <Home size={18} />
          <span>Return to Feed</span>
        </Link>

        <Link 
          to="/map" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 20px', 
            borderRadius: 'var(--radius-pill)', 
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
        >
          <MapPin size={18} color="var(--accent-primary)" />
          <span>Explore Issue Map</span>
        </Link>
      </div>

      {/* Direct Back Link */}
      <div style={{ marginTop: '28px' }}>
        <button 
          onClick={() => window.history.back()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.88rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ArrowLeft size={15} />
          <span>Go back to previous page</span>
        </button>
      </div>
    </div>
  );
};
