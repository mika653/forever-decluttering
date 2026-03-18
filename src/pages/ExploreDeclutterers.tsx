import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Store } from '../types';
import LoadingAnimation from '../components/LoadingAnimation';
import { Users, ArrowRight, Package, BadgeCheck } from 'lucide-react';

interface StoreWithCount extends Store {
  itemCount: number;
}

export default function ExploreDeclutterers() {
  const [stores, setStores] = useState<StoreWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesSnapshot = await getDocs(collection(db, 'stores'));
        const storesData = storesSnapshot.docs.map((doc) => doc.data() as Store);

        // Fetch available item counts for each store
        const storesWithCounts = await Promise.all(
          storesData.map(async (store) => {
            const itemsQuery = query(
              collection(db, 'items'),
              where('storeSlug', '==', store.slug),
              where('status', '==', 'available')
            );
            const itemsSnapshot = await getDocs(itemsQuery);
            return { ...store, itemCount: itemsSnapshot.size };
          })
        );

        setStores(storesWithCounts);
      } catch (err) {
        console.error('Error fetching stores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="bg-neon-pink p-2 border-[3px] border-black brutal-shadow-small">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display tracking-tighter">
            Explore <span className="text-neon-pink">Declutterers</span>
          </h1>
        </div>
        <p className="mono text-sm text-gray-500 uppercase tracking-wide">
          Discover people decluttering their lives
        </p>
      </motion.div>

      {/* Empty state */}
      {stores.length === 0 ? (
        <motion.div
          className="text-center py-20 border-[3px] border-black brutal-shadow bg-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-display text-xl mb-2">No declutterers yet</p>
          <p className="mono text-sm text-gray-400">
            Be the first to start decluttering!
          </p>
          <Link
            to="/start"
            className="inline-block mt-6 px-6 py-3 brutal-btn brutal-btn-pink font-display text-sm"
          >
            Get Started
          </Link>
        </motion.div>
      ) : (
        /* Store grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store, index) => (
            <motion.div
              key={store.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                to={`/${store.slug}`}
                className="block border-[3px] border-black brutal-shadow bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-200 group"
              >
                {/* Card header */}
                <div className="p-5 flex items-center gap-4">
                  {store.photoURL ? (
                    <img
                      src={store.photoURL}
                      alt={store.displayName}
                      className="w-14 h-14 border-[3px] border-black object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 border-[3px] border-black bg-neon-pink flex items-center justify-center font-display text-xl flex-shrink-0">
                      {store.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-display text-lg tracking-tight truncate">
                        {store.displayName}
                      </h2>
                      {store.verified && (
                        <BadgeCheck className="w-4 h-4 text-neon-green flex-shrink-0" />
                      )}
                    </div>
                    <p className="mono text-xs text-gray-400 uppercase">
                      @{store.slug}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                {store.bio && (
                  <div className="px-5 pb-4">
                    <p className="mono text-sm text-gray-600 line-clamp-2">
                      {store.bio}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t-[3px] border-black px-5 py-3 flex items-center justify-between bg-gray-50">
                  <span className="mono text-xs font-bold uppercase flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    {store.itemCount} {store.itemCount === 1 ? 'item' : 'items'} available
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
