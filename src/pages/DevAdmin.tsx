import React, { useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { dbFirestore } from '../firebase';
import { AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const DevAdmin: React.FC = () => {
  const [isWiping, setIsWiping] = useState(false);

  const wipeAllPosts = async () => {
    if (!window.confirm("WARNING: Are you absolutely sure you want to delete ALL posts? This cannot be undone.")) {
      return;
    }

    setIsWiping(true);
    const toastId = toast.loading('Wiping database...');

    try {
      const postsSnapshot = await getDocs(collection(dbFirestore, 'posts'));
      
      if (postsSnapshot.empty) {
        toast.success('Database is already empty.', { id: toastId });
        setIsWiping(false);
        return;
      }

      const deletePromises = postsSnapshot.docs.map(document => 
        deleteDoc(doc(dbFirestore, 'posts', document.id))
      );
      
      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${postsSnapshot.docs.length} posts!`, { id: toastId });
    } catch (error) {
      console.error("Error wiping database:", error);
      toast.error("Failed to wipe database. Check console.", { id: toastId });
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--accent-danger)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-danger)', marginBottom: '20px' }}>
        <AlertTriangle size={32} />
        <h2 style={{ margin: 0 }}>Developer Admin Panel</h2>
      </div>
      
      <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
        This page is strictly for development purposes. Use the button below to completely wipe the <strong>posts</strong> collection in Firestore. Remember to remove this page before deploying to production.
      </p>

      <button
        onClick={wipeAllPosts}
        disabled={isWiping}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: 'var(--accent-danger)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: isWiping ? 'not-allowed' : 'pointer',
          opacity: isWiping ? 0.7 : 1,
          width: '100%',
          justifyContent: 'center',
          fontSize: '1rem'
        }}
      >
        <Trash2 size={20} />
        {isWiping ? 'Wiping Database...' : 'DANGER: Wipe All Posts'}
      </button>
    </div>
  );
};
