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
  // 'civic' = Track 2 (pothole, water leak, fallen tree — community co-funded/reported repair)
  // 'gig'   = Track 1 (private service — fix my shower, build my website)
  // 'project' = Track 3 (large community initiative — soccer field restoration, school library)
  postTrack?: 'civic' | 'gig' | 'project';

  // UbuntuFix Civic & Community Fields
  category?: 'pothole' | 'water_leak' | 'electricity' | 'sewage' | 'traffic_light' | 'other';
  location?: string;
  province?: string;
  city?: string;
  status?: 'active' | 'approved' | 'in_progress' | 'resolved' | 'burned' | 'jury' | 'resolved_complete'; // 'jury' = under audit review, 'burned' = archived/spam
  compensationValue?: number; // Simulated payout in Rands (ZAR)
  assignedFixerUid?: string;
  assignedFixerName?: string;
  fixImageUrl?: string; // After photo URL (proof of fix)
  fixCompletedAt?: number;
  verifications?: Record<string, boolean>; // neighbor sign-offs
  disputes?: Record<string, boolean>; // dispute flags trigger audit
  
  // Civic audit details (represented in DB as legacy court votes for compatibility)
  courtVotesKeep?: Record<string, boolean>; // audit votes to ACCEPT fix
  courtVotesBurn?: Record<string, boolean>; // audit votes to REJECT/FINE fix

  // Crowdfunding fields (used by civic + project tracks)
  isCrowdfunded?: boolean;
  bountyGoal?: number;
  bountyRaised?: number;
  backers?: Record<string, number>; // uid -> ZAR amount

  // Geolocation fields
  latitude?: number;
  longitude?: number;

  // ===== Gig Track Fields (Track: gig) =====
  gigCategory?: 'plumbing' | 'electrical' | 'cleaning' | 'web_dev' | 'tutoring' | 'gardening' | 'painting' | 'other_gig';
  gigContactPhone?: string; // WhatsApp integration
  gigPrice?: number; // Budget in Rands (ZAR)
  gigApplicants?: Record<string, { name: string; timestamp: number }>; // applicant roster
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

// Re-framed as Community Petition or Poll
export interface Proposal {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorUid: string;
  timestamp: number;
  type: 'setting' | 'text'; // setting represents dynamic banner updates
  settingKey?: 'announcement';
  settingValue?: string;
  status: 'active' | 'passed' | 'defeated';
  votesFor?: Record<string, number>; // uid -> rating weight
  votesAgainst?: Record<string, number>; // uid -> rating weight
  totalVotesFor: number;
  totalVotesAgainst: number;
  endTime: number;
}

export interface DaoSettings {
  announcement: string;
  postingAllowed: boolean;
}

