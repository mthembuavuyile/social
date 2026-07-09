export interface Post {
  id: string;
  content: string; // Issue description
  imageUrl?: string; // Photo of the issue
  author: string;
  authorUid: string;
  timestamp: number;
  reactions?: Record<string, number>;
  userReactions?: Record<string, string>;
  
  // Civic Fields
  category?: 'pothole' | 'water_leak' | 'electricity' | 'sewage' | 'traffic_light' | 'other';
  location?: string;
  province?: string;
  city?: string;
  status?: 'active' | 'in_progress' | 'resolved';
  latitude?: number;
  longitude?: number;
}
