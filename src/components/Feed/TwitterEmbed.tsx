import React, { useEffect, useRef, useState } from 'react';
import { parseTwitterUrl } from '../../utils';
import { ExternalLink, MessageCircle } from 'lucide-react';

interface TwitterEmbedProps {
  url: string;
}

const XIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

declare global {
  interface Window {
    twttr?: any;
  }
}

export const TwitterEmbed: React.FC<TwitterEmbedProps> = ({ url }) => {
  const twitterInfo = parseTwitterUrl(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);

  useEffect(() => {
    if (!twitterInfo || !containerRef.current) return;

    let isMounted = true;
    containerRef.current.innerHTML = '';

    const renderTweet = () => {
      if (window.twttr && window.twttr.widgets && containerRef.current) {
        window.twttr.widgets.createTweet(twitterInfo.tweetId, containerRef.current, {
          theme: 'dark',
          align: 'center',
          conversation: 'none',
        }).then((el: HTMLElement | null) => {
          if (isMounted && el) {
            setEmbedLoaded(true);
          }
        }).catch(() => {
          if (isMounted) setEmbedLoaded(false);
        });
      }
    };

    if (window.twttr && window.twttr.widgets) {
      renderTweet();
    } else {
      // Load Twitter widgets script dynamically if not present
      const existingScript = document.getElementById('twitter-wjs');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'twitter-wjs';
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => {
          if (isMounted) renderTweet();
        };
        script.onerror = () => {
          if (isMounted) setEmbedLoaded(false);
        };
        try {
          document.head.appendChild(script);
        } catch {
          if (isMounted) setEmbedLoaded(false);
        }
      } else {
        existingScript.addEventListener('load', renderTweet);
        existingScript.addEventListener('error', () => {
          if (isMounted) setEmbedLoaded(false);
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [url, twitterInfo?.tweetId]);

  if (!twitterInfo) return null;

  return (
    <div className="twitter-embed-container" style={{ marginTop: '12px', marginBottom: '12px' }}>
      <div 
        ref={containerRef} 
        style={{ display: embedLoaded ? 'block' : 'none', width: '100%' }} 
      />

      {!embedLoaded && (
        <div 
          className="twitter-fallback-card" 
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(29, 155, 240, 0.3)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1d9bf0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XIcon size={14} color="white" />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                @{twitterInfo.username}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(29, 155, 240, 0.1)', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MessageCircle size={12} color="#1d9bf0" /> X / Twitter Post
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Referenced X/Twitter post status: <code style={{ color: '#1d9bf0' }}>#{twitterInfo.tweetId}</code>
          </div>

          <a 
            href={twitterInfo.originalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#1d9bf0',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              marginTop: '4px',
              width: 'fit-content',
            }}
          >
            <span>View Post on X</span>
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
};
