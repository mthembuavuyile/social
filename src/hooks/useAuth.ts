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
        // Use Firebase Auth displayName as the single source of truth.
        // Falls back to 'Citizen' for new anonymous users.
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Citizen'
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
      // Sanitize: trim and enforce max length
      const sanitizedName = name.trim().slice(0, 50);
      if (!sanitizedName) return;

      await updateProfile(auth.currentUser, { displayName: sanitizedName });
      setUser(prev => prev ? { ...prev, displayName: sanitizedName } : null);
    }
  };

  return { user, loading, error, updateUserName };
}
