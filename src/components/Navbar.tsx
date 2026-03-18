import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Package, LogIn, LogOut, LayoutDashboard, Store, Users } from 'lucide-react';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();
  const [userSlug, setUserSlug] = useState<string | null>(null);

  // Fetch the signed-in user's store slug
  useEffect(() => {
    if (!user) {
      setUserSlug(null);
      return;
    }

    const fetchSlug = async () => {
      const q = query(collection(db, 'stores'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setUserSlug(snapshot.docs[0].data().slug);
      }
    };
    fetchSlug();
  }, [user?.uid]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/dashboard');
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        alert('Please allow popups for this site in your browser settings, then try again.');
      } else {
        console.error('Login error', err);
      }
    }
  };

  // Logo links to user's own store if signed in, otherwise root
  const logoTo = user && userSlug ? `/${userSlug}` : '/';

  return (
    <header className="sticky top-0 z-50 bg-white border-b-[3px] border-black">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to={logoTo}
          className="flex items-center gap-2 hover:skew-x-[-3deg] transition-transform"
        >
          <div className="bg-neon-pink p-1.5 border-[3px] border-black brutal-shadow-small">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-xl font-display tracking-tighter">
            Forever <span className="text-neon-pink">Decluttering</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Explore link */}
          <Link
            to="/explore"
            className="flex items-center gap-2 px-3 py-2 border-[3px] border-black brutal-shadow-small bg-white hover:bg-gray-100 transition-colors mono text-xs font-bold uppercase"
          >
            <Users className="w-3.5 h-3.5" />
            Explore
          </Link>

          {user ? (
            <>
              {/* My Store link */}
              {userSlug && (
                <button
                  onClick={() => navigate(`/${userSlug}`)}
                  className="flex items-center gap-2 px-3 py-2 border-[3px] border-black brutal-shadow-small bg-white hover:bg-gray-100 transition-colors mono text-xs font-bold uppercase"
                >
                  <Store className="w-3.5 h-3.5" />
                  My Store
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 brutal-btn brutal-btn-pink font-display text-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => signOut(auth)}
                className="p-2 border-[3px] border-black bg-white hover:bg-red-500 hover:text-white brutal-shadow-small transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 border-[3px] border-black brutal-shadow-small"
                  referrerPolicy="no-referrer"
                />
              )}
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-5 py-2 brutal-btn brutal-btn-pink font-display text-sm"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
