export type CivicCategory = 'pothole' | 'water_leak' | 'electricity' | 'sewage' | 'traffic_light' | 'other';

export type CrimeCategory = 'theft' | 'robbery' | 'assault' | 'burglary' | 'vandalism' | 'hijacking' | 'drug_activity' | 'fraud' | 'domestic_violence' | 'crime_other';

export type ReportType = 'civic' | 'crime';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  authorUid: string;
  timestamp: number;
  parentId?: string;
  replyCount?: number;
}

export interface Post {
  id: string;
  content: string; // Issue description
  imageUrl?: string; // Photo of the issue
  author: string;
  authorUid: string;
  timestamp: number;
  reactions?: Record<string, number>;
  userReactions?: Record<string, string>;
  
  // Poll & Comments Data
  pollOptions?: PollOption[];
  pollExpiresAt?: number;
  commentsCount?: number;

  // Shared Fields
  reportType?: ReportType; // 'civic' (default) or 'crime'
  category?: CivicCategory | CrimeCategory;
  location?: string;
  province?: string;
  city?: string;
  status?: 'active' | 'in_progress' | 'resolved';
  latitude?: number;
  longitude?: number;
  socialUrl?: string; // e.g. X/Twitter post link

  // Crime-specific Fields
  crimeUrgency?: 'low' | 'medium' | 'high' | 'emergency';
  incidentTime?: string; // When the crime occurred
  policeContacted?: boolean;
  caseNumber?: string; // SAPS case number
  anonymous?: boolean; // Display as anonymous for safety
}
