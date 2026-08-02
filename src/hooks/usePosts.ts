import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc, getDoc, getDocs, increment, limit } from 'firebase/firestore';
import { dbFirestore } from '../firebase';
import { Post, Comment } from '../types';

export const fetchComments = async (postId: string): Promise<Comment[]> => {
  const commentsRef = collection(dbFirestore, 'posts', postId, 'comments');
  const q = query(commentsRef, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  const commentsArray: Comment[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    commentsArray.push({
      id: docSnap.id,
      postId,
      content: data.content,
      author: data.author,
      authorUid: data.authorUid,
      timestamp: data.timestamp ? (data.timestamp.toMillis ? data.timestamp.toMillis() : data.timestamp) : Date.now(),
      parentId: data.parentId,
      replyCount: data.replyCount || 0,
    });
  });
  return commentsArray;
};

export const addComment = async (postId: string, text: string, user: { uid: string, displayName: string }, parentId?: string) => {
  const commentsRef = collection(dbFirestore, 'posts', postId, 'comments');
  const commentData: any = {
    postId,
    content: text,
    author: user.displayName,
    authorUid: user.uid,
    timestamp: serverTimestamp(),
  };
  
  if (parentId) {
    commentData.parentId = parentId;
  }
  
  await addDoc(commentsRef, commentData);
  
  const postRef = doc(dbFirestore, 'posts', postId);
  await updateDoc(postRef, {
    commentsCount: increment(1)
  });
  
  if (parentId) {
    const parentCommentRef = doc(dbFirestore, 'posts', postId, 'comments', parentId);
    await updateDoc(parentCommentRef, {
      replyCount: increment(1)
    });
  }
};

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = collection(dbFirestore, 'posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'), limit(50));
    
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
          commentsCount: data.commentsCount || 0,
          
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
      commentsCount: 0,
      timestamp: serverTimestamp(),
    });
  };

  const updatePostStatus = async (postId: string, status: 'active' | 'in_progress' | 'resolved') => {
    const postRef = doc(dbFirestore, 'posts', postId);
    await updateDoc(postRef, { status });
  };
  
  const deletePost = async (postId: string, currentUserUid: string) => {
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
