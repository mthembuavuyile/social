import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
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
          
          // Civic fields
          category: data.category,
          location: data.location,
          province: data.province,
          city: data.city,
          status: data.status || 'active',
          latitude: data.latitude,
          longitude: data.longitude,
        });
      });
      setPosts(postsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createPost = async (postData: Partial<Post>) => {
    const postsRef = collection(dbFirestore, 'posts');
    await addDoc(postsRef, {
      ...postData,
      timestamp: serverTimestamp(),
    });
  };

  const updatePostStatus = async (postId: string, status: 'active' | 'in_progress' | 'resolved') => {
    const postRef = doc(dbFirestore, 'posts', postId);
    await updateDoc(postRef, { status });
  };
  
  const deletePost = async (postId: string) => {
    const postRef = doc(dbFirestore, 'posts', postId);
    await deleteDoc(postRef);
  };

  return { posts, loading, createPost, updatePostStatus, deletePost };
}
