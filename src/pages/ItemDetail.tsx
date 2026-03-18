import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Item, Store } from '../types';
import { ArrowLeft, MessageCircle, ChevronLeft, ChevronRight, Copy, Check, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoadingAnimation from '../components/LoadingAnimation';

export default function ItemDetail() {
  const { slug, itemId } = useParams<{ slug: string; itemId: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  useEffect(() => {
    if (!itemId || !slug) return;

    const fetchData = async () => {
      const [itemDoc, storeQuery] = await Promise.all([
        getDoc(doc(db, 'items', itemId)),
        getDocs(query(collection(db, 'stores'), where('slug', '==', slug))),
      ]);

      if (itemDoc.exists()) {
        setItem({ id: itemDoc.id, ...itemDoc.data() } as Item);
      }
      if (!storeQuery.empty) {
        setStore(storeQuery.docs[0].data() as Store);
      }
      setLoading(false);
    };

    fetchData();
  }, [itemId, slug]);

  if (loading) {
    return <LoadingAnimation />;
  }

  if (!item || !store) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-display mb-2">Item Not Found</h1>
        <Link to={`/${slug}`} className="mono text-sm text-neon-pink underline">
          Back to store
        </Link>
      </div>
    );
  }

  const itemUrl = `${window.location.origin}/${slug}/${itemId}`;
  const prefilledMessage = `Hi! I'm interested in your "${item.title}" for ₱${item.price} on Forever Decluttering.\n\n${itemUrl}`;
  const cleanNumber = store.contactNumber?.replace(/\D/g, '') || '';

  // Only return HTTPS-based links that browsers handle safely.
  // Protocol links (viber://, sms:) can cause SSL errors on some browsers.
  const getWebLink = (): { url: string; label: string } | null => {
    switch (store.contactMethod) {
      case 'WhatsApp':
        return {
          url: `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(prefilledMessage)}`,
          label: 'Open WhatsApp',
        };
      case 'Messenger':
        return {
          url: `https://m.me/${store.contactNumber}`,
          label: 'Open Messenger',
        };
      default:
        // Viber and SMS: no reliable web link — user copies number instead
        return null;
    }
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(prefilledMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyNumber = async () => {
    await navigator.clipboard.writeText(store.contactNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const hasMultipleImages = item.images.length > 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to={`/${slug}`}
        className="inline-flex items-center gap-1 mono text-sm font-bold uppercase mb-6 hover:text-neon-pink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {store.displayName}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Gallery */}
        <div className="border-[3px] border-black brutal-shadow bg-gray-100 relative">
          <div className="aspect-square overflow-hidden">
            {item.images.length > 0 ? (
              <img
                src={item.images[currentImage]}
                alt={item.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl font-display">
                ?
              </div>
            )}
          </div>

          {hasMultipleImages && (
            <>
              <button
                onClick={() => setCurrentImage((prev) => (prev === 0 ? item.images.length - 1 : prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border-[3px] border-black p-1 brutal-shadow-small hover:bg-neon-pink transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImage((prev) => (prev === item.images.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border-[3px] border-black p-1 brutal-shadow-small hover:bg-neon-pink transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {item.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`w-2.5 h-2.5 border-2 border-black ${idx === currentImage ? 'bg-neon-pink' : 'bg-white'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Item Info */}
        <div className="flex flex-col">
          <div className="border-[3px] border-black p-6 bg-white brutal-shadow flex-1">
            {item.condition && (
              <span className="inline-block text-[10px] font-mono font-bold uppercase bg-black text-white px-2 py-0.5 mb-3">
                {item.condition}
              </span>
            )}
            <h1 className="text-3xl font-display leading-none tracking-tighter mb-2">
              {item.title}
            </h1>
            <p className="text-4xl font-display text-neon-pink mb-4" style={{ WebkitTextStroke: '1px black' }}>
              ₱{item.price}
            </p>
            <p className="mono text-sm text-gray-600 mb-6 whitespace-pre-line">
              {item.description}
            </p>

            <div className="border-t-[3px] border-black pt-4 mt-auto">
              <p className="mono text-xs text-gray-400 uppercase font-bold mb-1">
                Sold by {store.displayName}
              </p>
              {store.paymentMethods && store.paymentMethods.length > 0 && (
                <div className="flex gap-1 mb-4">
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

              {item.status === 'available' ? (
                <button
                  onClick={() => setShowContact(true)}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-black text-white font-display text-xl hover:bg-neon-pink hover:text-black transition-all brutal-shadow border-[3px] border-black cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  I Want This
                </button>
              ) : (
                <div className="w-full py-4 bg-gray-200 text-gray-500 font-display text-xl text-center border-[3px] border-gray-300">
                  SOLD
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContact && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContact(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-[3px] border-black p-6 max-h-[80vh] overflow-y-auto"
            >
              {/* Handle bar */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display">Message {store.displayName}</h2>
                <button
                  onClick={() => setShowContact(false)}
                  className="p-1 border-[3px] border-black hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="mono text-xs text-gray-400 uppercase font-bold mb-4">
                Via {store.contactMethod}
              </p>

              {/* Contact Number */}
              <div className="border-[3px] border-black p-3 mb-3 flex items-center justify-between">
                <span className="mono text-sm font-bold">{store.contactNumber}</span>
                <button
                  onClick={handleCopyNumber}
                  className="flex items-center gap-1 px-2 py-1 text-xs mono font-bold uppercase bg-gray-100 border-[2px] border-black hover:bg-neon-pink transition-colors"
                >
                  {copiedNumber ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedNumber ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Pre-filled Message */}
              <div className="border-[3px] border-black p-3 mb-4">
                <p className="mono text-xs text-gray-400 uppercase font-bold mb-2">Suggested message</p>
                <p className="mono text-sm text-gray-700 whitespace-pre-line mb-2">{prefilledMessage}</p>
                <button
                  onClick={handleCopyMessage}
                  className="flex items-center gap-1 px-2 py-1 text-xs mono font-bold uppercase bg-gray-100 border-[2px] border-black hover:bg-neon-pink transition-colors"
                >
                  {copiedMessage ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedMessage ? 'Copied!' : 'Copy message'}
                </button>
              </div>

              {/* Open App Link — only for HTTPS-based links (WhatsApp, Messenger) */}
              {getWebLink() && (
                <a
                  href={getWebLink()!.url}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-black text-white font-display text-lg hover:bg-neon-pink hover:text-black transition-all brutal-shadow border-[3px] border-black cursor-pointer mb-3 no-underline"
                >
                  <ExternalLink className="w-5 h-5" />
                  {getWebLink()!.label}
                </a>
              )}

              <p className="mono text-[10px] text-gray-400 text-center">
                If the app doesn't open, copy the number and message them directly.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
