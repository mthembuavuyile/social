export interface Comment {
  id?: string;
  author: string;
  authorUid: string;
  text: string;
  timestamp: number;
}

export interface Milestone {
  id: string;
  title: string;
  targetAmount: number;
  description: string;
  completed: boolean;
  proofUrl?: string;
  approvedBy?: Record<string, boolean>;
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
  
  // ===== Track System =====
  // 'civic' = Track 2 (pothole, water leak, fallen tree — community crowdfunded repair)
  // 'gig'   = Track 1 (private 1-to-1 service — fix my shower, build my website)
  // 'project' = Track 3 (large community crowdfunding — soccer field, school windows)
  postTrack?: 'civic' | 'gig' | 'project';

  // UbuntuFix Civic Fields (Track: civic)
  category?: 'pothole' | 'water_leak' | 'electricity' | 'sewage' | 'traffic_light' | 'other';
  location?: string;
  province?: string;
  city?: string;
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

  // Crowdfunding fields (used by civic + project tracks)
  isCrowdfunded?: boolean;
  bountyGoal?: number;
  bountyRaised?: number;
  backers?: Record<string, number>; // uid -> amount

  // Geolocation fields
  latitude?: number;
  longitude?: number;

  // ===== Gig Track Fields (Track: gig) =====
  gigCategory?: 'plumbing' | 'electrical' | 'cleaning' | 'web_dev' | 'tutoring' | 'gardening' | 'painting' | 'other_gig';
  gigContactPhone?: string; // For WhatsApp redirect
  gigPrice?: number; // Listed price in Rands
  gigApplicants?: Record<string, { name: string; timestamp: number }>; // uid -> applicant info
  gigAcceptedUid?: string;
  gigAcceptedName?: string;

  // ===== Project Track Fields (Track: project) =====
  milestones?: Milestone[];
  projectCategory?: 'infrastructure' | 'education' | 'sports' | 'health' | 'environment' | 'community' | 'other_project';
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
