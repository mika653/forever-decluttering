import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Store, Item } from '../types';
import StoreHeader from '../components/StoreHeader';
import ItemCard from '../components/ItemCard';
import { Package, Search, Ban, Flag, ShoppingBag, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoadingAnimation from '../components/LoadingAnimation';
import ReportModal from '../components/ReportModal';
import CartSheet from '../components/CartSheet';
import { useCart } from '../context/CartContext';

interface StorePageProps {
  defaultSlug?: string;
}

export default function StorePage({ defaultSlug }: StorePageProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = paramSlug || defaultSlug;
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const cart = useCart();

  const handleToggleBag = useCallback((item: Item) => {
    if (cart.isInCart(item.id)) {
      cart.removeItem(item.id);
      setToast({ message: `Removed "${item.title}"`, key: Date.now() });
    } else {
      cart.addItem(item);
      setToast({ message: `Added "${item.title}" to bag!`, key: Date.now() });
    }
  }, [cart]);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        // Fetch store
        const storeQuery = query(collection(db, 'stores'), where('slug', '==', slug));
        const storeSnapshot = await getDocs(storeQuery);

        if (storeSnapshot.empty) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setStore(storeSnapshot.docs[0].data() as Store);

        // Fetch items (simple query — no composite index needed)
        const itemsQuery = query(
          collection(db, 'items'),
          where('storeSlug', '==', slug),
          where('status', '==', 'available')
        );
        const itemsSnapshot = await getDocs(itemsQuery);
        const itemsData = itemsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Item))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        setItems(itemsData);
        // Set store in cart context for the WhatsApp message
        cart.setStore(storeSnapshot.docs[0].data() as Store);
      } catch (err) {
        console.error('Error loading store:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="border-[3px] border-black p-12 bg-white brutal-shadow">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-4xl font-display mb-2">Something Went Wrong</h1>
          <p className="mono text-sm text-gray-500 mb-4">
            We couldn't load this store. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border-[3px] border-black bg-neon-pink font-display brutal-shadow-small hover:translate-y-[-2px] transition-transform"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="border-[3px] border-black p-12 bg-white brutal-shadow">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-4xl font-display mb-2">Store Not Found</h1>
          <p className="mono text-sm text-gray-500">
            No store exists at this link. Double-check the URL.
          </p>
        </div>
      </div>
    );
  }

  if (!store) return null;

  if (store.suspended) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="border-[3px] border-black p-12 bg-white brutal-shadow">
          <Ban className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-4xl font-display mb-2">Store Suspended</h1>
          <p className="mono text-sm text-gray-500">
            This store has been suspended and is not currently available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <StoreHeader store={store} itemCount={items.length} />

      {/* Search */}
      {items.length > 3 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            className="brutal-input pl-10 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id}>
            <ItemCard
              item={item}
              storeSlug={slug!}
              onAddToBag={() => handleToggleBag(item)}
              isInBag={cart.isInCart(item.id)}
            />
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="border-[3px] border-dashed border-black p-16 text-center mt-4">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h2 className="text-2xl font-display text-gray-400 mb-1">
            {searchQuery ? 'No matches' : 'Nothing here yet'}
          </h2>
          <p className="mono text-sm text-gray-400">
            {searchQuery ? 'Try a different search.' : 'Check back soon!'}
          </p>
        </div>
      )}

      {/* Report button */}
      <div className="mt-12 text-center">
        <button
          onClick={() => setShowReport(true)}
          className="inline-flex items-center gap-1.5 mono text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <Flag className="w-3 h-3" />
          Report this store
        </button>
      </div>

      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        type="store"
        targetId={store.slug}
        targetLabel={store.displayName}
      />

      {/* Toast notification — bottom on mobile, top-right on desktop */}
      <AnimatePresence>
        {toast && (
          <>
            {/* Mobile toast */}
            <motion.div
              key={`mobile-${toast.key}`}
              initial={{ y: 80, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.9 }}
              onAnimationComplete={() => {
                setTimeout(() => setToast(null), 2000);
              }}
              className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-black text-white border-[3px] border-black brutal-shadow-small whitespace-nowrap"
            >
              <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
              <span className="mono text-sm font-bold">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-1 p-0.5 hover:bg-white/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>

            {/* Desktop toast */}
            <motion.div
              key={`desktop-${toast.key}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              onAnimationComplete={() => {
                setTimeout(() => setToast(null), 2000);
              }}
              className="hidden md:flex fixed top-20 right-6 z-50 items-center gap-3 px-5 py-3 bg-black text-white border-[3px] border-black brutal-shadow whitespace-nowrap"
            >
              <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
              <span className="mono text-sm font-bold">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 p-1 hover:bg-white/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating bag FAB */}
      <AnimatePresence>
        {cart.totalItems > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => cart.setShowCart(true)}
            className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-neon-pink border-[3px] border-black brutal-shadow font-display text-base z-40 hover:scale-105 transition-transform"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Bag ({cart.totalItems})</span>
            <span className="mono text-sm font-bold">₱{cart.totalPrice}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <CartSheet open={cart.showCart} onClose={() => cart.setShowCart(false)} />
    </div>
  );
}
