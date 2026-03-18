import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { Camera, Link as LinkIcon, MessageCircle, Package, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Store } from '../types';

interface LandingProps {
  user: User | null;
}

export default function Landing({ user }: LandingProps) {
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    if (user) {
      navigate('/dashboard');
      return;
    }
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

  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const fetchStores = async () => {
      const snapshot = await getDocs(collection(db, 'stores'));
      setStores(
        snapshot.docs
          .map((d) => d.data() as Store)
          .filter((s) => !s.suspended)
      );
    };
    fetchStores();
  }, []);

  const COLORS = ['#FF3D78', '#00D4AA', '#7B68B0', '#FF6B9D', '#0F0F23', '#E0218A', '#1DB954', '#FF9F43'];

  // Note: This page is accessible at /start

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <div className="inline-block bg-neon-pink border-[3px] border-black p-3 brutal-shadow mb-6">
          <Package className="w-10 h-10" />
        </div>
        <h1 className="text-5xl md:text-7xl font-display leading-none tracking-tighter mb-4">
          Your Personal
          <br />
          <span className="text-neon-pink" style={{ WebkitTextStroke: '2px black' }}>
            Declutter Link
          </span>
        </h1>
        <p className="mono text-lg text-gray-600 max-w-xl mx-auto mb-8">
          Add a photo. Set a price. Share your link. No marketplace drama, no buried posts, no small talk.
        </p>
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-display text-xl hover:bg-neon-pink hover:text-black transition-all brutal-shadow border-[3px] border-black"
        >
          {user ? 'Go to Dashboard' : 'Get Your Link'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {[
          {
            icon: Camera,
            step: '01',
            title: 'Snap & Post',
            description: 'Add a photo, fill in the details, set your price. Done in under a minute.',
          },
          {
            icon: LinkIcon,
            step: '02',
            title: 'Share Your Link',
            description: 'Get your own link like forever-decluttering.app/you. Share it anywhere.',
          },
          {
            icon: MessageCircle,
            step: '03',
            title: 'Buyers Message You',
            description: 'Interested buyers tap "I want this" and message you directly on WhatsApp or Viber.',
          },
        ].map(({ icon: Icon, step, title, description }) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: parseInt(step) * 0.15 }}
            className="border-[3px] border-black p-6 bg-white brutal-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-neon-pink border-[3px] border-black p-2 brutal-shadow-small">
                <Icon className="w-5 h-5" />
              </div>
              <span className="mono text-xs font-bold text-gray-400">STEP {step}</span>
            </div>
            <h3 className="text-xl font-display mb-2">{title}</h3>
            <p className="mono text-sm text-gray-500">{description}</p>
          </motion.div>
        ))}
      </div>

      {/* Scrolling Declutterers */}
      {stores.length > 0 && (
        <div className="mb-20">
          <h2 className="text-3xl font-display text-center mb-6 tracking-tighter">
            Who's <span className="text-neon-pink">Decluttering</span> Now?
          </h2>
          <div className="overflow-hidden border-y-[3px] border-black py-4 bg-white">
            <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused]">
              {/* Double the list for seamless loop */}
              {[...stores, ...stores].map((store, i) => {
                const color = COLORS[i % COLORS.length];
                return (
                  <Link
                    key={`${store.slug}-${i}`}
                    to={`/${store.slug}`}
                    className="flex-shrink-0 px-5 py-2.5 border-[3px] border-black brutal-shadow-small hover:translate-y-[-2px] transition-transform no-underline"
                    style={{ backgroundColor: color }}
                  >
                    <span className="font-display text-sm text-white whitespace-nowrap" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.3)' }}>
                      /{store.slug}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Why not Facebook */}
      <div className="border-[3px] border-black p-8 bg-black text-white brutal-shadow mb-20">
        <h2 className="text-3xl font-display mb-6 text-neon-pink">
          Why not Facebook Marketplace?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { problem: '"Is this still available?"', solution: 'If it\'s on your page, it\'s available.' },
            { problem: 'Posts get buried after a day', solution: 'Your link is always live, always yours.' },
            { problem: 'Competing with 100 other sellers', solution: 'It\'s YOUR page. No competition.' },
            { problem: 'Negotiation fatigue', solution: 'Price is the price. They message if they want it.' },
          ].map(({ problem, solution }) => (
            <div key={problem} className="border-[3px] border-neon-pink/30 p-4">
              <p className="mono text-sm text-red-400 line-through mb-1">{problem}</p>
              <p className="mono text-sm text-neon-green font-bold">{solution}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-3 px-10 py-5 bg-neon-pink text-black font-display text-2xl border-[3px] border-black brutal-shadow hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_black] transition-all"
        >
          Start Decluttering
          <ArrowRight className="w-6 h-6" />
        </button>
        <p className="mono text-sm text-gray-400 mt-4">Free. No fees. Just declutter.</p>
      </div>
    </div>
  );
}
