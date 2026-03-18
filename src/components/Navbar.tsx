import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { Package, LogIn, LogOut, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-[3px] border-black">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
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
          {user ? (
            <>
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
