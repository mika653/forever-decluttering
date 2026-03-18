import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { Store, Item, Report } from '../types';
import {
  Shield,
  Trash2,
  Ban,
  Eye,
  Search,
  Package,
  ShoppingBag,
  CheckCircle,
  Store as StoreIcon,
  BadgeCheck,
  Flag,
  AlertTriangle,
} from 'lucide-react';
import LoadingAnimation from '../components/LoadingAnimation';

type Tab = 'listings' | 'stores' | 'reports';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('listings');
  const [items, setItems] = useState<Item[]>([]);
  const [stores, setStores] = useState<(Store & { docId: string })[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold'>('all');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [itemsSnap, storesSnap, reportsSnap] = await Promise.all([
          getDocs(collection(db, 'items')),
          getDocs(collection(db, 'stores')),
          getDocs(collection(db, 'reports')),
        ]);

        const itemsData = itemsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Item))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        const storesData = storesSnap.docs
          .map((d) => ({ docId: d.id, ...d.data() } as Store & { docId: string }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        const reportsData = reportsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Report))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        setItems(itemsData);
        setStores(storesData);
        setReports(reportsData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'items', itemId));
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item.');
    }
  };

  const handleToggleSuspend = async (store: Store & { docId: string }) => {
    const newSuspended = !store.suspended;
    const action = newSuspended ? 'suspend' : 'unsuspend';
    if (!confirm(`Are you sure you want to ${action} "${store.displayName}"?`)) return;
    try {
      await updateDoc(doc(db, 'stores', store.docId), { suspended: newSuspended });
      setStores((prev) =>
        prev.map((s) =>
          s.docId === store.docId ? { ...s, suspended: newSuspended } : s
        )
      );
    } catch (err) {
      console.error('Error updating store:', err);
      alert(`Failed to ${action} store.`);
    }
  };

  const handleToggleVerified = async (store: Store & { docId: string }) => {
    const newVerified = !store.verified;
    try {
      await updateDoc(doc(db, 'stores', store.docId), { verified: newVerified });
      setStores((prev) =>
        prev.map((s) =>
          s.docId === store.docId ? { ...s, verified: newVerified } : s
        )
      );
    } catch (err) {
      console.error('Error updating store:', err);
      alert('Failed to update verification status.');
    }
  };

  const handleDismissReport = async (reportId: string) => {
    if (!confirm('Dismiss this report?')) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error('Error dismissing report:', err);
      alert('Failed to dismiss report.');
    }
  };

  const getStoreDisplayName = (slug: string) => {
    const store = stores.find((s) => s.slug === slug);
    return store?.displayName || slug;
  };

  const totalItems = items.length;
  const availableItems = items.filter((i) => i.status === 'available').length;
  const soldItems = items.filter((i) => i.status === 'sold').length;

  const filteredItems = items
    .filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery) {
        return item.title.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });

  const formatDate = (timestamp: { seconds: number } | undefined) => {
    if (!timestamp) return '—';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) return <LoadingAnimation />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-neon-pink p-2 border-[3px] border-black brutal-shadow-small">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-display leading-none tracking-tighter">
            Admin Panel
          </h1>
          <p className="mono text-sm text-gray-500 mt-1">Platform management</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Stores', value: stores.length, icon: StoreIcon, color: 'bg-blue-100' },
          { label: 'Total Items', value: totalItems, icon: Package, color: 'bg-purple-100' },
          { label: 'Available', value: availableItems, icon: ShoppingBag, color: 'bg-green-100' },
          { label: 'Sold', value: soldItems, icon: CheckCircle, color: 'bg-orange-100' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border-[3px] border-black brutal-shadow-small p-4 bg-white"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1 ${stat.color} border-[2px] border-black`}>
                <stat.icon className="w-3.5 h-3.5" />
              </div>
              <span className="mono text-xs font-bold uppercase text-gray-500">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-display tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {([
          { key: 'listings' as const, label: `Listings (${totalItems})` },
          { key: 'stores' as const, label: `Stores (${stores.length})` },
          { key: 'reports' as const, label: `Reports (${reports.length})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs font-bold uppercase border-[3px] border-black brutal-shadow-small transition-colors mono whitespace-nowrap ${
              tab === key ? 'bg-neon-pink' : 'bg-white hover:bg-gray-100'
            } ${key === 'reports' && reports.length > 0 && tab !== 'reports' ? 'border-red-500' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Listings Tab */}
      {tab === 'listings' && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items by title..."
                className="w-full border-[3px] border-black p-2 pl-10 mono text-sm brutal-shadow-small focus:outline-none focus:border-neon-pink"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'available', 'sold'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-2 text-xs font-bold uppercase border-[3px] border-black brutal-shadow-small transition-colors mono whitespace-nowrap ${
                    statusFilter === f ? 'bg-neon-pink' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="border-[3px] border-black brutal-shadow bg-white overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[3px] border-black bg-gray-50">
                  <th className="p-3 mono text-xs font-bold uppercase">Item</th>
                  <th className="p-3 mono text-xs font-bold uppercase hidden sm:table-cell">Price</th>
                  <th className="p-3 mono text-xs font-bold uppercase hidden md:table-cell">Store</th>
                  <th className="p-3 mono text-xs font-bold uppercase hidden lg:table-cell">Seller</th>
                  <th className="p-3 mono text-xs font-bold uppercase">Status</th>
                  <th className="p-3 mono text-xs font-bold uppercase hidden md:table-cell">Date</th>
                  <th className="p-3 mono text-xs font-bold uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-10 h-10 object-cover border-[2px] border-black"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 border-[2px] border-black flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        <span className="mono text-sm font-bold truncate max-w-[150px]">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 mono text-sm hidden sm:table-cell">
                      &#8369;{item.price.toLocaleString()}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="mono text-xs bg-gray-100 border-[2px] border-black px-2 py-0.5">
                        /{item.storeSlug}
                      </span>
                    </td>
                    <td className="p-3 mono text-xs text-gray-500 hidden lg:table-cell">
                      {getStoreDisplayName(item.storeSlug)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`mono text-xs font-bold uppercase px-2 py-0.5 border-[2px] border-black ${
                          item.status === 'available' ? 'bg-green-200' : 'bg-orange-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 mono text-xs text-gray-500 hidden md:table-cell">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 border-[2px] border-black bg-white hover:bg-red-500 hover:text-white transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="p-12 text-center">
                <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="mono text-sm text-gray-400">No items found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stores Tab */}
      {tab === 'stores' && (
        <div className="space-y-3">
          {stores.map((store) => {
            const storeItemCount = items.filter((i) => i.storeSlug === store.slug).length;
            return (
              <div
                key={store.docId}
                className={`border-[3px] border-black brutal-shadow-small p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  store.suspended ? 'opacity-60' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-lg tracking-tighter">
                      {store.displayName}
                    </h3>
                    <span className="mono text-xs bg-gray-100 border-[2px] border-black px-2 py-0.5">
                      /{store.slug}
                    </span>
                    {store.verified && (
                      <span className="mono text-xs font-bold uppercase px-2 py-0.5 border-[2px] border-black bg-neon-green flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {store.suspended && (
                      <span className="mono text-xs font-bold uppercase px-2 py-0.5 border-[2px] border-black bg-red-400 text-white">
                        Suspended
                      </span>
                    )}
                  </div>
                  <div className="mono text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                    <span>Owner: {store.ownerId.slice(0, 8)}...</span>
                    <span>{storeItemCount} items</span>
                    <span>Created {formatDate(store.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border-[2px] border-black bg-white hover:bg-gray-100 transition-colors"
                    title="View store"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleToggleVerified(store)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black mono text-xs font-bold uppercase transition-colors ${
                      store.verified
                        ? 'bg-neon-green hover:bg-green-300'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title={store.verified ? 'Remove verification' : 'Verify store'}
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {store.verified ? 'Verified' : 'Verify'}
                  </button>
                  <button
                    onClick={() => handleToggleSuspend(store)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black mono text-xs font-bold uppercase transition-colors ${
                      store.suspended
                        ? 'bg-green-200 hover:bg-green-300'
                        : 'bg-red-100 hover:bg-red-300'
                    }`}
                    title={store.suspended ? 'Unsuspend store' : 'Suspend store'}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {store.suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                </div>
              </div>
            );
          })}

          {stores.length === 0 && (
            <div className="border-[3px] border-dashed border-black p-12 text-center">
              <StoreIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="mono text-sm text-gray-400">No stores found</p>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="border-[3px] border-dashed border-black p-12 text-center">
              <Flag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="mono text-sm text-gray-400">No reports yet</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="border-[3px] border-black brutal-shadow-small p-4 bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className={`mono text-xs font-bold uppercase px-2 py-0.5 border-[2px] border-black ${
                        report.type === 'store' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {report.type}
                      </span>
                      <span className="font-display text-sm truncate">
                        {report.targetLabel}
                      </span>
                    </div>
                    <div className="border-l-[3px] border-red-300 pl-3 mb-2">
                      <p className="mono text-sm font-bold">{report.reason}</p>
                      {report.details && (
                        <p className="mono text-sm text-gray-500 mt-1">{report.details}</p>
                      )}
                    </div>
                    <div className="mono text-xs text-gray-400 flex flex-wrap gap-3">
                      <span>{formatDate(report.createdAt)}</span>
                      {report.reporterContact && (
                        <span>Contact: {report.reporterContact}</span>
                      )}
                      <span>ID: {report.targetId.slice(0, 12)}...</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {report.type === 'store' && (
                      <a
                        href={`/${report.targetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border-[2px] border-black bg-white hover:bg-gray-100 transition-colors"
                        title="View store"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDismissReport(report.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black mono text-xs font-bold uppercase bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
