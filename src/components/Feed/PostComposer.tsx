import React, { useState, useRef } from 'react';
import { getInitials, getUserColor } from '../../utils';
import { Camera, X, Send, MapPin, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

const MAX_CONTENT_LENGTH = 2000;
const MAX_LOCATION_LENGTH = 200;
const MAX_CITY_LENGTH = 100;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local preview for uploaded file (before submission)
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFocus = () => setIsExpanded(true);

  const handleCancel = () => {
    setContent('');
    setImagePreview('');
    setUploadedFile(null);
    setLocation('');
    setProvince('Gauteng');
    setCity('');
    setCategory('pothole');
    setLatitude(undefined);
    setLongitude(undefined);
    setIsExpanded(false);
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    if (!user) throw new Error('Must be authenticated to upload.');

    // Generate a unique path: posts/{userId}/{timestamp}_{filename}
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `posts/${user.uid}/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    return getDownloadURL(storageRef);
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
      // Upload image to Firebase Storage if a file was selected
      let finalImageUrl = '';
      if (uploadedFile) {
        finalImageUrl = await uploadImageToStorage(uploadedFile);
      }

      await onSubmitPost({
        content: trimmedContent,
        imageUrl: finalImageUrl,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast('Only JPEG, PNG, GIF, and WebP images are allowed.', 'error');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast(`Image must be under ${MAX_FILE_SIZE_MB}MB.`, 'error');
      return;
    }

    // Store the file for later upload, and create a local preview
    setUploadedFile(file);
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setIsUploading(false);
    };
    reader.onerror = () => {
      showToast('Failed to read file', 'error');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const initials = getInitials(user?.displayName || 'Citizen');
  const [c1, c2] = getUserColor(user?.displayName || 'Citizen');
  const avatarStyle = { background: `linear-gradient(135deg, ${c1}, ${c2})` };

  const currentPreview = imagePreview;

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

      {isExpanded && currentPreview && (
        <div className="image-preview-wrapper" style={{ marginTop: '10px', position: 'relative' }}>
          <img src={currentPreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />
          <button type="button" className="remove-preview-btn" onClick={handleRemoveImage} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '4px' }}>
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
              <button type="button" onClick={handleDetectLocation} disabled={isLocating} style={{ padding: '8px 12px', borderRadius: '4px', background: 'var(--accent-primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Photo Evidence</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ padding: '8px 16px', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                {uploadedFile ? 'Change Photo' : 'Upload Photo'}
              </button>
              {uploadedFile && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(1)}MB)
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              Accepted: JPEG, PNG, GIF, WebP — Max {MAX_FILE_SIZE_MB}MB
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
