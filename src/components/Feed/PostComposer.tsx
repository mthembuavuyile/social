import React, { useState, useRef } from 'react';
import { Milestone } from '../../types';
import { getInitials, getUserColor } from '../../utils';
import { TrackSelector } from './TrackSelector';
import { Camera, X, Send, AlertCircle, MapPin, Loader2, Plus } from 'lucide-react';

interface PostComposerProps {
  user: string;
  onSubmitPost: (data: {
    content: string;
    imageUrl: string;
    category: string;
    location: string;
    province?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    isCrowdfunded?: boolean;
    bountyGoal?: number;
    postTrack: 'civic' | 'gig' | 'project';
    gigCategory?: string;
    gigContactPhone?: string;
    gigPrice?: number;
    projectCategory?: string;
    milestones?: Milestone[];
  }) => Promise<void>;
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
  const [activeTrack, setActiveTrack] = useState<'civic' | 'gig' | 'project'>('civic');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('');
  const [province, setProvince] = useState('Gauteng');
  const [city, setCity] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Civic fields
  const [civicCategory, setCivicCategory] = useState('pothole');
  const [isCrowdfunded, setIsCrowdfunded] = useState(false);
  const [bountyGoal, setBountyGoal] = useState<number>(500);

  // Gig fields
  const [gigCategory, setGigCategory] = useState('plumbing');
  const [gigPrice, setGigPrice] = useState<number>(300);
  const [gigContactPhone, setGigContactPhone] = useState('');

  // Project fields
  const [projectCategory, setProjectCategory] = useState('community');
  const [projectGoal, setProjectGoal] = useState<number>(5000);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', title: '', targetAmount: 0, description: '', completed: false },
  ]);

  // Geolocation
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
    setLocation('');
    setProvince('Gauteng');
    setCity('');
    setCivicCategory('pothole');
    setIsCrowdfunded(false);
    setBountyGoal(500);
    setGigCategory('plumbing');
    setGigPrice(300);
    setGigContactPhone('');
    setProjectCategory('community');
    setProjectGoal(5000);
    setMilestones([{ id: '1', title: '', targetAmount: 0, description: '', completed: false }]);
    setLatitude(undefined);
    setLongitude(undefined);
    setIsExpanded(false);
  };

  const handlePost = async () => {
    const trimmedContent = content.trim();
    const trimmedLoc = location.trim();

    if (!trimmedContent) {
      showToast('Please describe the issue or service.', 'error');
      return;
    }
    if (!trimmedLoc) {
      showToast('Please specify the location.', 'error');
      return;
    }

    // Track-specific validation
    if (activeTrack === 'gig' && gigPrice < 50) {
      showToast('Gig price must be at least R50.', 'error');
      return;
    }
    if (activeTrack === 'project' && projectGoal < 100) {
      showToast('Project goal must be at least R100.', 'error');
      return;
    }

    setIsPosting(true);
    try {
      // Build clean milestones (filter empty ones)
      const cleanMilestones = activeTrack === 'project'
        ? milestones.filter(m => m.title.trim()).map((m, i) => ({
            ...m,
            id: String(i + 1),
            title: m.title.trim(),
            description: m.description.trim(),
          }))
        : undefined;

      await onSubmitPost({
        content: trimmedContent,
        imageUrl: imageUrl.trim(),
        category: activeTrack === 'civic' ? civicCategory : activeTrack === 'gig' ? gigCategory : projectCategory,
        location: trimmedLoc,
        province,
        city: city.trim(),
        latitude,
        longitude,
        postTrack: activeTrack,
        // Civic
        isCrowdfunded: activeTrack === 'civic' ? isCrowdfunded : activeTrack === 'project',
        bountyGoal: activeTrack === 'civic' ? (isCrowdfunded ? bountyGoal : undefined) : activeTrack === 'project' ? projectGoal : undefined,
        // Gig
        gigCategory: activeTrack === 'gig' ? gigCategory : undefined,
        gigContactPhone: activeTrack === 'gig' ? gigContactPhone : undefined,
        gigPrice: activeTrack === 'gig' ? gigPrice : undefined,
        // Project
        projectCategory: activeTrack === 'project' ? projectCategory : undefined,
        milestones: cleanMilestones,
      });

      const labels = { civic: 'Issue reported!', gig: 'Gig posted!', project: 'Project launched!' };
      showToast(`${labels[activeTrack]} Community notified. 🚀`, 'success');
      handleCancel();
    } catch (err) {
      showToast('Failed to submit.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  // --- Image helpers ---
  const sampleImages: Record<string, string> = {
    pothole: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    water_leak: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80',
    traffic_light: 'https://images.unsplash.com/photo-1510936111840-65e151ad74b7?auto=format&fit=crop&w=600&q=80',
    electricity: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    sewage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
  };

  const handlePrefillImage = () => {
    const cat = activeTrack === 'civic' ? civicCategory : 'other';
    const sample = sampleImages[cat] || 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80';
    setImageUrl(sample);
    showToast('Prefilled a demo photo! 📸', 'info');
  };

  const handleRemoveImage = () => setImageUrl('');

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
          setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
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
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setImageUrl(canvas.toDataURL('image/jpeg', 0.75));
          showToast('Photo processed! 📸', 'success');
        } else {
          setImageUrl(event.target?.result as string);
        }
        setIsUploading(false);
      };
      img.onerror = () => { showToast('Failed to load image', 'error'); setIsUploading(false); };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => { showToast('Failed to read file', 'error'); setIsUploading(false); };
    reader.readAsDataURL(file);
  };

  // Milestone helpers
  const addMilestone = () => {
    if (milestones.length >= 5) { showToast('Maximum 5 milestones.', 'info'); return; }
    setMilestones([...milestones, { id: String(milestones.length + 1), title: '', targetAmount: 0, description: '', completed: false }]);
  };
  const removeMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };
  const updateMilestone = (idx: number, field: keyof Milestone, value: string | number) => {
    const updated = [...milestones];
    (updated[idx] as any)[field] = value;
    setMilestones(updated);
  };

  const initials = getInitials(user);
  const [c1, c2] = getUserColor(user);
  const avatarStyle = { background: `linear-gradient(135deg, ${c1}, ${c2})` };

  const placeholders: Record<string, string> = {
    civic: 'Report a civic issue (pothole, water leak, broken traffic light...)',
    gig: 'Describe the service you need (e.g. "Fix my leaking shower in Westgate")',
    project: 'Describe the community project (e.g. "Soccer ground for kids in Imbali")',
  };

  const civicPayoutMap: Record<string, string> = {
    pothole: 'R250', water_leak: 'R200', electricity: 'R150',
    sewage: 'R400', traffic_light: 'R300', other: 'R150',
  };

  return (
    <div className="composer">
      <div className="composer-top">
        <div className="user-avatar" style={avatarStyle}>{initials}</div>
        <textarea
          className="compose-input"
          placeholder={placeholders[activeTrack]}
          rows={isExpanded ? 3 : 1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={handleFocus}
        />
      </div>

      {/* Image Preview */}
      {isExpanded && imageUrl.trim() && (
        <div className="image-preview-wrapper">
          <img src={imageUrl.trim()} alt="Preview" />
          <button type="button" className="remove-preview-btn" onClick={handleRemoveImage}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className={`composer-extras ${isExpanded ? 'active' : ''}`}>
        {/* Track Selector */}
        <TrackSelector value={activeTrack} onChange={(t) => { if (t !== 'all') setActiveTrack(t as 'civic' | 'gig' | 'project'); }} />

        <div className="extras-inputs">
          {/* ========== CIVIC FIELDS ========== */}
          {activeTrack === 'civic' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select className="standard-input" value={civicCategory} onChange={(e) => setCivicCategory(e.target.value)} style={{ background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                    <option value="pothole">🕳 Pothole</option>
                    <option value="water_leak">🚰 Water Leak</option>
                    <option value="electricity">⚡ Electricity Outage</option>
                    <option value="sewage">💩 Sewage Overflow</option>
                    <option value="traffic_light">🚥 Broken Traffic Light</option>
                    <option value="other">🛠 Other Issue</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Region</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select className="standard-input" value={province} onChange={(e) => setProvince(e.target.value)} style={{ flex: 1, background: 'var(--surface-color)', color: 'var(--text-main)' }}>
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
                    <input type="text" className="standard-input" placeholder="City / Town (e.g. Pretoria)" value={city} onChange={(e) => setCity(e.target.value)} style={{ flex: 1 }} />
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Location (Street & Suburb)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="standard-input" placeholder="e.g. Rivonia Rd, Sandton" value={location} onChange={(e) => setLocation(e.target.value)} style={{ flex: 1 }} />
                    <button type="button" className="btn-cancel" onClick={handleDetectLocation} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} disabled={isLocating} title="Detect GPS Location">
                      {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                      <span style={{ fontSize: '0.75rem' }}>GPS</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Crowdfunding toggle */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginTop: '8px', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setIsCrowdfunded(!isCrowdfunded)}>
                  <input type="checkbox" checked={isCrowdfunded} onChange={() => {}} />
                  <strong style={{ fontSize: '0.85rem' }}>Enable Crowdfunded Bounty Goal</strong>
                </div>
                {isCrowdfunded && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '150px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target:</span>
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>R</span>
                      <input type="number" className="standard-input" value={bountyGoal} onChange={(e) => setBountyGoal(Math.max(50, parseInt(e.target.value) || 0))} style={{ paddingLeft: '24px', flex: 1 }} min={50} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========== GIG FIELDS ========== */}
          {activeTrack === 'gig' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Service Category</label>
                  <select className="standard-input" value={gigCategory} onChange={(e) => setGigCategory(e.target.value)} style={{ background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                    <option value="plumbing">🔧 Plumbing</option>
                    <option value="electrical">⚡ Electrical</option>
                    <option value="cleaning">🧹 Cleaning</option>
                    <option value="web_dev">💻 Web Development</option>
                    <option value="tutoring">📚 Tutoring</option>
                    <option value="gardening">🌿 Gardening</option>
                    <option value="painting">🎨 Painting</option>
                    <option value="other_gig">🛠 Other Service</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Your Budget (ZAR)</label>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>R</span>
                    <input type="number" className="standard-input" value={gigPrice} onChange={(e) => setGigPrice(Math.max(50, parseInt(e.target.value) || 0))} style={{ paddingLeft: '24px' }} min={50} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Location (Where is the work?)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="standard-input" placeholder="e.g. Westgate, Pietermaritzburg" value={location} onChange={(e) => setLocation(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className="btn-cancel" onClick={handleDetectLocation} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} disabled={isLocating}>
                    {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                    <span style={{ fontSize: '0.75rem' }}>GPS</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>WhatsApp Number (Optional — for applicants to contact you)</label>
                <div className="phone-input-group">
                  <span className="phone-prefix">+27</span>
                  <input type="tel" className="standard-input" placeholder="e.g. 0821234567" value={gigContactPhone} onChange={(e) => setGigContactPhone(e.target.value)} style={{ flex: 1 }} maxLength={12} />
                </div>
              </div>
            </>
          )}

          {/* ========== PROJECT FIELDS ========== */}
          {activeTrack === 'project' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Project Category</label>
                  <select className="standard-input" value={projectCategory} onChange={(e) => setProjectCategory(e.target.value)} style={{ background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                    <option value="infrastructure">🏗 Infrastructure</option>
                    <option value="education">📚 Education</option>
                    <option value="sports">⚽ Sports & Recreation</option>
                    <option value="health">🏥 Health</option>
                    <option value="environment">🌿 Environment</option>
                    <option value="community">🤝 Community</option>
                    <option value="other_project">🌍 Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Funding Goal (ZAR)</label>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>R</span>
                    <input type="number" className="standard-input" value={projectGoal} onChange={(e) => setProjectGoal(Math.max(100, parseInt(e.target.value) || 0))} style={{ paddingLeft: '24px' }} min={100} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="standard-input" placeholder="e.g. Imbali, Pietermaritzburg" value={location} onChange={(e) => setLocation(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className="btn-cancel" onClick={handleDetectLocation} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} disabled={isLocating}>
                    {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                    <span style={{ fontSize: '0.75rem' }}>GPS</span>
                  </button>
                </div>
              </div>

              {/* Milestone Builder */}
              <div className="form-group">
                <label>Milestones (Optional — how funds will be released)</label>
                <div className="milestone-builder">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="milestone-builder-item">
                      <div className="milestone-builder-header">
                        <span className="milestone-builder-num">Milestone {idx + 1}</span>
                        {milestones.length > 1 && (
                          <button type="button" className="milestone-remove-btn" onClick={() => removeMilestone(idx)}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <input type="text" className="standard-input" placeholder="e.g. Purchase grass cutter" value={m.title} onChange={(e) => updateMilestone(idx, 'title', e.target.value)} style={{ fontSize: '0.82rem' }} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '120px' }}>
                          <span style={{ position: 'absolute', left: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>R</span>
                          <input type="number" className="standard-input" placeholder="Amount" value={m.targetAmount || ''} onChange={(e) => updateMilestone(idx, 'targetAmount', parseInt(e.target.value) || 0)} style={{ paddingLeft: '22px', fontSize: '0.82rem' }} min={0} />
                        </div>
                        <input type="text" className="standard-input" placeholder="Brief description (optional)" value={m.description} onChange={(e) => updateMilestone(idx, 'description', e.target.value)} style={{ flex: 1, fontSize: '0.82rem' }} />
                      </div>
                    </div>
                  ))}
                  {milestones.length < 5 && (
                    <button type="button" className="add-milestone-btn" onClick={addMilestone}>
                      <Plus size={14} /> Add Milestone
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Shared: Photo Evidence */}
          <div className="form-group">
            <label>Photo {activeTrack === 'civic' ? 'Evidence' : activeTrack === 'gig' ? '(Optional)' : '(Show what you\u2019re building)'}</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="url" className="standard-input" placeholder="Paste photo URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ flex: 1 }} />
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
              <button type="button" className="btn-cancel" onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ padding: '10px 14px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                <span>Upload</span>
              </button>
              <button type="button" className="btn-primary btn-small" onClick={handlePrefillImage} style={{ borderRadius: 'var(--radius-md)', padding: '10px 14px', whiteSpace: 'nowrap' }} title="Insert sample photo">
                <Camera size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="composer-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
          <span className="char-counter" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={14} style={{ color: activeTrack === 'gig' ? '#f59e0b' : activeTrack === 'project' ? 'var(--accent-success)' : 'var(--accent-primary)' }} />
            {activeTrack === 'civic' && (
              isCrowdfunded
                ? <span>Crowdfunding Target: <strong style={{ color: 'var(--accent-primary)' }}>R{bountyGoal}</strong></span>
                : <span>Base Compensation: <strong style={{ color: 'var(--accent-success)' }}>{civicPayoutMap[civicCategory] || 'R150'}</strong></span>
            )}
            {activeTrack === 'gig' && (
              <span>Listed Price: <strong style={{ color: '#f59e0b' }}>R{gigPrice}</strong></span>
            )}
            {activeTrack === 'project' && (
              <span>Funding Goal: <strong style={{ color: 'var(--accent-success)' }}>R{projectGoal.toLocaleString()}</strong></span>
            )}
          </span>
          <div className="composer-actions">
            <button className="btn-cancel" onClick={handleCancel} disabled={isPosting}>Cancel</button>
            <button className="btn-primary" onClick={handlePost} disabled={isPosting || !content.trim() || !location.trim()}>
              <Send size={14} />
              <span>{activeTrack === 'civic' ? 'Submit Report' : activeTrack === 'gig' ? 'Post Gig' : 'Launch Project'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
