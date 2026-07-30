import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  Lock, 
  Flag, 
  UserX, 
  ShieldAlert,
  Server,
  Scale
} from 'lucide-react';

export const Terms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'privacy' | 'terms' | 'guidelines' | 'moderation' | 'security'>('all');

  return (
    <div style={{ width: '100%', maxWidth: '100%', padding: '16px 0 60px', boxSizing: 'border-box' }}>
      {/* Header with Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--accent-primary)', 
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Feed</span>
        </Link>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Last updated: July 2026
        </span>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ShieldCheck size={32} color="var(--accent-primary)" />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Legal, Privacy & Compliance Hub
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          Detailed breakdown of Terms of Service, Privacy Rights, Community Guidelines, Content Moderation, and Security Controls for Civicly.
        </p>
      </div>

      {/* Quick Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        paddingBottom: '12px', 
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {[
          { id: 'all', label: 'All Documentation', icon: FileText },
          { id: 'terms', label: 'Terms of Use & Liability', icon: Scale },
          { id: 'privacy', label: 'Privacy & Data Rights', icon: Lock },
          { id: 'guidelines', label: 'Community Guidelines', icon: ShieldAlert },
          { id: 'moderation', label: 'Content Moderation', icon: Flag },
          { id: 'security', label: 'Security & Anti-Abuse', icon: Server }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '9999px',
                border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TL;DR Summary Callout */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderLeft: '4px solid var(--accent-primary)',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '32px',
        color: 'var(--text-main)',
        fontSize: '0.92rem',
        lineHeight: 1.6
      }}>
        <strong>TL;DR Summary:</strong> We prioritize user privacy while keeping local communities safe. We do not sell personal data. You retain full control over your reports and can edit or delete your data at any time. Civicly is provided "as is" for civic issue awareness and is restricted to users aged 13 and older.
      </div>

      {/* Content Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Section 1: Overview & Terms of Use */}
        {(activeTab === 'all' || activeTab === 'terms') && (
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Scale size={22} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                1. Terms of Use & Liability Disclaimers
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Civicly provides a public crowdsourced platform for South African citizens to document infrastructure breakdowns (potholes, power outages, water leaks) and neighborhood safety alerts.
            </p>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '16px', marginBottom: '8px' }}>
              A. Platform Provision ("AS-IS" Clause)
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.92rem' }}>
              Civicly is provided on an <strong>"as is" and "as available" basis</strong> without warranties of any kind, whether express or implied. We do not guarantee uninterrupted availability, error-free operation, or official municipal response to submitted reports.
            </p>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '16px', marginBottom: '8px' }}>
              B. Limitation of Liability & User Indemnification
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.92rem' }}>
              Under no circumstances shall the platform maintainers, operators, or contributors be held liable for any direct, indirect, incidental, or consequential damages resulting from user-generated content, reliance on reported incidents, or third-party interactions. Users agree to indemnify and hold harmless Civicly from claims, losses, or legal costs arising from their posts.
            </p>
          </section>
        )}

        {/* Section 2: Privacy Policy & Data Rights */}
        {(activeTab === 'all' || activeTab === 'privacy') && (
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Lock size={22} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                2. Privacy Policy & Compliance (POPIA, GDPR, CCPA)
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '12px' }}>
              We follow strict data minimization principles to ensure user anonymity and compliance with international data privacy laws (including POPIA, GDPR, and CCPA):
            </p>

            <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.92rem', paddingLeft: '20px', marginBottom: '16px' }}>
              <li><strong>Anonymous Authentication:</strong> Visitors receive an encrypted Firebase Anonymous UID. No email or phone number is required to browse or report.</li>
              <li><strong>Local Storage Data:</strong> Display names and custom preference settings are stored locally on your device (`localStorage`).</li>
              <li><strong>Public Civic Reports:</strong> Report titles, descriptions, categories, photos, and approximate map coordinates are publicly visible to aid community resolution.</li>
              <li><strong>Third-Party Infrastructure:</strong> Firebase (Google Cloud) hosts data storage and authentication. See <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>Google's Privacy Policy</a>.</li>
            </ul>

            <div style={{ background: 'rgba(0, 186, 124, 0.08)', border: '1px solid rgba(0, 186, 124, 0.25)', borderRadius: '8px', padding: '14px 16px' }}>
              <strong style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <CheckCircle2 size={16} /> Right to Erasure & Session Control
              </strong>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
                You can delete your own posts immediately using the trash icon on your reports. You can also clear local cache and identity stored on your device at any time in your <Link to="/profile" style={{ color: 'var(--accent-primary)' }}>Profile Settings</Link>.
              </p>
            </div>
          </section>
        )}

        {/* Section 3: Community Guidelines */}
        {(activeTab === 'all' || activeTab === 'guidelines') && (
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <ShieldAlert size={22} color="#ff9a00" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                3. Community Guidelines & Code of Conduct
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '12px' }}>
              To keep Civicly accurate, safe, and helpful for everyone, users must adhere to the following community standards:
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <AlertTriangle size={15} /> No False Reports
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'block' }}>
                  Submitting fake emergency, crime, or infrastructure reports is strictly prohibited and subject to automated IP ban.
                </span>
              </div>

              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <UserX size={15} /> Zero Tolerance for Doxing
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'block' }}>
                  Never post private addresses, real names, phone numbers, or unconsented photos of private individuals.
                </span>
              </div>

              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <ShieldAlert size={15} /> Hate Speech & Harassment
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'block' }}>
                  Incitement to violence, racism, sexism, xenophobia, or personal abuse will result in instant deletion and blocking.
                </span>
              </div>

              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <Flag size={15} /> No Commercial Spam
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'block' }}>
                  Unsolicited marketing, affiliate promotion, or repetitive spam submissions are prohibited.
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Content Moderation & Reporting */}
        {(activeTab === 'all' || activeTab === 'moderation') && (
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Flag size={22} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                4. Content Moderation & Reporting Mechanism
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Civicly employs community-driven reporting alongside automated safety rules to uphold content quality:
            </p>
            <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.92rem', paddingLeft: '20px', marginTop: '10px' }}>
              <li><strong>In-App Reporting Tool:</strong> Every post card features a <code>Flag Report</code> action allowing any citizen to report content violating community guidelines.</li>
              <li><strong>Immediate Client Filtering:</strong> Flagged content is instantly concealed from your local view to prevent distress.</li>
              <li><strong>Administrative Removal:</strong> Content receiving multiple community flags or violating law is permanently removed.</li>
              <li><strong>DMCA / Copyright Takedown Notice:</strong> To submit a copyright or legal removal request, email <code>safety@civicly.org</code> with incident URLs.</li>
            </ul>
          </section>
        )}

        {/* Section 5: Security Measures & Anti-Abuse Controls */}
        {(activeTab === 'all' || activeTab === 'security') && (
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Server size={22} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                5. Security Measures & Fraud Prevention
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              We enforce strict technical and structural controls to protect the application integrity:
            </p>
            <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.92rem', paddingLeft: '20px', marginTop: '10px' }}>
              <li><strong>Transport Security:</strong> All data transmitted between clients and servers is enforced over HTTPS (TLS 1.3 encryption).</li>
              <li><strong>Firestore Security Rules:</strong> Security rules mandate that users can only delete or edit their own authored reports. Non-authors can only update reactions.</li>
              <li><strong>IP Hashing & Privacy:</strong> Server logs handle rate-limiting using salted cryptographic hashes (SHA-256 IP + secret salt) to prevent brute-force spam without storing unhashed personal IP records in public databases.</li>
            </ul>
          </section>
        )}

        {/* Section 6: Compliance & Age Limit */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Mail size={22} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              6. Age Restriction (COPPA Compliance) & Contact
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '12px' }}>
            Civicly is intended exclusively for users aged <strong>13 years of age or older</strong> (or 16+ depending on European jurisdiction). If you are under 13, please do not use this platform or submit personal information.
          </p>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
            For privacy inquiries, data deletion assistance, or community safety reports, please reach out to <a href="mailto:safety@civicly.org" style={{ color: 'var(--accent-primary)' }}>safety@civicly.org</a> or visit your <Link to="/profile" style={{ color: 'var(--accent-primary)' }}>Profile Settings</Link>.
          </p>
        </section>

      </div>
    </div>
  );
};

