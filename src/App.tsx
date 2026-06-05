import { useState, useEffect, useMemo } from 'react';
import { 
  ref, 
  onValue, 
  set, 
  push, 
  serverTimestamp as rtdbServerTimestamp, 
  onDisconnect 
} from 'firebase/database';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction,
  serverTimestamp as firestoreServerTimestamp
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, dbFirestore, auth } from './firebase';
import { Post, Trend, DaoSettings, Proposal, Milestone } from './types';
import { getInitials, getUserColor } from './utils';
import { PostCard } from './components/Feed/PostCard';
import { PostComposer } from './components/Feed/PostComposer';
import { TrackSelector } from './components/Feed/TrackSelector';
import { Toast } from './components/Layout/Toast';
import { DaoPanel } from './components/DAO/DaoPanel';
import { CivicMap } from './components/Map/CivicMap';
import { ImpactDashboard } from './components/Impact/ImpactDashboard';
import { ViralCard } from './components/Share/ViralCard';
import { Home, Compass, Shield, User, Search, Map } from 'lucide-react';


export default function App() {
  // Views & Routing State
  const [activeView, setActiveView] = useState<'home' | 'explore' | 'profile' | 'dao' | 'map'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'in_progress' | 'resolved'>('all');
  const [trackFilter, setTrackFilter] = useState<'all' | 'civic' | 'gig' | 'project'>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  
  // Auth & Profile State
  const [user, setUser] = useState('Guest');
  const [uid, setUid] = useState<string | null>(null);
  const [isFixer, setIsFixer] = useState(false);
  const [earnings, setEarnings] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(500);
  const [mapActivePostId, setMapActivePostId] = useState<string | null>(null);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswerInput, setCaptchaAnswerInput] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Real-time Data Sync
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedReady, setFeedReady] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [pendingHighlight, setPendingHighlight] = useState<string | null>(null);

  // Community Governance State
  const [reputation, setReputation] = useState<number>(50);
  const [reputationsMap, setReputationsMap] = useState<Record<string, number>>({});
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [daoSettings, setDaoSettings] = useState<DaoSettings>({
    announcement: 'Welcome to UbuntuFix! A decentralized network solving local civic issues.',
    postingAllowed: true
  });

  // Viral Share Modal
  const [viralSharePost, setViralSharePost] = useState<Post | null>(null);

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'info',
    show: false,
  });

  // Helper: Trigger Toast
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type, show: true });
  };

  // Helper: Generate CAPTCHA
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaAnswerInput('');
  };

  // Close Toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Auth, Profile Init, Presence Sync
  useEffect(() => {
    signInAnonymously(auth).catch(() => showToast('Connection failed.', 'error'));
    
    const unsubscribeAuth = onAuthStateChanged(auth, currentUser => {
      if (!currentUser) return;
      setUid(currentUser.uid);

      // Load Profile
      const savedName = localStorage.getItem('ubuntuUserName') || localStorage.getItem('nexysUserName');
      if (savedName) {
        setUser(savedName);
        setProfileNameInput(savedName);
      }
      const savedIsFixer = localStorage.getItem('ubuntuIsFixer');
      if (savedIsFixer) {
        setIsFixer(savedIsFixer === 'true');
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    if (postId) {
      setActiveView('home');
      setPendingHighlight(postId);
    }

    generateCaptcha();
    return () => unsubscribeAuth();
  }, []);

  // Sync Presence
  useEffect(() => {
    if (!uid) return;

    const presenceRef = ref(db, '.info/connected');
    const myConnRef = push(ref(db, 'connections'));

    const unsubscribePresence = onValue(presenceRef, snap => {
      if (snap.val() === true) {
        onDisconnect(myConnRef).remove();
        set(myConnRef, { user, ts: rtdbServerTimestamp() });
      }
    });

    const connRef = ref(db, 'connections');
    const unsubscribeConn = onValue(connRef, snap => {
      setOnlineCount(snap.exists() ? snap.size : 0);
    });

    return () => {
      unsubscribePresence();
      unsubscribeConn();
    };
  }, [uid, user]);

  // Sync Database Feed (Firestore)
  useEffect(() => {
    const postsRef = collection(dbFirestore, 'posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsArray: Post[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        postsArray.push({
          id: doc.id,
          content: data.content || '',
          tags: data.tags,
          imageUrl: data.imageUrl,
          author: data.author || '',
          authorUid: data.authorUid || '',
          timestamp: data.timestamp ? (data.timestamp.toMillis ? data.timestamp.toMillis() : data.timestamp) : Date.now(),
          reactions: data.reactions || {},
          userReactions: data.userReactions || {},
          flags: data.flags || {},
          // Track system
          postTrack: data.postTrack || 'civic',
          // Civic fields
          category: data.category,
          location: data.location,
          province: data.province,
          city: data.city,
          status: data.status || 'active',
          compensationValue: data.compensationValue,
          assignedFixerUid: data.assignedFixerUid,
          assignedFixerName: data.assignedFixerName,
          fixImageUrl: data.fixImageUrl,
          fixCompletedAt: data.fixCompletedAt ? (data.fixCompletedAt.toMillis ? data.fixCompletedAt.toMillis() : data.fixCompletedAt) : undefined,
          verifications: data.verifications || {},
          disputes: data.disputes || {},
          courtVotesKeep: data.courtVotesKeep || {},
          courtVotesBurn: data.courtVotesBurn || {},
          // Crowdfunding
          isCrowdfunded: data.isCrowdfunded || false,
          bountyGoal: data.bountyGoal,
          bountyRaised: data.bountyRaised || 0,
          backers: data.backers || {},
          // Geolocation
          latitude: data.latitude,
          longitude: data.longitude,
          // Gig fields
          gigCategory: data.gigCategory,
          gigContactPhone: data.gigContactPhone,
          gigPrice: data.gigPrice,
          gigApplicants: data.gigApplicants || {},
          gigAcceptedUid: data.gigAcceptedUid,
          gigAcceptedName: data.gigAcceptedName,
          // Project fields
          milestones: data.milestones || [],
          projectCategory: data.projectCategory,
        });
      });
      setPosts(postsArray);
      setFeedReady(true);
    });

    return () => unsubscribePosts();
  }, []);

  // Sync Settings (Firestore)
  useEffect(() => {
    const settingsRef = doc(dbFirestore, 'settings', 'dao');
    const unsubscribeSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setDaoSettings(snap.data() as DaoSettings);
      } else {
        const defaults: DaoSettings = {
          announcement: 'Welcome to UbuntuFix! A decentralized network solving local civic issues.',
          postingAllowed: true
        };
        setDoc(settingsRef, defaults);
        setDaoSettings(defaults);
      }
    });

    return () => unsubscribeSettings();
  }, []);

  // Apply theme dynamically to body
  useEffect(() => {
    document.body.className = 'theme-twitter-dark';
  }, []);

  // Sync Reputation (Firestore)
  useEffect(() => {
    if (!uid) return;

    const repRef = doc(dbFirestore, `reputations/${uid}`);
    const unsubscribeRep = onSnapshot(repRef, (snap) => {
      if (snap.exists()) {
        setReputation(snap.data().value ?? 50);
      } else {
        setDoc(repRef, { value: 50 });
        setReputation(50);
      }
    });

    const allRepsRef = collection(dbFirestore, 'reputations');
    const unsubscribeAllReps = onSnapshot(allRepsRef, (snap) => {
      const repsMap: Record<string, number> = {};
      snap.forEach((doc) => {
        repsMap[doc.id] = doc.data().value ?? 50;
      });
      setReputationsMap(repsMap);
    });

    return () => {
      unsubscribeRep();
      unsubscribeAllReps();
    };
  }, [uid]);

  // Sync Simulated Earnings (Firestore)
  useEffect(() => {
    if (!uid) return;

    const earningsRef = doc(dbFirestore, `earnings/${uid}`);
    const unsubscribeEarnings = onSnapshot(earningsRef, (snap) => {
      if (snap.exists()) {
        setEarnings(snap.data().value ?? 0);
      } else {
        setDoc(earningsRef, { value: 0 });
        setEarnings(0);
      }
    });

    return () => unsubscribeEarnings();
  }, [uid]);

  // Sync Simulated Wallet Balance (Firestore)
  useEffect(() => {
    if (!uid) return;

    const walletRef = doc(dbFirestore, `wallets/${uid}`);
    const unsubscribeWallet = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        setWalletBalance(snap.data().value ?? 500);
      } else {
        setDoc(walletRef, { value: 500 });
        setWalletBalance(500);
      }
    });

    return () => unsubscribeWallet();
  }, [uid]);

  // Sync proposals (Firestore)
  useEffect(() => {
    const proposalsRef = collection(dbFirestore, 'proposals');
    const q = query(proposalsRef, orderBy('timestamp', 'desc'));
    const unsubscribeProposals = onSnapshot(q, (snap) => {
      const proposalList: Proposal[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        proposalList.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          creator: data.creator || '',
          creatorUid: data.creatorUid || '',
          timestamp: data.timestamp ? (data.timestamp.toMillis ? data.timestamp.toMillis() : data.timestamp) : Date.now(),
          type: data.type || 'text',
          settingKey: data.settingKey,
          settingValue: data.settingValue,
          status: data.status || 'active',
          votesFor: data.votesFor || {},
          votesAgainst: data.votesAgainst || {},
          totalVotesFor: data.totalVotesFor || 0,
          totalVotesAgainst: data.totalVotesAgainst || 0,
          endTime: data.endTime ? (data.endTime.toMillis ? data.endTime.toMillis() : data.endTime) : Date.now() + 5 * 60 * 1000
        });
      });
      setProposals(proposalList);
    });

    return () => unsubscribeProposals();
  }, []);

  // Expiry Checker for Proposals (Firestore)
  useEffect(() => {
    if (proposals.length === 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      proposals.forEach(async (prop) => {
        if (prop.status === 'active' && now > prop.endTime) {
          const totalVotes = prop.totalVotesFor + prop.totalVotesAgainst;
          const passed = prop.totalVotesFor > prop.totalVotesAgainst && totalVotes > 0;
          const finalStatus = passed ? 'passed' : 'defeated';

          try {
            const propRef = doc(dbFirestore, 'proposals', prop.id);
            await runTransaction(dbFirestore, async (transaction) => {
              const pDoc = await transaction.get(propRef);
              if (pDoc.exists() && pDoc.data().status === 'active') {
                transaction.update(propRef, { status: finalStatus });

                if (passed && prop.type === 'setting' && prop.settingKey && prop.settingValue !== undefined) {
                  const settingsRef = doc(dbFirestore, 'settings', 'dao');
                  transaction.update(settingsRef, { [prop.settingKey]: prop.settingValue });
                }

                // If defeated due to NO votes, refund 10 points to creator
                if (!passed && totalVotes === 0 && prop.creatorUid) {
                  const creatorRepRef = doc(dbFirestore, `reputations/${prop.creatorUid}`);
                  const creatorDoc = await transaction.get(creatorRepRef);
                  if (creatorDoc.exists()) {
                    const currentRep = creatorDoc.data().value || 50;
                    transaction.update(creatorRepRef, { value: currentRep + 10 });
                  }
                }
              }
            });

            if (uid === prop.creatorUid) {
              showToast(`Your Proposal has been ${finalStatus}!`, passed ? 'success' : 'info');
            }
          } catch (e) {
            console.error("Failed to execute proposal", e);
          }
        }
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [proposals, uid]);



  const trendingTags = useMemo<Trend[]>(() => {
    const tagsMap: Record<string, number> = {};
    posts.forEach(p => {
      if (p.category) {
        tagsMap[p.category] = (tagsMap[p.category] || 0) + 1;
      }
    });
    return Object.entries(tagsMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [posts]);

  // FILTERED POSTS (with track filter)
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Track filter
    if (trackFilter !== 'all') {
      result = result.filter(p => (p.postTrack || 'civic') === trackFilter);
    }

    // Province filter
    if (selectedProvince !== 'all') {
      result = result.filter(p => p.province === selectedProvince);
    }

    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(p => {
        const searchableString = `${p.content} ${p.author} ${p.category || ''} ${p.location || ''} ${p.gigCategory || ''} ${p.projectCategory || ''}`.toLowerCase();
        return searchableString.includes(q);
      });
    }

    // Status Filter tab
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    return result;
  }, [posts, searchQuery, statusFilter, trackFilter]);

  const flaggedPosts = useMemo(() => {
    return posts.filter(p => p.status === 'jury');
  }, [posts]);

  // Profile stats
  const profileStats = useMemo(() => {
    if (!uid) return { civicReported: 0, gigsPosted: 0, projectsLaunched: 0, backed: 0 };
    return {
      civicReported: posts.filter(p => p.authorUid === uid && (p.postTrack || 'civic') === 'civic').length,
      gigsPosted: posts.filter(p => p.authorUid === uid && p.postTrack === 'gig').length,
      projectsLaunched: posts.filter(p => p.authorUid === uid && p.postTrack === 'project').length,
      backed: posts.filter(p => p.backers?.[uid]).length,
    };
  }, [posts, uid]);

  // ===== ACTIONS =====

  const handleCreateReport = async (data: {
    content: string;
    imageUrl: string;
    category: string;
    location: string;
    province?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    isCrowdfunded?: boolean;
    bountyGoal?: number;
    postTrack: 'civic' | 'gig' | 'project';
    gigCategory?: string;
    gigContactPhone?: string;
    gigPrice?: number;
    projectCategory?: string;
    milestones?: Milestone[];
  }) => {
    if (user === 'Guest' || !uid) return;
    
    const compensationValues: Record<string, number> = {
      pothole: 250, water_leak: 200, electricity: 150,
      sewage: 400, traffic_light: 300, other: 150
    };

    const baseComp = data.postTrack === 'civic' 
      ? (data.isCrowdfunded ? data.bountyGoal : compensationValues[data.category] || 150)
      : data.postTrack === 'gig' 
        ? data.gigPrice 
        : data.bountyGoal;

    await addDoc(collection(dbFirestore, 'posts'), {
      content: data.content,
      category: data.category,
      location: data.location,
      province: data.province || null,
      city: data.city || null,
      imageUrl: data.imageUrl || null,
      author: user,
      authorUid: uid,
      timestamp: firestoreServerTimestamp(),
      status: 'active',
      compensationValue: baseComp || 150,
      reactions: {},
      userReactions: {},
      flags: {},
      verifications: {},
      disputes: {},
      courtVotesKeep: {},
      courtVotesBurn: {},
      // Track system
      postTrack: data.postTrack,
      // Crowdfunding
      isCrowdfunded: data.isCrowdfunded || data.postTrack === 'project',
      bountyGoal: data.bountyGoal || null,
      bountyRaised: (data.isCrowdfunded || data.postTrack === 'project') ? 0 : null,
      backers: {},
      // Geolocation
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      // Gig fields
      gigCategory: data.gigCategory || null,
      gigContactPhone: data.gigContactPhone || null,
      gigPrice: data.gigPrice || null,
      gigApplicants: {},
      gigAcceptedUid: null,
      gigAcceptedName: null,
      // Project fields
      projectCategory: data.projectCategory || null,
      milestones: data.milestones || [],
    });

    const currentRep = reputationsMap[uid] || 50;
    await setDoc(doc(dbFirestore, `reputations/${uid}`), { value: currentRep + 5 });
  };

  const handleBackProject = async (postId: string, amount: number) => {
    if (!uid || user === 'Guest') return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const postRef = doc(dbFirestore, 'posts', postId);
    const userWalletRef = doc(dbFirestore, `wallets/${uid}`);

    try {
      await runTransaction(dbFirestore, async (transaction) => {
        const userWalletDoc = await transaction.get(userWalletRef);
        const currentBalance = userWalletDoc.exists() ? (userWalletDoc.data().value ?? 500) : 500;
        if (currentBalance < amount) throw new Error("Insufficient balance.");

        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) throw new Error("Post does not exist.");
        const postData = postDoc.data();
        const currentBountyRaised = postData.bountyRaised || 0;
        const newBountyRaised = currentBountyRaised + amount;
        const currentBackers = postData.backers || {};
        const userBackerAmount = currentBackers[uid] || 0;
        const newBackers = { ...currentBackers, [uid]: userBackerAmount + amount };

        transaction.set(userWalletRef, { value: currentBalance - amount });
        transaction.update(postRef, {
          bountyRaised: newBountyRaised,
          backers: newBackers,
          compensationValue: Math.max(postData.compensationValue || 0, newBountyRaised)
        });
      });
      showToast(`Pledged R${amount} successfully!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Pledge failed.', 'error');
      throw e;
    }
  };

  const handleToggleReaction = async (postId: string, emoji: string) => {
    if (!uid) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const old = post.userReactions?.[uid];
    const postRef = doc(dbFirestore, 'posts', postId);
    const authorUid = post.authorUid;
    const authorRep = reputationsMap[authorUid] || 50;
    const authorRepRef = doc(dbFirestore, `reputations/${authorUid}`);

    try {
      await runTransaction(dbFirestore, async (transaction) => {
        const newReactions = { ...post.reactions };
        const newUserReactions = { ...post.userReactions };
        let newAuthorRep = authorRep;

        if (old === emoji) {
          newReactions[old] = Math.max(0, (newReactions[old] || 1) - 1);
          delete newUserReactions[uid];
          newAuthorRep = Math.max(0, authorRep - 1);
        } else {
          if (old) {
            newReactions[old] = Math.max(0, (newReactions[old] || 1) - 1);
          } else {
            newAuthorRep = authorRep + 1;
          }
          newReactions[emoji] = (newReactions[emoji] || 0) + 1;
          newUserReactions[uid] = emoji;
        }

        transaction.update(postRef, { reactions: newReactions, userReactions: newUserReactions });
        transaction.set(authorRepRef, { value: newAuthorRep });
      });
    } catch (e) {
      console.error(e);
      showToast('Upvote failed', 'error');
    }
  };

  const handleClaimGig = async (postId: string) => {
    if (!uid || user === 'Guest') return;
    const postRef = doc(dbFirestore, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    
    // For gig track: mark as complete when owner clicks "Mark as Completed"
    if (post?.postTrack === 'gig' && post.authorUid === uid) {
      await updateDoc(postRef, { status: 'resolved_complete' });
      // Pay the accepted worker
      if (post.gigAcceptedUid) {
        const workerEarningsRef = doc(dbFirestore, `earnings/${post.gigAcceptedUid}`);
        const workerRepRef = doc(dbFirestore, `reputations/${post.gigAcceptedUid}`);
        await runTransaction(dbFirestore, async (transaction) => {
          const earningsDoc = await transaction.get(workerEarningsRef);
          const currentEarnings = earningsDoc.exists() ? (earningsDoc.data().value || 0) : 0;
          transaction.set(workerEarningsRef, { value: currentEarnings + (post.gigPrice || post.compensationValue || 150) });
          const repDoc = await transaction.get(workerRepRef);
          const currentRep = repDoc.exists() ? (repDoc.data().value || 50) : 50;
          transaction.set(workerRepRef, { value: currentRep + 30 });
        });
      }
      showToast('Gig marked as completed! Worker paid.', 'success');
      return;
    }

    // For civic track: claim repair
    await updateDoc(postRef, {
      status: 'in_progress',
      assignedFixerUid: uid,
      assignedFixerName: user
    });
    showToast('Gig claimed! Fix it and submit proof.', 'success');
  };

  const handleApplyForGig = async (postId: string) => {
    if (!uid || user === 'Guest') return;
    const postRef = doc(dbFirestore, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (post.gigApplicants?.[uid]) {
      showToast('You already applied.', 'info');
      return;
    }

    const newApplicants = { ...post.gigApplicants, [uid]: { name: user, timestamp: Date.now() } };
    await updateDoc(postRef, { gigApplicants: newApplicants });
    showToast('Applied for this gig! The poster will review.', 'success');
  };

  const handleAcceptApplicant = async (postId: string, applicantUid: string) => {
    if (!uid) return;
    const post = posts.find(p => p.id === postId);
    if (!post || post.authorUid !== uid) return;
    const applicant = post.gigApplicants?.[applicantUid];
    if (!applicant) return;

    const postRef = doc(dbFirestore, 'posts', postId);
    await updateDoc(postRef, {
      gigAcceptedUid: applicantUid,
      gigAcceptedName: applicant.name,
      status: 'in_progress',
    });
    showToast(`Accepted ${applicant.name}! You can now coordinate via WhatsApp.`, 'success');
  };

  const handleSubmitFix = async (postId: string, fixImageUrl: string) => {
    if (!uid) return;
    const postRef = doc(dbFirestore, 'posts', postId);
    await updateDoc(postRef, {
      status: 'resolved',
      fixImageUrl: fixImageUrl,
      fixCompletedAt: firestoreServerTimestamp()
    });
    showToast('Work submitted! Awaiting audit verifications.', 'success');
  };

  const handleVerifyFix = async (postId: string, vote: 'verify' | 'dispute') => {
    if (!uid) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const postRef = doc(dbFirestore, 'posts', postId);

    if (vote === 'verify') {
      const newVerifications = { ...post.verifications, [uid]: true };
      const currentVers = Object.keys(newVerifications).length;

      if (currentVers >= 3) {
        await runTransaction(dbFirestore, async (transaction) => {
          transaction.update(postRef, { verifications: newVerifications, status: 'resolved_complete' });
          const fixerUid = post.assignedFixerUid;
          if (fixerUid) {
            const fixerRepRef = doc(dbFirestore, `reputations/${fixerUid}`);
            const fixerEarningsRef = doc(dbFirestore, `earnings/${fixerUid}`);
            const fixerRep = reputationsMap[fixerUid] || 50;
            transaction.set(fixerRepRef, { value: fixerRep + 50 });
            const comp = post.compensationValue || 150;
            const fixerEarningsDoc = await transaction.get(fixerEarningsRef);
            const fixerEarningsVal = fixerEarningsDoc.exists() ? (fixerEarningsDoc.data().value || 0) : 0;
            transaction.set(fixerEarningsRef, { value: fixerEarningsVal + comp });
          }
        });
        showToast('Repair verified by 3 neighbors! Payout complete.', 'success');
      } else {
        await updateDoc(postRef, { verifications: newVerifications });
        showToast(`Verification registered. ${3 - currentVers} more needed.`, 'info');
      }
    } else {
      const newDisputes = { ...post.disputes, [uid]: true };
      const currentDisps = Object.keys(newDisputes).length;

      if (currentDisps >= 3) {
        await updateDoc(postRef, { disputes: newDisputes, status: 'jury' });
        showToast('Disputes reached 3! Sent to Community Court.', 'error');
      } else {
        await updateDoc(postRef, { disputes: newDisputes });
        showToast(`Dispute registered. ${3 - currentDisps} more to trigger trial.`, 'info');
      }
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (user === 'Guest' || !uid) return;
    const commentsRef = collection(dbFirestore, `posts/${postId}/comments`);
    await addDoc(commentsRef, {
      author: user,
      authorUid: uid,
      text,
      timestamp: firestoreServerTimestamp()
    });

    const currentRep = reputationsMap[uid] || 50;
    await setDoc(doc(dbFirestore, `reputations/${uid}`), { value: currentRep + 1 });
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Permanently delete this report?')) return;
    try {
      await deleteDoc(doc(dbFirestore, 'posts', postId));
      showToast('Report deleted', 'success');
    } catch (e) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleFlagPost = async (postId: string) => {
    if (!uid) return;
    const currentRep = reputationsMap[uid] || 50;
    if (currentRep < 5) { showToast('Not enough Ubuntu Points to flag.', 'error'); return; }
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (post.flags?.[uid]) { showToast('You already flagged this.', 'info'); return; }

    const postRef = doc(dbFirestore, 'posts', postId);
    const newFlags = { ...post.flags, [uid]: true };
    const currentFlagCount = Object.keys(newFlags).length;

    const updates: Record<string, any> = { flags: newFlags };
    if (currentFlagCount >= 3 && post.status !== 'jury') { updates.status = 'jury'; }

    await updateDoc(postRef, updates);
    await setDoc(doc(dbFirestore, `reputations/${uid}`), { value: currentRep - 1 });
    showToast('Report flagged for review.', 'success');
  };

  const handleVoteCourt = async (postId: string, vote: 'keep' | 'burn') => {
    if (!uid) return;
    const currentRep = reputationsMap[uid] || 50;
    if (currentRep < 40) { showToast('Requires ≥40 Ubuntu Points.', 'error'); return; }
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (post.courtVotesKeep?.[uid] || post.courtVotesBurn?.[uid]) { showToast('Already voted.', 'error'); return; }

    const postRef = doc(dbFirestore, 'posts', postId);
    
    if (vote === 'keep') {
      const newKeep = { ...post.courtVotesKeep, [uid]: true };
      const keeps = Object.keys(newKeep).length;
      if (keeps >= 3) {
        await runTransaction(dbFirestore, async (transaction) => {
          transaction.update(postRef, { courtVotesKeep: null, courtVotesBurn: null, flags: null, status: 'resolved_complete' });
          const fixerUid = post.assignedFixerUid;
          if (fixerUid) {
            const fixerRepRef = doc(dbFirestore, `reputations/${fixerUid}`);
            const fixerEarningsRef = doc(dbFirestore, `earnings/${fixerUid}`);
            const fixerRep = reputationsMap[fixerUid] || 50;
            transaction.set(fixerRepRef, { value: fixerRep + 50 });
            const comp = post.compensationValue || 150;
            const fixerEarningsDoc = await transaction.get(fixerEarningsRef);
            const fixerEarningsVal = fixerEarningsDoc.exists() ? (fixerEarningsDoc.data().value || 0) : 0;
            transaction.set(fixerEarningsRef, { value: fixerEarningsVal + comp });
          }
        });
        showToast('Court: Fix Approved & Paid.', 'success');
      } else {
        await updateDoc(postRef, { courtVotesKeep: newKeep });
      }
    } else {
      const newBurn = { ...post.courtVotesBurn, [uid]: true };
      const burns = Object.keys(newBurn).length;
      if (burns >= 3) {
        await runTransaction(dbFirestore, async (transaction) => {
          transaction.update(postRef, {
            status: 'active', assignedFixerUid: null, assignedFixerName: null,
            fixImageUrl: null, verifications: null, disputes: null, flags: null,
            courtVotesKeep: null, courtVotesBurn: null
          });
          const fixerUid = post.assignedFixerUid;
          if (fixerUid) {
            const fixerRepRef = doc(dbFirestore, `reputations/${fixerUid}`);
            const fixerRep = reputationsMap[fixerUid] || 50;
            transaction.set(fixerRepRef, { value: Math.max(0, fixerRep - 20) });
          }
        });
        showToast('Court: Fix Rejected & Fine Applied.', 'error');
      } else {
        await updateDoc(postRef, { courtVotesBurn: newBurn });
      }
    }
  };

  const handleCreateProposal = async (
    title: string, description: string, type: 'setting' | 'text',
    settingKey?: 'announcement', settingValue?: string
  ) => {
    if (!uid) return;
    const currentRep = reputationsMap[uid] || 50;
    if (currentRep < 10) { showToast('Requires ≥10 Ubuntu Points.', 'error'); return; }

    const now = Date.now();
    const duration = 5 * 60 * 1000;
    const newProposal: any = {
      title, description, creator: user, creatorUid: uid, timestamp: now, type,
      status: 'active', totalVotesFor: 0, totalVotesAgainst: 0, endTime: now + duration,
      votesFor: {}, votesAgainst: {}
    };
    if (type === 'setting') { newProposal.settingKey = settingKey; newProposal.settingValue = settingValue; }

    await addDoc(collection(dbFirestore, 'proposals'), newProposal);
    await setDoc(doc(dbFirestore, `reputations/${uid}`), { value: currentRep - 10 });
  };

  const handleVoteOnProposal = async (proposalId: string, vote: 'for' | 'against') => {
    if (!uid) return;
    const voterRep = reputationsMap[uid] || 50;
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;
    if (proposal.status !== 'active') return;
    if (proposal.votesFor?.[uid] !== undefined || proposal.votesAgainst?.[uid] !== undefined) {
      showToast('You already voted.', 'error'); return;
    }

    const proposalRef = doc(dbFirestore, 'proposals', proposalId);
    if (vote === 'for') {
      const newVotesFor = { ...proposal.votesFor, [uid]: voterRep };
      await updateDoc(proposalRef, { votesFor: newVotesFor, totalVotesFor: proposal.totalVotesFor + voterRep });
    } else {
      const newVotesAgainst = { ...proposal.votesAgainst, [uid]: voterRep };
      await updateDoc(proposalRef, { votesAgainst: newVotesAgainst, totalVotesAgainst: proposal.totalVotesAgainst + voterRep });
    }
  };

  const handleSaveProfile = () => {
    const captchaVal = parseInt(captchaAnswerInput);
    if (captchaVal !== captchaNum1 + captchaNum2) {
      showToast('Incorrect math answer.', 'error'); generateCaptcha(); return;
    }
    const name = profileNameInput.trim();
    if (name.length < 3) { showToast('Username must be at least 3 characters.', 'error'); return; }

    localStorage.setItem('ubuntuUserName', name);
    localStorage.setItem('ubuntuIsFixer', String(isFixer));
    setUser(name);
    setIsEditingProfile(false);
    showToast(`Dashboard updated, ${name}!`, 'success');
    setActiveView('home');
  };

  const handleLogout = () => {
    if (!confirm('Are you sure you want to log out?')) return;
    localStorage.removeItem('ubuntuUserName');
    localStorage.removeItem('ubuntuIsFixer');
    localStorage.removeItem('nexysUserName');
    setUser('Guest'); setProfileNameInput(''); setIsFixer(false); setIsEditingProfile(false);
    showToast('Logged out.', 'info');
  };

  const handleTrendClick = (tag: string) => { setActiveView('home'); setSearchQuery(tag); };

  const initials = getInitials(user);
  const [c1, c2] = getUserColor(user);
  const userAvatarStyle = { background: `linear-gradient(135deg, ${c1}, ${c2})` };

  return (
    <div className="app-container">
      {/* Background blobs */}
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>

      {/* Navigation */}
      <nav className="app-nav">
        <div className="nav-brand">
          <div className="logo-mark">U</div>
          <span className="logo-text">UbuntuFix</span>
        </div>
        <div className="nav-links">
          <button className={`nav-btn ${activeView === 'home' ? 'active' : ''}`} onClick={() => { setActiveView('home'); setSearchQuery(''); setStatusFilter('all'); }}>
            <Home /><span>Feed</span>
          </button>
          <button className={`nav-btn ${activeView === 'map' ? 'active' : ''}`} onClick={() => { setActiveView('map'); setMapActivePostId(null); }}>
            <Map /><span>Map</span>
          </button>
          <button className={`nav-btn ${activeView === 'explore' ? 'active' : ''}`} onClick={() => setActiveView('explore')}>
            <Compass /><span>Impact</span>
          </button>
          <button className={`nav-btn ${activeView === 'dao' ? 'active' : ''}`} onClick={() => setActiveView('dao')}>
            <Shield /><span>Local Board</span>
          </button>
          <button className={`nav-btn ${activeView === 'profile' ? 'active' : ''}`} onClick={() => setActiveView('profile')}>
            <User /><span>Profile</span>
          </button>
        </div>
        <div className="nav-user-status">
          {uid && (
            <div className="sidebar-profile-card">
              <div className="profile-card-header">
                <div className="profile-card-avatar" style={userAvatarStyle}>{initials}</div>
                <div className="profile-card-info">
                  <span className="profile-card-name">{user}</span>
                  <span className="profile-card-role">{isFixer ? '🛠 Local Fixer' : '🏡 Active Neighbor'}</span>
                </div>
              </div>


              <div className="status-filters">
                <div className="profile-stat-item"><span className="stat-value">{reputation}</span><span className="stat-label">Points</span></div>
                <div className="profile-stat-item"><span className="stat-value">R{walletBalance}</span><span className="stat-label">Wallet</span></div>
                {isFixer && (<div className="profile-stat-item"><span className="stat-value">R{earnings}</span><span className="stat-label">Earned</span></div>)}
              </div>
            </div>
          )}
          <div className="presence-status-footer">
            <span className="presence-dot"></span>
            <span>{onlineCount} {onlineCount === 1 ? 'neighbor' : 'neighbors'} active now</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Mobile Header */}
        <header className="mobile-header">
          <div className="logo-mark mobile-logo">U</div>
          <h1 id="mobilePageTitle">
            {activeView === 'home' ? 'Feed' : activeView === 'map' ? 'Map' : activeView === 'explore' ? 'Impact' : activeView === 'dao' ? 'Local Board' : 'Profile'}
          </h1>
          <div className="mobile-presence-badge">
            <span className="presence-dot"></span>
            <span>{onlineCount}</span>
          </div>
        </header>

        {/* View Home */}
        {activeView === 'home' && (
          <section className="view active">
            {daoSettings.announcement && (
              <div className="announcement-banner">
                <span className="announcement-icon">📢</span>
                <span className="announcement-text">{daoSettings.announcement}</span>
              </div>
            )}
            
            <PostComposer 
              user={user}
              onSubmitPost={handleCreateReport}
              onSwitchView={setActiveView}
              showToast={showToast}
            />

            {/* Track Filter */}
            <div className="feed-filter-bar">
              <TrackSelector 
                value={trackFilter} 
                onChange={(t) => setTrackFilter(t as 'all' | 'civic' | 'gig' | 'project')} 
                showAll={true} 
              />
              <select 
                className="standard-input" 
                value={selectedProvince} 
                onChange={(e) => setSelectedProvince(e.target.value)}
                style={{ background: 'var(--surface-color)', color: 'var(--text-main)', padding: '6px 12px', minWidth: '130px', height: '38px', borderRadius: '99px' }}
              >
                <option value="all">All Provinces</option>
                <option value="Eastern Cape">Eastern Cape</option>
                <option value="Free State">Free State</option>
                <option value="Gauteng">Gauteng</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                <option value="Limpopo">Limpopo</option>
                <option value="Mpumalanga">Mpumalanga</option>
                <option value="North West">North West</option>
                <option value="Northern Cape">Northern Cape</option>
                <option value="Western Cape">Western Cape</option>
              </select>
            </div>

            {/* Status Filter tabs */}
            <div className="civic-filter-bar">
              <button className={`civic-filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
              <button className={`civic-filter-btn ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>📢 Open</button>
              <button className={`civic-filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`} onClick={() => setStatusFilter('in_progress')}>🛠 In Progress</button>
              <button className={`civic-filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`} onClick={() => setStatusFilter('resolved')}>🟢 Audit</button>
            </div>
            
            {!feedReady && (
              <div className="feed-skeleton">
                <div className="skeleton-card"><div className="skel skel-line" style={{ height: '40px', borderRadius: '20px' }}></div></div>
                <div className="skeleton-card"><div className="skel skel-line" style={{ height: '80px' }}></div></div>
              </div>
            )}

            <div className="feed-container">
              {filteredPosts.length === 0 && feedReady ? (
                <div className="widget-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No posts matching this filter.
                </div>
              ) : (
                filteredPosts.map(post => (
                  <PostCard 
                    key={post.id}
                    post={post}
                    uid={uid}
                    currentUserName={user}
                    isCurrentUserFixer={isFixer}
                    onToggleReaction={handleToggleReaction}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    showToast={showToast}
                    isHighlighted={pendingHighlight === post.id}
                    userReputation={reputation}
                    onFlagPost={handleFlagPost}
                    onVoteCourt={handleVoteCourt}
                    onClaimGig={handleClaimGig}
                    onSubmitFix={handleSubmitFix}
                    onVerifyFix={handleVerifyFix}
                    onBackProject={handleBackProject}
                    userWalletBalance={walletBalance}
                    onShowOnMap={(postId) => { setMapActivePostId(postId); setActiveView('map'); }}
                    onApplyForGig={handleApplyForGig}
                    onAcceptApplicant={handleAcceptApplicant}
                    onOpenViralShare={(post) => setViralSharePost(post)}
                  />
                ))
              )}
            </div>
          </section>
        )}
 
        {/* View Map */}
        {activeView === 'map' && (
          <section className="view active" style={{ height: 'calc(100vh - 125px)', minHeight: '500px', display: 'flex', flexDirection: 'column', padding: '10px 12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <CivicMap posts={posts} activePostId={mapActivePostId} onViewPost={(postId) => { setPendingHighlight(postId); setActiveView('home'); }} />
            </div>
          </section>
        )}

        {/* View Explore / Impact Dashboard */}
        {activeView === 'explore' && (
          <section className="view active">
            <div className="search-box">
              <Search className="search-icon" />
              <input type="text" placeholder="Search by street, suburb, fixer, category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" />
            </div>

            {searchQuery.length > 0 ? (
              <div className="feed-container">
                {filteredPosts.map(post => (
                  <PostCard 
                    key={post.id} post={post} uid={uid} currentUserName={user}
                    isCurrentUserFixer={isFixer} onToggleReaction={handleToggleReaction}
                    onAddComment={handleAddComment} onDeletePost={handleDeletePost}
                    showToast={showToast} isHighlighted={pendingHighlight === post.id}
                    userReputation={reputation} onFlagPost={handleFlagPost}
                    onVoteCourt={handleVoteCourt} onClaimGig={handleClaimGig}
                    onSubmitFix={handleSubmitFix} onVerifyFix={handleVerifyFix}
                    onBackProject={handleBackProject} userWalletBalance={walletBalance}
                    onShowOnMap={(postId) => { setMapActivePostId(postId); setActiveView('map'); }}
                    onApplyForGig={handleApplyForGig}
                    onAcceptApplicant={handleAcceptApplicant}
                    onOpenViralShare={(post) => setViralSharePost(post)}
                  />
                ))}
              </div>
            ) : (
              <ImpactDashboard posts={posts} onlineCount={onlineCount} />
            )}
          </section>
        )}

        {/* View DAO Governance */}
        {activeView === 'dao' && (
          <section className="view active">
            <DaoPanel 
              uid={uid} username={user} reputation={reputation}
              reputationsMap={reputationsMap} proposals={proposals}
              flaggedPosts={flaggedPosts} onCreateProposal={handleCreateProposal}
              onVoteOnProposal={handleVoteOnProposal} onVoteCourt={handleVoteCourt}
              showToast={showToast}
            />
          </section>
        )}

        {/* View Profile */}
        {activeView === 'profile' && (
          <section className="view active">
            <div className="profile-header">
              <div className="profile-avatar user-avatar" style={userAvatarStyle}>{initials}</div>
              <h2>{user}</h2>
              <p className="profile-sub">
                Status: <strong>{isFixer ? '🛠 Local Fixer' : '🏡 Active Neighbor'}</strong>
              </p>
              <div className="mobile-footer-links"><a href="policy.html">Privacy Policy & Terms</a></div>
            </div>

            {user !== 'Guest' && !isEditingProfile ? (
              <div className="profile-dashboard widget-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
                  <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Ubuntu Points</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>{reputation}</strong>
                  </div>
                  <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Simulated Earnings</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--accent-success)' }}>R{earnings}</strong>
                  </div>
                </div>

                {/* Per-track stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'rgba(29, 155, 240, 0.03)' }}>
                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{profileStats.civicReported}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Civic</span>
                  </div>
                  <div style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.03)' }}>
                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>{profileStats.gigsPosted}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gigs</span>
                  </div>
                  <div style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.03)' }}>
                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-success)' }}>{profileStats.projectsLaunched}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Projects</span>
                  </div>
                  <div style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800 }}>{profileStats.backed}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Backed</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button className="btn-cancel" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => { setProfileNameInput(user); generateCaptcha(); setIsEditingProfile(true); }}>Edit Profile</button>
                  <button className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--accent-danger)', color: 'white', justifyContent: 'center' }} onClick={handleLogout}>Log Out</button>
                </div>
              </div>
            ) : (
              <div className="profile-settings widget-card" style={{ padding: '20px' }}>
                <h3 className="widget-title" style={{ marginBottom: '16px' }}>
                  {user === 'Guest' ? 'Set Identity Dashboard' : 'Update Profile Identity'}
                </h3>
                <div className="form-group">
                  <label>Display Name / Username</label>
                  <input type="text" maxLength={32} className="standard-input" placeholder="e.g. SiphoM" value={profileNameInput} onChange={(e) => setProfileNameInput(e.target.value)} />
                </div>

                <div className="fixer-checkbox-group" onClick={() => setIsFixer(!isFixer)} style={{ cursor: 'pointer', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
                  <input type="checkbox" checked={isFixer} onChange={() => {}} />
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)' }}>Register as Local Fixer</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Allowing you to claim repair gigs and apply for service gigs.
                    </span>
                  </div>
                </div>

                <div className="captcha-box" style={{ marginTop: '20px' }}>
                  <label>Human Check: What is {captchaNum1} + {captchaNum2}?</label>
                  <input type="number" className="standard-input" placeholder="Answer" value={captchaAnswerInput} onChange={(e) => setCaptchaAnswerInput(e.target.value)} style={{ marginTop: '8px' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  {user !== 'Guest' && (<button className="btn-cancel" style={{ flex: 1 }} onClick={() => setIsEditingProfile(false)}>Cancel</button>)}
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSaveProfile}>Save Identity</button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Desktop Sidebar */}
      <aside className="app-sidebar hidden-mobile">
        {activeView === 'home' && isFixer && (
          <div className="widget-card" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
            <h3 className="widget-title" style={{ color: 'var(--accent-success)' }}>Fixer Wallet Dashboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="stat-row" style={{ borderBottom: 'none', padding: '4px 0' }}>
                <span>Simulated Earnings:</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--accent-success)' }}>R{earnings}</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Earn by claiming civic repairs, applying for gigs, or completing project milestones.
              </p>
            </div>
          </div>
        )}

        <div className="widget-card">
          <h3 className="widget-title">Active Categories</h3>
          <div className="trending-list">
            {trendingTags.length > 0 ? (
              trendingTags.map(trend => (
                <div key={trend.tag} className="trending-item" onClick={() => handleTrendClick(trend.tag)}>
                  <span className="trend-tag" style={{ textTransform: 'capitalize' }}>{trend.tag.replace('_', ' ')}</span>
                  <span className="trend-count">{trend.count} reports</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No reports yet.</p>
            )}
          </div>
        </div>
      </aside>

      {/* Viral Share Modal */}
      {viralSharePost && (
        <ViralCard post={viralSharePost} onClose={() => setViralSharePost(null)} />
      )}

      {/* Toast Notification */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
}
