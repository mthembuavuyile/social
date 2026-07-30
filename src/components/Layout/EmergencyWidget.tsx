import React from 'react';
import { Phone, Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTelUri } from '../../data/emergencyContacts';

export const EmergencyWidget: React.FC = () => {
  const navigate = useNavigate();

  const quickNumbers = [
    { label: 'Emergency', number: '112', color: '#dc2626' },
    { label: 'SAPS', number: '10111', color: '#2563eb' },
    { label: 'Ambulance', number: '10177', color: '#16a34a' },
  ];

  return (
    <div className="sidebar-widget emergency-widget">
      <div className="widget-header">
        <Shield size={18} color="#dc2626" />
        <h3>Emergency Numbers</h3>
      </div>

      <div className="emergency-quick-numbers">
        {quickNumbers.map((item) => (
          <a
            key={item.number}
            href={formatTelUri(item.number)}
            className="emergency-quick-number"
            style={{ '--emergency-color': item.color } as React.CSSProperties}
          >
            <Phone size={12} />
            <span className="eq-label">{item.label}</span>
            <span className="eq-number">{item.number}</span>
          </a>
        ))}
      </div>

      <button 
        className="emergency-view-all"
        onClick={() => navigate('/emergency')}
      >
        <span>View All Helplines</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
};
