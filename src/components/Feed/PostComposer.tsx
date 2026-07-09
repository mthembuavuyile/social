import React, { useState } from 'react';
import { getInitials, getUserColor } from '../../utils';
import { X, Send, MapPin, Loader2, Link } from 'lucide-react';

const MAX_CONTENT_LENGTH = 2000;
const MAX_LOCATION_LENGTH = 200;
const MAX_CITY_LENGTH = 100;
const MAX_IMAGE_URL_LENGTH = 1000;

interface PostComposerProps {
  user: { uid: string; displayName: string } | null;
  onSubmitPost: (data: {
    content: string;
    imageUrl: string;
    category: string;
    location: string;
    province?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ user, onSubmitPost, showToast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [province, setProvince] = useState('Gauteng');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('pothole');
  const [isPosting, setIsPosting] = useState(false);

  // Geolocation
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);

  // Image URL instead of file upload
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const handleFocus = () => setIsExpanded(true);

  const handleCancel = () => {
    setContent('');
    setImageUrl('');
    setImagePreviewError(false);
    setLocation('');
    setProvince('Gauteng');
    setCity('');
    setCategory('pothole');
    setLatitude(undefined);
    setLongitude(undefined);
    setIsExpanded(false);
  };

  const handlePost = async () => {
    if (!user) {
      showToast('You must be logged in to post.', 'error');
      return;
    }
    const trimmedContent = content.trim();
    const trimmedLoc = location.trim();

    if (!trimmedContent || !trimmedLoc) {
      showToast('Please provide a description and location.', 'error');
      return;
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      showToast(`Description must be under ${MAX_CONTENT_LENGTH} characters.`, 'error');
      return;
    }

    setIsPosting(true);
    try {
      await onSubmitPost({
        content: trimmedContent,
        imageUrl: imageUrl.trim(),
        category,
        location: trimmedLoc,
        province,
        city: city.trim(),
        latitude,
        longitude,
      });
      showToast('Issue reported successfully!', 'success');
      handleCancel();
    } catch (err) {
      showToast('Failed to submit report.', 'error');
    } finally {
      setIsPosting(false);
    }
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
        setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setIsLocating(false);
        showToast('Location detected.', 'success');
      },
      (error) => {
        showToast(`Failed to get location: ${error.message}`, 'error');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePreviewError(false);
  };

  const initials = getInitials(user?.displayName || 'Citizen');
  const [c1, c2] = getUserColor(user?.displayName || 'Citizen');
  const avatarStyle = { background: `linear-gradient(135deg, ${c1}, ${c2})` };

  const hasValidImageUrl = imageUrl.trim().length > 0 && !imagePreviewError;

  return (
    <div className="composer">
      <div className="composer-top">
        <div className="user-avatar" style={avatarStyle}>{initials}</div>
        <textarea
          className="compose-input"
          placeholder="Report a civic issue (pothole, water leak, broken traffic light...)"
          rows={isExpanded ? 3 : 1}
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CONTENT_LENGTH) {
              setContent(e.target.value);
            }
          }}
          onFocus={handleFocus}
          maxLength={MAX_CONTENT_LENGTH}
        />
      </div>

      {isExpanded && content.length > 0 && (
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: content.length > MAX_CONTENT_LENGTH * 0.9 ? 'var(--accent-danger)' : 'var(--text-muted)', marginTop: '4px' }}>
          {content.length}/{MAX_CONTENT_LENGTH}
        </div>
      )}

      {isExpanded && hasValidImageUrl && (
        <div className="image-preview-wrapper" style={{ marginTop: '10px', position: 'relative' }}>
          <img
            src={imageUrl.trim()}
            alt="Preview"
            style={{ maxWidth: '100%', borderRadius: '8px' }}
            onError={() => setImagePreviewError(true)}
          />
          <button type="button" className="remove-preview-btn" onClick={handleRemoveImage} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className={`composer-extras ${isExpanded ? 'active' : ''}`} style={{ display: isExpanded ? 'block' : 'none', marginTop: '12px' }}>
        <div className="extras-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category</label>
              <select className="standard-input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                <option value="pothole">🕳 Pothole</option>
                <option value="water_leak">🚰 Water Leak</option>
                <option value="electricity">⚡ Electricity Outage</option>
                <option value="sewage">💩 Sewage Overflow</option>
                <option value="traffic_light">🚥 Broken Traffic Light</option>
                <option value="other">🛠 Other</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Province</label>
              <select className="standard-input" value={province} onChange={(e) => setProvince(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                <option value="Eastern Cape">Eastern Cape</option>
                <option value="Free State">Free State</option>
                <option value="Gauteng">Gauteng</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                <option value="Limpopo">Limpopo</option>
                <option value="Mpumalanga">Mpumalanga</option>
                <option value="North West">North West</option>
                <option value="Northern Cape">Northern Cape</option>
                <option value="Western Cape">Western Cape</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Location</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="standard-input"
                placeholder="e.g. Rivonia Rd, Sandton"
                value={location}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_LOCATION_LENGTH) {
                    setLocation(e.target.value);
                  }
                }}
                maxLength={MAX_LOCATION_LENGTH}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}
              />
              <button type="button" onClick={handleDetectLocation} disabled={isLocating} style={{ padding: '8px 12px', borderRadius: '4px', background: 'var(--accent-primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                GPS
              </button>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>City</label>
            <input
              type="text"
              className="standard-input"
              placeholder="e.g. Johannesburg"
              value={city}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CITY_LENGTH) {
                  setCity(e.target.value);
                }
              }}
              maxLength={MAX_CITY_LENGTH}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Photo Evidence (Image URL)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Link size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="url"
                  className="standard-input"
                  placeholder="https://example.com/photo.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_IMAGE_URL_LENGTH) {
                      setImageUrl(e.target.value);
                      setImagePreviewError(false);
                    }
                  }}
                  maxLength={MAX_IMAGE_URL_LENGTH}
                  style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}
                />
              </div>
              {imageUrl.trim() && (
                <button type="button" onClick={handleRemoveImage} style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {imagePreviewError && imageUrl.trim() && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', marginTop: '4px', marginBottom: 0 }}>
                ⚠ Could not load image. Check the URL is a direct link to an image.
              </p>
            )}
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              Paste a direct link to an image (JPEG, PNG, GIF, WebP)
            </p>
          </div>
        </div>

        <div className="composer-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn-cancel" onClick={handleCancel} disabled={isPosting} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          <button className="btn-primary" onClick={handlePost} disabled={isPosting || !content.trim() || !location.trim()} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: isPosting || !content.trim() || !location.trim() ? 0.5 : 1 }}>
            <Send size={14} />
            {isPosting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};
