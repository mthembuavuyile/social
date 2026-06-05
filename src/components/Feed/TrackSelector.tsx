import React from 'react';

type TrackValue = 'all' | 'civic' | 'gig' | 'project';

interface TrackSelectorProps {
  value: TrackValue;
  onChange: (track: TrackValue) => void;
  showAll?: boolean; // Show "All" tab (for feed filter)
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  value,
  onChange,
  showAll = false,
}) => {
  const tracks: { key: TrackValue; icon: string; label: string }[] = [
    ...(showAll ? [{ key: 'all' as TrackValue, icon: '📋', label: 'All Tracks' }] : []),
    { key: 'civic', icon: '🤝', label: 'Civic Action' },
    { key: 'gig', icon: '🔧', label: 'Gig / Service' },
    { key: 'project', icon: '🌍', label: 'Project' },
  ];

  return (
    <div className="track-selector">
      {tracks.map(track => (
        <button
          key={track.key}
          type="button"
          data-track={track.key}
          className={`track-selector-btn ${value === track.key ? 'active' : ''}`}
          onClick={() => onChange(track.key)}
        >
          <span>{track.icon}</span>
          <span>{track.label}</span>
        </button>
      ))}
    </div>
  );
};
