import React, { useState } from 'react';
import { Phone, Clock, Shield, ChevronDown, ChevronUp, ExternalLink, Search } from 'lucide-react';
import { EMERGENCY_CATEGORIES, EmergencyContact, formatTelUri } from '../data/emergencyContacts';

export const EmergencyContacts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(EMERGENCY_CATEGORIES.map(c => c.id))
  );

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredCategories = EMERGENCY_CATEGORIES.map(cat => ({
    ...cat,
    contacts: cat.contacts.filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.number.includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }),
  })).filter(cat => cat.contacts.length > 0);

  return (
    <div className="emergency-contacts-page">
      <div className="emergency-header">
        <div className="emergency-header-icon">
          <Shield size={28} />
        </div>
        <div>
          <h2 className="emergency-title">Emergency & Helpline Directory</h2>
          <p className="emergency-subtitle">
            South African emergency numbers and support services. Tap any number to call directly.
          </p>
        </div>
      </div>

      {/* Quick Call Banner */}
      <div className="emergency-quick-call">
        <a href="tel:112" className="quick-call-btn primary-emergency">
          <div className="quick-call-icon">
            <Phone size={20} />
          </div>
          <div className="quick-call-info">
            <span className="quick-call-number">112</span>
            <span className="quick-call-label">Cell Phone Emergency</span>
          </div>
        </a>
        <a href="tel:10111" className="quick-call-btn police-emergency">
          <div className="quick-call-icon">
            <Shield size={20} />
          </div>
          <div className="quick-call-info">
            <span className="quick-call-number">10111</span>
            <span className="quick-call-label">SAPS Police</span>
          </div>
        </a>
        <a href="tel:10177" className="quick-call-btn medical-emergency">
          <div className="quick-call-icon">
            <Phone size={20} />
          </div>
          <div className="quick-call-info">
            <span className="quick-call-number">10177</span>
            <span className="quick-call-label">Ambulance & Fire</span>
          </div>
        </a>
      </div>

      {/* Search */}
      <div className="emergency-search">
        <Search size={16} className="emergency-search-icon" />
        <input
          type="text"
          placeholder="Search helplines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="emergency-search-input"
        />
        {searchQuery && (
          <button className="emergency-search-clear" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* Categories */}
      <div className="emergency-categories">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className={`emergency-category ${expandedCategories.has(cat.id) ? 'expanded' : ''}`}>
            <button
              className="emergency-category-header"
              onClick={() => toggleCategory(cat.id)}
            >
              <span className="category-icon-text">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
              <span className="category-count">{cat.contacts.length}</span>
              {expandedCategories.has(cat.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedCategories.has(cat.id) && (
              <div className="emergency-contact-list">
                {cat.contacts.map((contact, i) => (
                  <EmergencyContactCard key={i} contact={contact} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="emergency-no-results">
          <p>No helplines match your search.</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="emergency-disclaimer">
        <p>
          <strong>Disclaimer:</strong> These numbers are maintained by the respective South African government agencies 
          and NGOs. Civicly provides this directory as a community service and is not a substitute for professional 
          emergency services. Always call 112 or 10111 in a life-threatening emergency.
        </p>
      </div>
    </div>
  );
};

const EmergencyContactCard: React.FC<{ contact: EmergencyContact }> = ({ contact }) => {
  return (
    <a 
      href={formatTelUri(contact.number)} 
      className="emergency-contact-card"
    >
      <div className="contact-card-left">
        <div className="contact-name">{contact.name}</div>
        <div className="contact-description">{contact.description}</div>
        <div className="contact-badges">
          {contact.tollFree && (
            <span className="contact-badge toll-free">Toll-Free</span>
          )}
          {contact.available24h && (
            <span className="contact-badge available-24h">
              <Clock size={10} /> 24/7
            </span>
          )}
        </div>
      </div>
      <div className="contact-card-right">
        <span className="contact-number">{contact.number}</span>
        <div className="contact-call-icon">
          <Phone size={16} />
        </div>
      </div>
    </a>
  );
};
