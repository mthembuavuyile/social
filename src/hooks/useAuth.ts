import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState<{ uid: string; displayName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt anonymous sign-in immediately
    signInAnonymously(auth).catch((err) => {
      console.error("Auth Error:", err);
      setError("Failed to authenticate.");
    });
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const savedName = localStorage.getItem('ubuntuUserName') || 'Citizen';
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName || savedName
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserName = async (name: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
      localStorage.setItem('ubuntuUserName', name);
      setUser(prev => prev ? { ...prev, displayName: name } : null);
    }
  };

  return { user, loading, error, updateUserName };
}
