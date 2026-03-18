import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, getRedirectResult, User } from 'firebase/auth';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import StorePage from './pages/StorePage';
import ItemDetail from './pages/ItemDetail';
import Dashboard from './pages/Dashboard';
import AddItem from './pages/AddItem';
import StoreSetup from './pages/StoreSetup';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import LoadingAnimation from './components/LoadingAnimation';

// The default store slug shown at the root URL
const DEFAULT_STORE_SLUG = 'mika';

function AuthGuard({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AddItemWrapper({ user }: { user: User }) {
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlug = async () => {
      const q = query(collection(db, 'stores'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setStoreSlug(snapshot.docs[0].data().slug);
      }
      setLoading(false);
    };
    fetchSlug();
  }, [user.uid]);

  if (loading) return null;
  if (!storeSlug) return <Navigate to="/dashboard/store-setup" replace />;

  return <AddItem user={user} storeSlug={storeSlug} />;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle return from Google sign-in redirect
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          window.location.replace('/dashboard');
        }
      })
      .catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gallery-white">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-black font-sans flex flex-col">
        <Navbar user={user} />

        <main className="flex-1">
          <Routes>
            {/* Root shows the default store */}
            <Route path="/" element={<StorePage defaultSlug={DEFAULT_STORE_SLUG} />} />

            {/* Landing / get started page */}
            <Route path="/start" element={<Landing user={user} />} />

            {/* Dashboard routes (auth required) */}
            <Route
              path="/dashboard"
              element={
                <AuthGuard user={user}>
                  <Dashboard user={user!} />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/add"
              element={
                <AuthGuard user={user}>
                  <AddItemWrapper user={user!} />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/store-setup"
              element={
                <AuthGuard user={user}>
                  <StoreSetup user={user!} />
                </AuthGuard>
              }
            />

            {/* Public store routes */}
            <Route path="/:slug" element={<StorePage />} />
            <Route path="/:slug/:itemId" element={<ItemDetail />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function Footer() {
  return (
    <footer className="border-t-[3px] border-black mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="mono text-xs text-gray-400">
          Forever Decluttering
        </p>
        <a
          href="/start"
          className="mono text-sm font-bold uppercase text-neon-pink hover:text-black transition-colors border-b-2 border-neon-pink hover:border-black"
        >
          Want to declutter too? Get your own link &rarr;
        </a>
      </div>
    </footer>
  );
}
