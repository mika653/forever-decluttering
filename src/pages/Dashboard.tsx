import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { Store, Item } from '../types';
import ItemCard from '../components/ItemCard';
import { Plus, Settings, Copy, Check, ExternalLink, Pencil } from 'lucide-react';
import LoadingAnimation from '../components/LoadingAnimation';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all');

  // Fetch store
  useEffect(() => {
    const fetchStore = async () => {
      const q = query(collection(db, 'stores'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        navigate('/dashboard/store-setup');
        return;
      }
      setStore(snapshot.docs[0].data() as Store);
    };
    fetchStore();
  }, [user.uid, navigate]);

  // Fetch items
  useEffect(() => {
    if (!store) return;

    const fetchItems = async () => {
      try {
        const q = query(
          collection(db, 'items'),
          where('storeSlug', '==', store.slug)
        );
        const snapshot = await getDocs(q);
        const itemsData = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Item))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setItems(itemsData);
      } catch (err) {
        console.error('Error loading items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [store?.slug]);

  const handleMarkSold = async (itemId: string) => {
    try {
      await updateDoc(doc(db, 'items', itemId), { status: 'sold' });
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, status: 'sold' } : i));
    } catch (err) {
      console.error('Mark sold error:', err);
      alert('Failed to update. Please try again.');
    }
  };

  const handleMarkAvailable = async (itemId: string) => {
    try {
      await updateDoc(doc(db, 'items', itemId), { status: 'available' });
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, status: 'available' } : i));
    } catch (err) {
      console.error('Relist error:', err);
      alert('Failed to update. Please try again.');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'items', itemId));
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const copyLink = async () => {
    if (!store) return;
    const url = `${window.location.origin}/${store.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredItems =
    filter === 'all' ? items : items.filter((item) => item.status === filter);

  if (loading && !store) {
    return <LoadingAnimation />;
  }

  if (!store) return null;

  const availableCount = items.filter((i) => i.status === 'available').length;
  const soldCount = items.filter((i) => i.status === 'sold').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display leading-none tracking-tighter">Dashboard</h1>
          <p className="mono text-sm text-gray-500 mt-1">
            {availableCount} active &middot; {soldCount} sold
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-2 sm:px-4 py-2 border-[3px] border-black brutal-shadow-small bg-white hover:bg-neon-green/20 transition-colors mono text-xs font-bold uppercase"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : `/${store.slug}`}</span>
          </button>

          {/* View Store */}
          <button
            onClick={() => navigate(`/${store.slug}`)}
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 border-[3px] border-black brutal-shadow-small bg-white hover:bg-gray-100 transition-colors mono text-xs font-bold uppercase"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Store</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/dashboard/store-setup')}
            className="p-2 border-[3px] border-black brutal-shadow-small bg-white hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Add Item - hidden on mobile since FAB exists */}
          <button
            onClick={() => navigate('/dashboard/add')}
            className="hidden sm:flex items-center gap-2 px-5 py-2 brutal-btn brutal-btn-pink font-display text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['all', 'available', 'sold'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-bold uppercase border-[3px] border-black brutal-shadow-small transition-colors whitespace-nowrap ${
              filter === f ? 'bg-neon-pink' : 'bg-white hover:bg-gray-100'
            }`}
          >
            {f} {f === 'all' ? `(${items.length})` : f === 'available' ? `(${availableCount})` : `(${soldCount})`}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id}>
            <ItemCard
              item={item}
              storeSlug={store.slug}
              showStatus
              onMarkSold={() => handleMarkSold(item.id)}
              onMarkAvailable={() => handleMarkAvailable(item.id)}
              onEdit={() => navigate(`/dashboard/edit/${item.id}`)}
              onDelete={() => handleDelete(item.id)}
            />
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="border-[3px] border-dashed border-black p-16 text-center">
          <h2 className="text-2xl font-display text-gray-400 mb-2">No items yet</h2>
          <p className="mono text-sm text-gray-400 mb-4">Start by adding your first item.</p>
          <button
            onClick={() => navigate('/dashboard/add')}
            className="inline-flex items-center gap-2 px-6 py-3 brutal-btn brutal-btn-pink font-display text-base"
          >
            <Plus className="w-5 h-5" />
            Add Your First Item
          </button>
        </div>
      )}

      {/* FAB for mobile */}
      <button
        onClick={() => navigate('/dashboard/add')}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-neon-pink border-[3px] border-black brutal-shadow flex items-center justify-center z-50 hover:scale-105 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
