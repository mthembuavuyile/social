import { Shield, Phone, Heart, Building2, Brain } from 'lucide-react';

export interface EmergencyContact {
  name: string;
  number: string;
  description: string;
  tollFree: boolean;
  available24h: boolean;
  /** Which crime categories this is especially relevant for */
  relevantCategories?: string[];
  /** Which report types this applies to: 'civic', 'crime', or 'all' */
  relevantReportTypes: ('civic' | 'crime' | 'all')[];
}

export interface EmergencyCategory {
  id: string;
  label: string;
  icon: string;
  contacts: EmergencyContact[];
}

export const EMERGENCY_CATEGORIES: EmergencyCategory[] = [
  {
    id: 'primary',
    label: 'Primary Emergency Services',
    icon: '🚨',
    contacts: [
      {
        name: 'Cell Phone Emergency',
        number: '112',
        description: 'Dial from any mobile phone. Toll-free, works without airtime, routes to nearest emergency centre.',
        tollFree: true,
        available24h: true,
        relevantReportTypes: ['all'],
      },
      {
        name: 'South African Police Service (SAPS)',
        number: '10111',
        description: 'Crimes in progress, immediate danger, or to reach the Flying Squad.',
        tollFree: true,
        available24h: true,
        relevantCategories: ['theft', 'robbery', 'assault', 'burglary', 'hijacking', 'vandalism', 'drug_activity', 'crime_other'],
        relevantReportTypes: ['crime', 'all'],
      },
      {
        name: 'Ambulance & Fire Brigade',
        number: '10177',
        description: 'Medical emergencies and fire response (landline).',
        tollFree: true,
        available24h: true,
        relevantReportTypes: ['all'],
      },
    ],
  },
  {
    id: 'crime',
    label: 'Crime Reporting & Helplines',
    icon: '🛡️',
    contacts: [
      {
        name: 'Crime Stop (Anonymous Tips)',
        number: '08600 10111',
        description: 'Anonymously report crime tips or ongoing criminal activity.',
        tollFree: true,
        available24h: true,
        relevantCategories: ['theft', 'robbery', 'assault', 'burglary', 'hijacking', 'vandalism', 'drug_activity', 'fraud', 'crime_other'],
        relevantReportTypes: ['crime'],
      },
      {
        name: 'Gender-Based Violence Command Centre',
        number: '0800 428 428',
        description: '24/7 toll-free crisis helpline for victims of domestic abuse or gender-based violence.',
        tollFree: true,
        available24h: true,
        relevantCategories: ['domestic_violence', 'assault'],
        relevantReportTypes: ['crime'],
      },
      {
        name: 'Childline South Africa',
        number: '116',
        description: 'Free helpline for children, youth, and parents seeking help or reporting child abuse.',
        tollFree: true,
        available24h: true,
        relevantCategories: ['domestic_violence', 'assault'],
        relevantReportTypes: ['crime'],
      },
      {
        name: 'National Human Trafficking Hotline',
        number: '0800 222 777',
        description: 'Report suspected human trafficking or request help for victims.',
        tollFree: true,
        available24h: true,
        relevantCategories: ['crime_other'],
        relevantReportTypes: ['crime'],
      },
    ],
  },
  {
    id: 'mental_health',
    label: 'Mental Health & Crisis Support',
    icon: '🧠',
    contacts: [
      {
        name: 'Suicide Crisis Helpline (SADAG)',
        number: '0800 567 567',
        description: 'Free 24-hour crisis intervention by the SA Depression and Anxiety Group.',
        tollFree: true,
        available24h: true,
        relevantReportTypes: ['all'],
      },
      {
        name: 'LifeLine South Africa',
        number: '0861 322 322',
        description: 'National crisis line providing confidential counseling and emotional support.',
        tollFree: false,
        available24h: true,
        relevantReportTypes: ['all'],
      },
    ],
  },
  {
    id: 'government',
    label: 'Government Services',
    icon: '🏛️',
    contacts: [
      {
        name: 'Presidential Hotline',
        number: '17737',
        description: 'Voice complaints about poor service delivery from government departments.',
        tollFree: true,
        available24h: false,
        relevantCategories: ['pothole', 'water_leak', 'electricity', 'sewage', 'traffic_light', 'other'],
        relevantReportTypes: ['civic'],
      },
      {
        name: 'National Anti-Corruption Hotline',
        number: '0800 701 701',
        description: 'Report corruption or fraud involving public entities and officials.',
        tollFree: true,
        available24h: true,
        relevantCategories: ['fraud'],
        relevantReportTypes: ['civic', 'crime'],
      },
    ],
  },
];

/**
 * Get contacts relevant to a specific crime/civic category
 */
export function getContactsForCategory(category: string, reportType: 'civic' | 'crime'): EmergencyContact[] {
  const results: EmergencyContact[] = [];

  for (const cat of EMERGENCY_CATEGORIES) {
    for (const contact of cat.contacts) {
      const typeMatch = contact.relevantReportTypes.includes(reportType) || contact.relevantReportTypes.includes('all');
      const categoryMatch = !contact.relevantCategories || contact.relevantCategories.includes(category);

      if (typeMatch && categoryMatch) {
        results.push(contact);
      }
    }
  }

  return results;
}

/**
 * Get the most critical contact for a given situation (for the safety banner)
 */
export function getPrimaryEmergencyContact(category: string): EmergencyContact {
  // For domestic violence, prioritize the GBV hotline
  if (category === 'domestic_violence') {
    return EMERGENCY_CATEGORIES[1].contacts[1]; // GBV Command Centre
  }
  // Default to SAPS for crime
  return EMERGENCY_CATEGORIES[0].contacts[1]; // SAPS 10111
}

/**
 * Format phone number for tel: URI
 */
export function formatTelUri(number: string): string {
  // Remove spaces for the tel URI, keep leading zeros for SA numbers
  const cleaned = number.replace(/\s/g, '');
  return `tel:${cleaned}`;
}
