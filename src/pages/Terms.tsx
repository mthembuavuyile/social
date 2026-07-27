import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Header with Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
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
          Last updated: March 2026
        </span>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ShieldCheck size={28} color="var(--accent-primary)" />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Privacy Policy & Terms of Use
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          How we handle your data and what you agree to when using Civicly.
        </p>
      </div>

      {/* TL;DR Banner */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderLeft: '4px solid var(--accent-primary)',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '32px',
        color: 'var(--text-main)',
        fontSize: '0.95rem'
      }}>
        <strong>TL;DR Summary:</strong> We don't sell your data. We collect only what is necessary to operate the local civic issue reporting platform. You can edit or delete your posts anytime.
      </div>

      {/* Content Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Section 1 */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <FileText size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>1. Overview</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Civicly is a community platform designed for South Africans to report local infrastructure and civic issues (such as potholes, water leaks, power outages, and sanitation) and view them on an interactive neighborhood map.
          </p>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginTop: '12px' }}>
            By accessing or using Civicly, you agree to comply with and be bound by these terms. If you do not agree, please refrain from using the platform.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <CheckCircle2 size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>2. Data We Collect</h2>
          </div>
          <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem', paddingLeft: '20px' }}>
            <li><strong>Anonymous User Identifiers:</strong> Firebase assigns every visitor an anonymous ID to track posts and reactions securely without requiring forced traditional registration.</li>
            <li><strong>User Profile Data:</strong> Display name and profile details configured by you in the app settings.</li>
            <li><strong>Civic Reports:</strong> Title, description, category, geolocation coordinates, and uploaded media attachments submitted with reports.</li>
            <li><strong>Reactions & Upvotes:</strong> Upvotes and endorsements linked to your active session.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={20} color="#ff9a00" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>3. User Conduct & Acceptable Use</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '12px' }}>
            When contributing to Civicly, you agree to adhere to community safety guidelines:
          </p>
          <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem', paddingLeft: '20px' }}>
            <li>Do not post false, misleading, or fraudulent civic reports.</li>
            <li>Do not post spam, hate speech, harassment, or non-civic promotional material.</li>
            <li>Do not post private personal information (doxxing) or photos that violate individual privacy.</li>
            <li>We reserve the right to remove non-compliant content or restrict access to users who violate these guidelines.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Mail size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>4. Contact & Inquiries</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
            For privacy inquiries, bug reports, or content deletion requests, please contact the platform administration or file an issue in the project repository.
          </p>
        </section>

      </div>
    </div>
  );
};
