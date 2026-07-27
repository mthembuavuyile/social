import React from 'react';

export const getInitials = (name: string): string => {
  return (name || '??').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

export const getUserColor = (name: string): [string, string] => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const gradients: [string, string][] = [
    ['#4fc3f7', '#a78bfa'], // blue → purple
    ['#f87171', '#fb923c'], // red → orange
    ['#34d399', '#4fc3f7'], // green → blue
    ['#f472b6', '#a78bfa'], // pink → purple
    ['#fb923c', '#fbbf24'], // orange → yellow
    ['#a78bfa', '#f472b6'], // purple → pink
    ['#34d399', '#a78bfa'], // green → purple
    ['#60a5fa', '#34d399'], // blue → green
  ];
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export const timeAgo = (ts: number): string => {
  if (!ts) return '';
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return `${Math.max(1, Math.floor(s))}s`;
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatRichTextReact = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Split the text into lines first to preserve line breaks
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    // Regex matches URLs and hashtags
    const tokenRegex = /(https?:\/\/[^\s]+|#[\w-]+)/g;
    const parts = line.split(tokenRegex);
    
    const formattedLine = parts.map((part, partIdx) => {
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a key={partIdx} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      } else if (part.startsWith('#')) {
        return (
          <span key={partIdx} className="hashtag">
            {part}
          </span>
        );
      }
      return part;
    });

    return (
      <React.Fragment key={lineIdx}>
        {formattedLine}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export interface TwitterInfo {
  username: string;
  tweetId: string;
  originalUrl: string;
}

export const parseTwitterUrl = (url?: string): TwitterInfo | null => {
  if (!url) return null;
  const regex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/i;
  const match = url.match(regex);
  if (!match) return null;
  return {
    username: match[1],
    tweetId: match[2],
    originalUrl: match[0],
  };
};

export const extractTwitterUrlFromText = (text?: string): string | null => {
  if (!text) return null;
  const regex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+/i;
  const match = text.match(regex);
  return match ? match[0] : null;
};

