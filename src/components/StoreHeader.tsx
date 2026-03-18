import { useState } from 'react';
import { Store } from '../types';
import { Share2, Check, BadgeCheck } from 'lucide-react';

interface StoreHeaderProps {
  store: Store;
  itemCount?: number;
}

export default function StoreHeader({ store, itemCount }: StoreHeaderProps) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/${store.slug}`;
    const shareData = {
      title: `${store.displayName} — Forever Decluttering`,
      text: `Check out ${store.displayName}'s store on Forever Decluttering!\n${url}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="border-[3px] border-black bg-white p-6 brutal-shadow mb-8">
      <div className="flex items-center gap-4">
        {store.photoURL ? (
          <img
            src={store.photoURL}
            alt={store.displayName}
            className="w-16 h-16 border-[3px] border-black brutal-shadow-small object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-16 h-16 border-[3px] border-black brutal-shadow-small bg-neon-pink flex items-center justify-center font-display text-2xl">
            {store.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display leading-none tracking-tighter">
              {store.displayName}
            </h1>
            {store.verified && (
              <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-neon-green flex-shrink-0" />
            )}
          </div>
          {store.bio && (
            <p className="mono text-sm text-gray-500 mt-1">{store.bio}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {store.paymentMethods && store.paymentMethods.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {store.paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="text-[10px] font-mono font-bold uppercase bg-black text-white px-1.5 py-0.5"
                  >
                    {method}
                  </span>
                ))}
              </div>
            )}
            {itemCount !== undefined && (
              <span className="text-[10px] font-mono font-bold uppercase text-gray-400">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 border-[3px] border-black brutal-shadow-small bg-white hover:bg-neon-pink transition-colors mono text-xs font-bold uppercase flex-shrink-0"
        >
          {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{shared ? 'Copied!' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}
