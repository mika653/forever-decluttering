import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import {
  Camera,
  Link as LinkIcon,
  MessageCircle,
  Package,
  ArrowRight,
  ShoppingBag,
  Clock,
  DollarSign,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Store, Item } from '../types';

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
  const [totalItems, setTotalItems] = useState(0);
  const [soldItems, setSoldItems] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const storeSnapshot = await getDocs(collection(db, 'stores'));
      setStores(
        storeSnapshot.docs
          .map((d) => d.data() as Store)
          .filter((s) => !s.suspended)
      );

      const itemSnapshot = await getDocs(collection(db, 'items'));
      const items = itemSnapshot.docs.map((d) => d.data() as Item);
      setTotalItems(items.length);
      setSoldItems(items.filter((i) => i.status === 'sold').length);
    };
    fetchData();
  }, []);

  const COLORS = ['#FF3D78', '#00D4AA', '#7B68B0', '#FF6B9D', '#0F0F23', '#E0218A', '#1DB954', '#FF9F43'];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.5 },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-16">

      {/* ============ HERO ============ */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 sm:mb-24"
      >
        <div className="inline-block bg-neon-pink border-[3px] border-black p-3 brutal-shadow mb-6">
          <Package className="w-10 h-10" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display leading-none tracking-tighter mb-4">
          That Stuff Isn't Going
          <br />
          <span className="text-neon-pink" style={{ WebkitTextStroke: '2px black' }}>
            To Sell Itself.
          </span>
        </h1>

        <p className="mono text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-4">
          The bags in the corner. The clothes that don't fit. The gadget you used once.
        </p>
        <p className="mono text-base sm:text-lg text-black font-bold max-w-xl mx-auto mb-8">
          Turn your clutter into cash in 60 seconds. No app downloads. No marketplace drama.
        </p>

        <button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-display text-xl hover:bg-neon-pink hover:text-black transition-all brutal-shadow border-[3px] border-black"
        >
          {user ? 'Go to Dashboard' : 'Get Your Free Link'}
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="mono text-xs text-gray-400 mt-3">Takes 30 seconds. No credit card. No fees. Ever.</p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-8"
        >
          <ChevronDown className="w-6 h-6 mx-auto text-gray-300 animate-bounce" />
        </motion.div>
      </motion.div>

      {/* ============ PAIN POINTS (moved up) ============ */}
      <motion.div {...fadeInUp} className="border-[3px] border-black p-6 sm:p-8 bg-black text-white brutal-shadow mb-16 sm:mb-20">
        <h2 className="text-2xl sm:text-3xl font-display mb-2 text-neon-pink">
          Sound Familiar?
        </h2>
        <p className="mono text-sm text-gray-400 mb-6">Every Facebook Marketplace seller knows the pain.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { problem: '"Is this still available?" (for the 100th time)', solution: 'If it\'s on your page, it\'s available. Period.' },
            { problem: 'Your post gets buried after one day', solution: 'Your link is always live. Share it once, sell forever.' },
            { problem: 'Competing with 100 other sellers', solution: 'It\'s YOUR page. Your items. No competition.' },
            { problem: '"Can you do ₱50?" — negotiation fatigue', solution: 'Price is the price. They message if they want it.' },
          ].map(({ problem, solution }) => (
            <div key={problem} className="border-[3px] border-neon-pink/30 p-4">
              <p className="mono text-sm text-red-400 line-through mb-1">{problem}</p>
              <p className="mono text-sm text-neon-green font-bold">{solution}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ============ HOW IT WORKS ============ */}
      <div className="mb-16 sm:mb-20">
        <motion.h2 {...fadeInUp} className="text-3xl sm:text-4xl font-display text-center mb-3 tracking-tighter">
          Stupid <span className="text-neon-pink">Simple.</span>
        </motion.h2>
        <motion.p {...fadeInUp} className="mono text-sm text-gray-500 text-center mb-8">
          Three steps. Under a minute. Seriously.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Camera,
              step: '01',
              title: 'Snap & Post',
              description: 'Take a photo, type a price. That\'s it. Your item is live.',
              highlight: 'Under 10 seconds per item.',
            },
            {
              icon: LinkIcon,
              step: '02',
              title: 'Get Your Link',
              description: 'You get your own page — like foreverdecluttering.heymika.me/you.',
              highlight: 'Share it on stories, groups, anywhere.',
            },
            {
              icon: MessageCircle,
              step: '03',
              title: 'They Message You',
              description: 'Buyers tap "I want this" and reach you directly on WhatsApp or Viber.',
              highlight: 'No middleman. No small talk.',
            },
          ].map(({ icon: Icon, step, title, description, highlight }, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="border-[3px] border-black p-6 bg-white brutal-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-neon-pink border-[3px] border-black p-2 brutal-shadow-small">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="mono text-xs font-bold text-gray-400">STEP {step}</span>
              </div>
              <h3 className="text-xl font-display mb-2">{title}</h3>
              <p className="mono text-sm text-gray-500 mb-2">{description}</p>
              <p className="mono text-xs text-neon-pink font-bold">{highlight}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ============ STORE PREVIEW MOCKUP ============ */}
      <motion.div {...fadeInUp} className="mb-16 sm:mb-20">
        <h2 className="text-3xl sm:text-4xl font-display text-center mb-3 tracking-tighter">
          This Is <span className="text-neon-pink">Your Store.</span>
        </h2>
        <p className="mono text-sm text-gray-500 text-center mb-8">
          Every declutterer gets their own page. Here's what it looks like.
        </p>

        {/* Fake browser chrome */}
        <div className="border-[3px] border-black brutal-shadow max-w-3xl mx-auto">
          {/* Browser bar */}
          <div className="bg-gray-100 border-b-[3px] border-black px-4 py-2.5 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500" />
            </div>
            <div className="flex-1 bg-white border-[2px] border-black px-3 py-1 mono text-xs text-gray-500 truncate">
              foreverdecluttering.heymika.me/you
            </div>
          </div>

          {/* Fake store content */}
          <div className="bg-white p-4 sm:p-6">
            {/* Store header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 border-[3px] border-black bg-neon-pink brutal-shadow-small flex items-center justify-center font-display text-lg">
                Y
              </div>
              <div>
                <div className="font-display text-lg leading-none">Your Name</div>
                <div className="mono text-xs text-gray-400">3 items</div>
              </div>
            </div>

            {/* Fake item grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { color: '#FFE4E1', emoji: '👜', price: '₱350' },
                { color: '#E8F5E9', emoji: '📱', price: '₱2,500' },
                { color: '#E3F2FD', emoji: '👟', price: '₱800' },
              ].map(({ color, emoji, price }, i) => (
                <div key={i} className="border-[2px] border-black">
                  <div
                    className="aspect-square flex items-center justify-center text-3xl sm:text-4xl"
                    style={{ backgroundColor: color }}
                  >
                    {emoji}
                  </div>
                  <div className="p-2 bg-white border-t-[2px] border-black">
                    <div className="font-display text-xs sm:text-sm">{price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mono text-xs text-gray-400 text-center mt-4">
          Your items. Your prices. Your link. That's it.
        </p>
      </motion.div>

      {/* ============ SOCIAL PROOF ============ */}
      <motion.div {...fadeInUp} className="mb-16 sm:mb-20">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {[
            { icon: ShoppingBag, value: stores.length, label: 'Declutterers' },
            { icon: Package, value: totalItems, label: 'Items Listed' },
            { icon: DollarSign, value: soldItems, label: 'Items Sold' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="border-[3px] border-black p-3 sm:p-6 bg-white brutal-shadow text-center">
              <Icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-neon-pink" />
              <div className="text-2xl sm:text-4xl font-display">{value}</div>
              <div className="mono text-[10px] sm:text-xs font-bold text-gray-400 uppercase">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ============ SCROLLING DECLUTTERERS ============ */}
      {stores.length > 0 && (
        <motion.div {...fadeInUp} className="mb-16 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl font-display text-center mb-6 tracking-tighter">
            Who's <span className="text-neon-pink">Decluttering</span> Now?
          </h2>
          <div className="overflow-hidden border-y-[3px] border-black py-4 bg-white">
            <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused]">
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
        </motion.div>
      )}

      {/* ============ FAQ / OBJECTION BUSTERS ============ */}
      <motion.div {...fadeInUp} className="mb-16 sm:mb-20">
        <h2 className="text-3xl sm:text-4xl font-display text-center mb-3 tracking-tighter">
          But <span className="text-neon-pink">Wait...</span>
        </h2>
        <p className="mono text-sm text-gray-500 text-center mb-8">
          We know what you're thinking.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            {
              icon: DollarSign,
              q: 'Is it really free?',
              a: 'Yes. Free forever. No hidden fees, no premium tier, no "pay to unlock." We mean it.',
            },
            {
              icon: Clock,
              q: 'How long does it take to set up?',
              a: '30 seconds. Sign in with Google, pick your link name, done. Add your first item in 10 more seconds.',
            },
            {
              icon: ShoppingBag,
              q: 'Do buyers need to sign up?',
              a: 'Nope. They browse your page, tap "I want this," and message you on WhatsApp or Viber. Zero friction.',
            },
            {
              icon: Zap,
              q: 'What if my item sells?',
              a: 'Mark it as sold with one tap. It disappears from your page. The buyer already messaged you — done.',
            },
          ].map(({ icon: Icon, q, a }) => (
            <div key={q} className="border-[3px] border-black p-5 bg-white brutal-shadow-small">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-neon-pink flex-shrink-0" />
                <h3 className="font-display text-base">{q}</h3>
              </div>
              <p className="mono text-sm text-gray-500">{a}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ============ FINAL CTA ============ */}
      <motion.div {...fadeInUp} className="text-center mb-8">
        <div className="border-[3px] border-black p-8 sm:p-12 bg-neon-pink brutal-shadow max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display mb-3 tracking-tighter">
            Your Clutter Has Value.
          </h2>
          <p className="mono text-sm sm:text-base mb-6">
            Stop letting it collect dust. Get your free link and start selling in under a minute.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white font-display text-xl sm:text-2xl border-[3px] border-black hover:bg-white hover:text-black transition-all"
          >
            {user ? 'Go to Dashboard' : 'Get Your Free Link'}
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="mono text-xs mt-4 opacity-70">
            Free forever. Set up in 30 seconds. No downloads.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
