import React, { useState, useRef } from 'react';
import { getInitials, getUserColor } from '../../utils';
import { Camera, X, Send, AlertCircle, MapPin, Loader2 } from 'lucide-react';

interface PostComposerProps {
  user: string;
  onSubmitPost: (
    content: string,
    imageUrl: string,
    category: string,
    location: string,
    latitude?: number,
    longitude?: number,
    isCrowdfunded?: boolean,
    bountyGoal?: number
  ) => Promise<void>;
  onSwitchView: (view: 'home' | 'explore' | 'profile' | 'dao') => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  user,
  onSubmitPost,
  onSwitchView,
  showToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('pothole');
  const [location, setLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Expanded fields for Crowdfunding and Geolocation
  const [isCrowdfunded, setIsCrowdfunded] = useState(false);
  const [bountyGoal, setBountyGoal] = useState<number>(500);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (user === 'Guest') {
      showToast('Please set your username in Profile first!', 'error');
      onSwitchView('profile');
      return;
    }
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setContent('');
    setImageUrl('');
    setCategory('pothole');
    setLocation('');
    setIsCrowdfunded(false);
    setBountyGoal(500);
    setLatitude(undefined);
    setLongitude(undefined);
    setIsExpanded(false);
  };

  const handlePost = async () => {
    const trimmedContent = content.trim();
    const trimmedImg = imageUrl.trim();
    const trimmedLoc = location.trim();

    if (!trimmedContent) {
      showToast('Please describe the issue.', 'error');
      return;
    }
    if (!trimmedLoc) {
      showToast('Please specify the location.', 'error');
      return;
    }

    setIsPosting(true);
    try {
      await onSubmitPost(
        trimmedContent,
        trimmedImg,
        category,
        trimmedLoc,
        latitude,
        longitude,
        isCrowdfunded,
        isCrowdfunded ? bountyGoal : undefined
      );
      showToast('Report submitted! Local fixers notified.', 'success');
      handleCancel();
    } catch (err) {
      showToast('Failed to submit report.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const sampleImages: Record<string, string> = {
    pothole: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    water_leak: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80',
    traffic_light: 'https://images.unsplash.com/photo-1510936111840-65e151ad74b7?auto=format&fit=crop&w=600&q=80',
    electricity: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    sewage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
  };

  const handlePrefillImage = () => {
    const sample = sampleImages[category] || 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80';
    setImageUrl(sample);
    showToast('Prefilled a demo photo! 📸', 'info');
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        showToast(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 'info');

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          if (response.ok) {
            const data = await response.json();
            const addr = data.address;
            const road = addr.road || addr.street || addr.suburb || '';
            const suburb = addr.city_district || addr.suburb || addr.city || addr.town || '';
            const resolvedAddress = [road, suburb].filter(Boolean).join(', ');
            if (resolvedAddress) {
              setLocation(resolvedAddress);
              showToast(`Resolved Address: ${resolvedAddress}`, 'success');
            } else {
              setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            }
          } else {
            setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch (err) {
          console.error(err);
          setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error(error);
        showToast(`Failed to get location: ${error.message}`, 'error');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setImageUrl(dataUrl);
          showToast('Photo processed successfully! 📸', 'success');
        } else {
          setImageUrl(event.target?.result as string);
          showToast('Photo loaded! 📸', 'success');
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        showToast('Failed to load image', 'error');
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      showToast('Failed to read file', 'error');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const initials = getInitials(user);
  const [c1, c2] = getUserColor(user);
  const avatarStyle = {
    background: `linear-gradient(135deg, ${c1}, ${c2})`,
  };

  const payoutMap: Record<string, string> = {
    pothole: 'R250',
    water_leak: 'R200',
    electricity: 'R150',
    sewage: 'R400',
    traffic_light: 'R300',
    other: 'R150'
  };

  return (
    <div className="composer">
      <div className="composer-top">
        <div className="user-avatar" style={avatarStyle}>
          {initials}
        </div>
        <textarea
          className="compose-input"
          placeholder="Report an issue (pothole, water leak, broken traffic light...)"
          rows={isExpanded ? 3 : 1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={handleFocus}
        />
      </div>

      {/* Visual Image Preview Thumbnail */}
      {isExpanded && imageUrl.trim() && (
        <div className="image-preview-wrapper">
          <img src={imageUrl.trim()} alt="Issue Preview" />
          <button type="button" className="remove-preview-btn" onClick={handleRemoveImage}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className={`composer-extras ${isExpanded ? 'active' : ''}`}>
        <div className="extras-inputs">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Category</label>
              <select
                className="standard-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ background: 'var(--surface-color)', color: 'var(--text-main)' }}
              >
                <option value="pothole">🕳 Pothole</option>
                <option value="water_leak">🚰 Water Leak</option>
                <option value="electricity">⚡ Electricity Outage</option>
                <option value="sewage">💩 Sewage Overflow</option>
                <option value="traffic_light">🚥 Broken Traffic Light</option>
                <option value="other">🛠 Other Issue</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location (Street & Suburb)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="standard-input"
                  placeholder="e.g. Rivonia Rd, Sandton"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleDetectLocation}
                  style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                  disabled={isLocating}
                  title="Detect GPS Location"
                >
                  {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                  <span style={{ fontSize: '0.75rem' }}>GPS</span>
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Photo Evidence (Upload or URL)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="url"
                className="standard-input"
                placeholder="Paste photo URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-cancel"
                onClick={triggerFileInput}
                disabled={isUploading}
                style={{ padding: '10px 14px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                <span>Upload</span>
              </button>
              <button
                type="button"
                className="btn-primary btn-small"
                onClick={handlePrefillImage}
                style={{ borderRadius: 'var(--radius-md)', padding: '10px 14px', whiteSpace: 'nowrap' }}
                title="Click to insert a sample photo matching the selected category"
              >
                <Camera size={15} />
              </button>
            </div>
          </div>

          {/* Crowdfunding Toggle Box */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginTop: '8px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setIsCrowdfunded(!isCrowdfunded)}>
              <input 
                type="checkbox" 
                checked={isCrowdfunded}
                onChange={() => {}} // handled by parent div click
              />
              <strong style={{ fontSize: '0.85rem' }}>Enable Crowdfunded Bounty Goal</strong>
            </div>
            {isCrowdfunded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '150px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target:</span>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>R</span>
                  <input 
                    type="number"
                    className="standard-input"
                    value={bountyGoal}
                    onChange={(e) => setBountyGoal(Math.max(50, parseInt(e.target.value) || 0))}
                    style={{ paddingLeft: '24px', flex: 1 }}
                    min={50}
                  />
                </div>
              </div>
            )}
          </div>

        </div>
        
        <div className="composer-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
          <span className="char-counter" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={14} style={{ color: 'var(--accent-primary)' }} />
            {isCrowdfunded ? (
              <span>Crowdfunding Target: <strong style={{ color: 'var(--accent-primary)' }}>R{bountyGoal}</strong></span>
            ) : (
              <span>Base Compensation: <strong style={{ color: 'var(--accent-success)' }}>{payoutMap[category] || 'R150'}</strong></span>
            )}
          </span>
          <div className="composer-actions">
            <button className="btn-cancel" onClick={handleCancel} disabled={isPosting}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handlePost}
              disabled={isPosting || !content.trim() || !location.trim()}
            >
              <Send size={14} />
              <span>Submit Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
