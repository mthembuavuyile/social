import React, { useState, useRef, useCallback, useMemo } from 'react';
import { getInitials, getUserColor, extractTwitterUrlFromText, parseTwitterUrl } from '../../utils';
import { X, Send, MapPin, Loader2, Image as ImageIcon, Shield, AlertTriangle, Phone, FileText, EyeOff, Clock } from 'lucide-react';
import { TwitterEmbed } from './TwitterEmbed';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { ReportType } from '../../types';
import { getContactsForCategory, formatTelUri } from '../../data/emergencyContacts';

const XIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = '#1d9bf0' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const MAX_CONTENT_LENGTH = 2000;
const MAX_LOCATION_LENGTH = 200;
const MAX_CITY_LENGTH = 100;
const MAX_SOCIAL_URL_LENGTH = 500;
const MAX_CASE_NUMBER_LENGTH = 50;

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
    socialUrl?: string;
    reportType?: ReportType;
    crimeUrgency?: string;
    incidentTime?: string;
    policeContacted?: boolean;
    caseNumber?: string;
    anonymous?: boolean;
    pollOptions?: { id: string, text: string, votes: number }[];
    pollExpiresAt?: number;
  }) => Promise<void>;
}

export const PostComposer: React.FC<PostComposerProps> = ({ user, onSubmitPost }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [province, setProvince] = useState('Gauteng');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('pothole');
  const [socialUrl, setSocialUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Report Type
  const [reportType, setReportType] = useState<ReportType>('civic');

  // Crime-specific fields
  const [crimeUrgency, setCrimeUrgency] = useState('medium');
  const [incidentTime, setIncidentTime] = useState('');
  const [policeContacted, setPoliceContacted] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  // Geolocation
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);

  // Location Autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  // Image Upload State
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Poll State
  const [addPoll, setAddPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState([{ id: '1', text: '' }, { id: '2', text: '' }]);
  const [pollExpiryDuration, setPollExpiryDuration] = useState('24'); // in hours

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storageRef = ref(storage, `posts/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      setImagePreviewError(false);
    } catch (err) {
      toast.error('Failed to upload image.');
    } finally {
      setIsUploadingImage(false);
      // Reset input value to allow uploading the same file again if removed
      e.target.value = '';
    }
  };

  const handleFocus = () => setIsExpanded(true);

  const handleCancel = () => {
    setContent('');
    setImageUrl('');
    setImagePreviewError(false);
    setLocation('');
    setProvince('Gauteng');
    setCity('');
    setCategory(reportType === 'crime' ? 'theft' : 'pothole');
    setSocialUrl('');
    setLatitude(undefined);
    setLongitude(undefined);
    setReportType('civic');
    setCrimeUrgency('medium');
    setIncidentTime('');
    setPoliceContacted(false);
    setCaseNumber('');
    setAnonymous(false);
    setAddPoll(false);
    setPollOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);
    setPollExpiryDuration('24');
    setIsExpanded(false);
  };

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    // Reset category to the first option for the new type
    if (type === 'crime') {
      setCategory('theft');
    } else {
      setCategory('pothole');
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CONTENT_LENGTH) {
      setContent(val);
      // Auto detect X/Twitter URL in pasted content
      const twitterUrl = extractTwitterUrlFromText(val);
      if (twitterUrl && !socialUrl) {
        setSocialUrl(twitterUrl);
      }
    }
  };

  const handlePost = async () => {
    if (!user) {
      toast.error('You must be logged in to post.');
      return;
    }
    const trimmedContent = content.trim();
    const trimmedLoc = location.trim();

    if (!trimmedContent || !trimmedLoc) {
      toast.error('Please provide a description and location.');
      return;
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      toast.error(`Description must be under ${MAX_CONTENT_LENGTH} characters.`);
      return;
    }

    setIsPosting(true);
    
    let finalLat = latitude;
    let finalLng = longitude;

    if (finalLat === undefined || finalLng === undefined) {
      try {
        const query = encodeURIComponent(`${trimmedLoc}, ${city ? city.trim() + ', ' : ''}${province}, South Africa`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          finalLat = parseFloat(data[0].lat);
          finalLng = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.error('Geocoding failed:', err);
      }
    }

    try {
      const postData: Parameters<typeof onSubmitPost>[0] = {
        content: trimmedContent,
        imageUrl: imageUrl.trim(),
        category,
        location: trimmedLoc,
        province,
        city: city.trim(),
        latitude: finalLat,
        longitude: finalLng,
        socialUrl: socialUrl.trim() || undefined,
        reportType,
      };

      // Add crime-specific fields only for crime reports
      if (reportType === 'crime') {
        postData.crimeUrgency = crimeUrgency;
        if (incidentTime) postData.incidentTime = incidentTime;
        postData.policeContacted = policeContacted;
        if (caseNumber.trim()) postData.caseNumber = caseNumber.trim();
        postData.anonymous = anonymous;
      }

      if (addPoll) {
        const validOptions = pollOptions.filter(o => o.text.trim().length > 0);
        if (validOptions.length >= 2) {
          postData.pollOptions = validOptions.map((o, index) => ({ id: index.toString(), text: o.text.trim(), votes: 0 }));
          postData.pollExpiresAt = Date.now() + (parseInt(pollExpiryDuration) * 60 * 60 * 1000);
        }
      }

      await onSubmitPost(postData);
      toast.success(reportType === 'crime' ? 'Crime report submitted!' : 'Issue reported successfully!');
      handleCancel();
    } catch (err) {
      toast.error('Failed to submit report.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocode to get real address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            // Build a concise, readable address
            const parts: string[] = [];
            if (addr.road) parts.push(addr.road);
            if (addr.house_number) parts[0] = `${addr.house_number} ${parts[0] || ''}`;
            if (addr.suburb) parts.push(addr.suburb);
            if (addr.city || addr.town || addr.village) {
              const cityName = addr.city || addr.town || addr.village;
              parts.push(cityName);
              if (!city) setCity(cityName);
            }
            const readable = parts.filter(Boolean).join(', ') || data.display_name;
            setLocation(readable.substring(0, MAX_LOCATION_LENGTH));

            // Auto-fill province if detected
            if (addr.state) {
              const provinceMap: Record<string, string> = {
                'gauteng': 'Gauteng',
                'western cape': 'Western Cape',
                'eastern cape': 'Eastern Cape',
                'kwazulu-natal': 'KwaZulu-Natal',
                'free state': 'Free State',
                'limpopo': 'Limpopo',
                'mpumalanga': 'Mpumalanga',
                'north west': 'North West',
                'northern cape': 'Northern Cape',
              };
              const matched = provinceMap[addr.state.toLowerCase()];
              if (matched) setProvince(matched);
            }
          } else {
            setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch {
          // Fallback to coordinates if reverse geocoding fails
          setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }

        setIsLocating(false);
        toast.success('Location detected.');
      },
      (error) => {
        toast.error(`Failed to get location: ${error.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Fetch location suggestions from Nominatim as user types
  const fetchLocationSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const searchQuery = encodeURIComponent(`${query}, ${province}, South Africa`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=5&addressdetails=1&countrycodes=za`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLocationSuggestions(data);
        setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } catch {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  }, [province]);

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_LOCATION_LENGTH) {
      setLocation(val);
      // Clear GPS coords when manually typing
      setLatitude(undefined);
      setLongitude(undefined);
    }

    // Debounce the autocomplete API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(val);
    }, 400);
  };

  const handleSelectSuggestion = (suggestion: { display_name: string; lat: string; lon: string; address?: any }) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    setLatitude(lat);
    setLongitude(lon);

    // Build concise location from display_name
    const addr = suggestion.address;
    if (addr) {
      const parts: string[] = [];
      if (addr.road) parts.push(addr.road);
      if (addr.house_number && parts.length > 0) parts[0] = `${addr.house_number} ${parts[0]}`;
      if (addr.suburb) parts.push(addr.suburb);
      if (addr.city || addr.town || addr.village) {
        const cityName = addr.city || addr.town || addr.village;
        parts.push(cityName);
        if (!city) setCity(cityName);
      }
      const readable = parts.filter(Boolean).join(', ') || suggestion.display_name;
      setLocation(readable.substring(0, MAX_LOCATION_LENGTH));

      // Auto-fill province
      if (addr.state) {
        const provinceMap: Record<string, string> = {
          'gauteng': 'Gauteng',
          'western cape': 'Western Cape',
          'eastern cape': 'Eastern Cape',
          'kwazulu-natal': 'KwaZulu-Natal',
          'free state': 'Free State',
          'limpopo': 'Limpopo',
          'mpumalanga': 'Mpumalanga',
          'north west': 'North West',
          'northern cape': 'Northern Cape',
        };
        const matched = provinceMap[addr.state.toLowerCase()];
        if (matched) setProvince(matched);
      }
    } else {
      // Fallback: use full display name
      const shortName = suggestion.display_name.split(',').slice(0, 3).join(',').trim();
      setLocation(shortName.substring(0, MAX_LOCATION_LENGTH));
    }

    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePreviewError(false);
  };

  const initials = getInitials(user?.displayName || 'Citizen');
  const [c1] = getUserColor(user?.displayName || 'Citizen');
  const avatarStyle = { background: c1 };

  const hasValidImageUrl = imageUrl.trim().length > 0 && !imagePreviewError;
  const hasValidTwitterUrl = Boolean(parseTwitterUrl(socialUrl.trim()));

  const isCrime = reportType === 'crime';

  return (
    <div className={`composer ${isCrime ? 'composer--crime' : ''}`}>
      <div className="composer-top">
        <div className="user-avatar" style={avatarStyle}>{initials}</div>
        <textarea
          className="compose-input"
          placeholder={isCrime 
            ? "Describe the crime incident — what happened, when, any details that could help the community stay safe..." 
            : "Report a civic issue or paste an X/Twitter post link..."
          }
          rows={isExpanded ? 3 : 1}
          value={content}
          onChange={handleContentChange}
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

      {isExpanded && hasValidTwitterUrl && (
        <div style={{ marginTop: '10px' }}>
          <TwitterEmbed url={socialUrl.trim()} />
        </div>
      )}

      <div className={`composer-extras ${isExpanded ? 'active' : ''}`} style={{ display: isExpanded ? 'block' : 'none', marginTop: '12px' }}>
        <div className="extras-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Report Type Toggle */}
          <div className="report-type-toggle">
            <button
              type="button"
              className={`report-type-btn ${reportType === 'civic' ? 'active civic' : ''}`}
              onClick={() => handleReportTypeChange('civic')}
            >
              <AlertTriangle size={16} />
              <span>Civic Issue</span>
            </button>
            <button
              type="button"
              className={`report-type-btn ${reportType === 'crime' ? 'active crime' : ''}`}
              onClick={() => handleReportTypeChange('crime')}
            >
              <Shield size={16} />
              <span>Crime Report</span>
            </button>
          </div>

          {/* Safety Disclaimer for Crime Reports with Contextual Numbers */}
          {isCrime && (
            <CrimeSafetyBanner category={category} />
          )}

          <div className="composer-responsive-grid">
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isCrime ? 'Crime Type' : 'Category'}
              </label>
              <select className="standard-input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                {isCrime ? (
                  <>
                    <option value="theft">🔓 Theft</option>
                    <option value="robbery">🔪 Robbery</option>
                    <option value="assault">🚨 Assault</option>
                    <option value="burglary">🏠 Burglary / Break-in</option>
                    <option value="vandalism">💥 Vandalism</option>
                    <option value="hijacking">🚗 Hijacking / Carjacking</option>
                    <option value="drug_activity">💊 Drug Activity</option>
                    <option value="fraud">📋 Fraud / Scam</option>
                    <option value="domestic_violence">🤝 Domestic Violence</option>
                    <option value="crime_other">🔍 Other Crime</option>
                  </>
                ) : (
                  <>
                    <option value="pothole">🕳 Pothole</option>
                    <option value="water_leak">🚰 Water Leak</option>
                    <option value="electricity">⚡ Electricity Outage</option>
                    <option value="sewage">💩 Sewage Overflow</option>
                    <option value="traffic_light">🚥 Broken Traffic Light</option>
                    <option value="other">🛠 Other</option>
                  </>
                )}
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

          {/* Crime-specific: Urgency & Incident Time */}
          {isCrime && (
            <div className="composer-responsive-grid">
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Urgency Level</label>
                <select 
                  className="standard-input" 
                  value={crimeUrgency} 
                  onChange={(e) => setCrimeUrgency(e.target.value)} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                >
                  <option value="low">🟢 Low — Informational</option>
                  <option value="medium">🟡 Medium — Caution</option>
                  <option value="high">🟠 High — Danger</option>
                  <option value="emergency">🔴 Emergency — Immediate Threat</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  When did this happen?
                </label>
                <input
                  type="datetime-local"
                  className="standard-input"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Location</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div ref={locationWrapperRef} style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  className="standard-input"
                  placeholder={isCrime ? "Where did the crime occur? Street, suburb, area..." : "Start typing a street, suburb, or area..."}
                  value={location}
                  onChange={handleLocationInputChange}
                  onFocus={() => { if (locationSuggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
                  autoComplete="off"
                  maxLength={MAX_LOCATION_LENGTH}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}
                />
                {showSuggestions && locationSuggestions.length > 0 && (
                  <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: 'var(--card-bg, #16181c)',
                    border: '1px solid var(--border-color)',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}>
                    {locationSuggestions.map((s, i) => {
                      // Show a concise version for the list
                      const parts = s.display_name.split(',').map(p => p.trim());
                      const shortLabel = parts.slice(0, 3).join(', ');
                      return (
                        <li
                          key={`${s.lat}-${s.lon}-${i}`}
                          onMouseDown={() => handleSelectSuggestion(s)}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            color: 'var(--text-main)',
                            borderBottom: i < locationSuggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-color, #1d1f23)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--accent-primary)' }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{shortLabel}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {parts.slice(3).join(', ')}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <button type="button" onClick={handleDetectLocation} disabled={isLocating} style={{ padding: '8px 12px', borderRadius: '4px', background: 'var(--accent-primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                GPS
              </button>
            </div>
            {latitude !== undefined && longitude !== undefined && (
              <p style={{ fontSize: '0.7rem', color: 'var(--accent-success)', marginTop: '4px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={10} /> GPS coordinates attached ({latitude.toFixed(4)}, {longitude.toFixed(4)})
              </p>
            )}
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

          {/* Crime-specific: Police Contact & Case Number */}
          {isCrime && (
            <div className="crime-police-section">
              <div className="form-group">
                <label className="checkbox-label" style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={policeContacted}
                    onChange={(e) => setPoliceContacted(e.target.checked)}
                    className="crime-checkbox"
                  />
                  <Phone size={14} />
                  Police / SAPS have been contacted
                </label>
              </div>

              {policeContacted && (
                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <FileText size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    SAPS Case Number (optional)
                  </label>
                  <input
                    type="text"
                    className="standard-input"
                    placeholder="e.g. CAS 123/04/2026"
                    value={caseNumber}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CASE_NUMBER_LENGTH) {
                        setCaseNumber(e.target.value);
                      }
                    }}
                    maxLength={MAX_CASE_NUMBER_LENGTH}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Crime-specific: Anonymous Toggle */}
          {isCrime && (
            <div className="form-group">
              <label className="checkbox-label" style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="crime-checkbox"
                />
                <EyeOff size={14} />
                Post anonymously for safety
              </label>
              {anonymous && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0, marginLeft: '26px' }}>
                  Your name will be hidden from the public. Your account ID is still stored for moderation purposes.
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Social Media Link (X / Twitter)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  <XIcon size={14} color="#1d9bf0" />
                </div>
                <input
                  type="url"
                  className="standard-input"
                  placeholder="https://x.com/username/status/123456789"
                  value={socialUrl}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_SOCIAL_URL_LENGTH) {
                      setSocialUrl(e.target.value);
                    }
                  }}
                  maxLength={MAX_SOCIAL_URL_LENGTH}
                  style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}
                />
              </div>
              {socialUrl.trim() && (
                <button type="button" onClick={() => setSocialUrl('')} style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              Attach an X/Twitter post link for verification or context
            </p>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Photo Evidence</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="file"
                accept="image/*"
                id="image-upload"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
                disabled={isUploadingImage || !!imageUrl}
              />
              {!imageUrl && (
                <label 
                  htmlFor="image-upload" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: isUploadingImage ? 'not-allowed' : 'pointer', opacity: isUploadingImage ? 0.7 : 1 }}
                >
                  {isUploadingImage ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                  {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                </label>
              )}
              {imageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)' }}>Image uploaded!</span>
                  <button type="button" onClick={handleRemoveImage} style={{ padding: '6px', borderRadius: '4px', background: 'var(--accent-danger)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            {imagePreviewError && imageUrl.trim() && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', marginTop: '4px', marginBottom: 0 }}>
                ⚠ Could not load image preview.
              </p>
            )}
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              Max size: 5MB (JPEG, PNG, GIF, WebP)
            </p>
          </div>

          {/* Poll Feature Toggle */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" checked={addPoll} onChange={(e) => setAddPoll(e.target.checked)} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }} />
              📊 Add a Community Poll
            </label>
          </div>

          {addPoll && (
            <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pollOptions.map((opt, idx) => (
                <input
                  key={opt.id}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt.text}
                  onChange={(e) => {
                    const newOpts = [...pollOptions];
                    newOpts[idx].text = e.target.value;
                    setPollOptions(newOpts);
                  }}
                  className="standard-input"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}
                />
              ))}
              {pollOptions.length < 4 && (
                <button type="button" onClick={() => setPollOptions([...pollOptions, { id: Date.now().toString(), text: '' }])} style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: '4px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                  + Add Option
                </button>
              )}
              
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Poll Duration:</label>
                <select value={pollExpiryDuration} onChange={(e) => setPollExpiryDuration(e.target.value)} style={{ padding: '6px', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                  <option value="8">8 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="48">48 Hours</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="composer-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn-cancel" onClick={handleCancel} disabled={isPosting} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          <button 
            className={`btn-primary ${isCrime ? 'btn-crime-submit' : ''}`}
            onClick={handlePost} 
            disabled={isPosting || !content.trim() || !location.trim()} 
            style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: isCrime ? 'var(--crime-accent, #dc2626)' : 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: isPosting || !content.trim() || !location.trim() ? 0.5 : 1 }}
          >
            {isCrime ? <Shield size={14} /> : <Send size={14} />}
            {isPosting ? 'Submitting...' : isCrime ? 'Submit Crime Report' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Contextual safety banner showing relevant emergency numbers for the selected crime category */
const CrimeSafetyBanner: React.FC<{ category: string }> = ({ category }) => {
  const relevantContacts = useMemo(
    () => getContactsForCategory(category, 'crime').slice(0, 3),
    [category]
  );

  return (
    <div className="crime-safety-banner">
      <div className="crime-safety-banner-header">
        <Phone size={14} />
        <div>
          <strong>In an emergency, call <a href="tel:10111" className="emergency-inline-link">10111</a> (SAPS) or <a href="tel:112" className="emergency-inline-link">112</a> immediately.</strong>
          <span> This platform is for community awareness — not a substitute for emergency services.</span>
        </div>
      </div>
      {relevantContacts.length > 0 && (
        <div className="crime-safety-contacts">
          {relevantContacts.map((contact, i) => (
            <a
              key={i}
              href={formatTelUri(contact.number)}
              className="crime-safety-contact-chip"
            >
              <Phone size={10} />
              <span className="contact-chip-name">{contact.name}</span>
              <span className="contact-chip-number">{contact.number}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
