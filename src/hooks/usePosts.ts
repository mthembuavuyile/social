import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { dbFirestore } from '../firebase';
import { Post } from '../types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = collection(dbFirestore, 'posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsArray: Post[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        postsArray.push({
          id: docSnap.id,
          content: data.content || '',
          imageUrl: data.imageUrl,
          author: data.author || '',
          authorUid: data.authorUid || '',
          timestamp: data.timestamp ? (data.timestamp.toMillis ? data.timestamp.toMillis() : data.timestamp) : Date.now(),
          reactions: data.reactions || {},
          userReactions: data.userReactions || {},
          
          // Shared fields
          reportType: data.reportType || 'civic',
          category: data.category,
          location: data.location,
          province: data.province,
          city: data.city,
          status: data.status || 'active',
          latitude: data.latitude,
          longitude: data.longitude,
          socialUrl: data.socialUrl,

          // Crime-specific fields
          crimeUrgency: data.crimeUrgency,
          incidentTime: data.incidentTime,
          policeContacted: data.policeContacted,
          caseNumber: data.caseNumber,
          anonymous: data.anonymous,
        });
      });
      setPosts(postsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createPost = async (postData: Partial<Post>) => {
    const postsRef = collection(dbFirestore, 'posts');
    const cleanedData = Object.fromEntries(
      Object.entries(postData).filter(([_, v]) => v !== undefined)
    );
    await addDoc(postsRef, {
      ...cleanedData,
      timestamp: serverTimestamp(),
    });
  };

  const updatePostStatus = async (postId: string, status: 'active' | 'in_progress' | 'resolved') => {
    const postRef = doc(dbFirestore, 'posts', postId);
    await updateDoc(postRef, { status });
  };
  
  const deletePost = async (postId: string, currentUserUid: string) => {
    // Defense-in-depth: verify ownership client-side before attempting delete.
    // Firestore rules also enforce this, but this prevents unnecessary failed requests.
    const postRef = doc(dbFirestore, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) {
      throw new Error('Post not found.');
    }
    if (snap.data()?.authorUid !== currentUserUid) {
      throw new Error('You can only delete your own posts.');
    }
    await deleteDoc(postRef);
  };

  return { posts, loading, createPost, updatePostStatus, deletePost };
}
