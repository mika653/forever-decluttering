import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { Store, Item } from '../types';
import StoreHeader from '../components/StoreHeader';
import ItemCard from '../components/ItemCard';
import { Package, Search } from 'lucide-react';
import { motion } from 'motion/react';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch store by slug
  useEffect(() => {
    if (!slug) return;

    const fetchStore = async () => {
      const q = query(collection(db, 'stores'), where('slug', '==', slug));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setStore(snapshot.docs[0].data() as Store);
    };

    fetchStore();
  }, [slug]);

  // Listen to items for this store
  useEffect(() => {
    if (!slug) return;

    const q = query(
      collection(db, 'items'),
      where('storeSlug', '==', slug),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slug]);

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-[3px] border-black border-t-neon-pink"
        />
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
            <ItemCard item={item} storeSlug={slug!} />
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
    </div>
  );
}
