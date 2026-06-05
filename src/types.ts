export interface Comment {
  id?: string;
  author: string;
  authorUid: string;
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  content: string; // Issue description
  tags?: string;
  imageUrl?: string; // Before photo URL
  author: string;
  authorUid: string;
  timestamp: number;
  reactions?: Record<string, number>;
  userReactions?: Record<string, string>;
  comments?: Record<string, Comment>;
  flags?: Record<string, boolean>;
  
  // UbuntuFix Civic & Gig Fields
  category?: 'pothole' | 'water_leak' | 'electricity' | 'sewage' | 'traffic_light' | 'other';
  location?: string;
  status?: 'active' | 'approved' | 'in_progress' | 'resolved' | 'burned' | 'jury' | 'resolved_complete';
  compensationValue?: number; // Simulated payout (in Rands)
  assignedFixerUid?: string;
  assignedFixerName?: string;
  fixImageUrl?: string; // After photo URL
  fixCompletedAt?: number;
  verifications?: Record<string, boolean>;
  disputes?: Record<string, boolean>;
  
  // Legacy community court voting
  courtVotesKeep?: Record<string, boolean>;
  courtVotesBurn?: Record<string, boolean>;

  // Crowdfunding fields
  isCrowdfunded?: boolean;
  bountyGoal?: number;
  bountyRaised?: number;
  backers?: Record<string, number>; // uid -> amount

  // Geolocation fields
  latitude?: number;
  longitude?: number;
}

export interface Stat {
  totalPosts: number;
  totalReactions: number;
  activeUsers: number;
}

export interface Trend {
  tag: string;
  count: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorUid: string;
  timestamp: number;
  type: 'setting' | 'text';
  settingKey?: 'announcement';
  settingValue?: string;
  status: 'active' | 'passed' | 'defeated';
  votesFor?: Record<string, number>; // uid -> reputation weight
  votesAgainst?: Record<string, number>; // uid -> reputation weight
  totalVotesFor: number;
  totalVotesAgainst: number;
  endTime: number;
}

export interface DaoSettings {
  announcement: string;
  postingAllowed: boolean;
}

