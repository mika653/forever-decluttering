import { Store } from '../types';

interface StoreHeaderProps {
  store: Store;
  itemCount?: number;
}

export default function StoreHeader({ store, itemCount }: StoreHeaderProps) {
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
          <h1 className="text-2xl sm:text-3xl font-display leading-none tracking-tighter">
            {store.displayName}
          </h1>
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
      </div>
    </div>
  );
}
