import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ExternalLink, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSheet({ open, onClose }: CartSheetProps) {
  const { items, store, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [courier, setCourier] = useState('');

  if (!store) return null;

  const cleanNumber = store.contactNumber?.replace(/\D/g, '') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const itemsList = items
    .map((ci) => `• ${ci.item.title} (₱${ci.item.price}${ci.quantity > 1 ? ` x${ci.quantity}` : ''})`)
    .join('\n');

  const orderMessage = `Hi! I'd like to buy ${totalItems} item${totalItems > 1 ? 's' : ''} from your store on Forever Decluttering:\n\n${itemsList}\n\n💰 Total: ₱${totalPrice}\n\n📦 Ship to:\nName: ${buyerName}\nContact: ${buyerContact}\nAddress: ${shippingAddress}\nPreferred courier: ${courier}\n\nPlease let me know the shipping fee!\n\n${window.location.origin}/${store.slug}`;

  const whatsappUrl = `https://${isMobile ? 'api' : 'web'}.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(orderMessage)}`;

  const canSubmit = buyerName && shippingAddress && items.length > 0;

  const cartContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          <h2 className="text-2xl font-display">Your Bag</h2>
          <span className="mono text-xs bg-black text-white px-1.5 py-0.5 font-bold">
            {totalItems}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 border-[3px] border-black hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-display text-xl text-gray-400 mb-1">Bag is empty</p>
          <p className="mono text-sm text-gray-400">Click "Add to Bag" on items you like</p>
        </div>
      ) : (
        <>
          {/* Cart items */}
          <div className="space-y-2 mb-4">
            {items.map((ci) => (
              <div
                key={ci.item.id}
                className="border-[3px] border-black p-2 flex items-center gap-3"
              >
                {ci.item.images[0] && (
                  <img
                    src={ci.item.images[0]}
                    alt={ci.item.title}
                    className="w-14 h-14 object-cover border-[2px] border-black flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm leading-tight truncate">{ci.item.title}</p>
                  <p className="font-display text-base text-neon-pink" style={{ WebkitTextStroke: '0.5px black' }}>
                    ₱{ci.item.price * ci.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center border-[2px] border-black hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="mono text-sm font-bold w-6 text-center">{ci.quantity}</span>
                  <button
                    onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center border-[2px] border-black hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(ci.item.id)}
                  className="min-w-[32px] min-h-[32px] flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-[3px] border-black p-3 mb-4 bg-neon-pink/10 flex items-center justify-between">
            <span className="mono text-sm font-bold uppercase">Total ({totalItems} item{totalItems > 1 ? 's' : ''})</span>
            <span className="font-display text-2xl" style={{ WebkitTextStroke: '0.5px black' }}>₱{totalPrice}</span>
          </div>

          {/* Clear cart */}
          <button
            onClick={clearCart}
            className="mono text-xs text-gray-400 hover:text-red-500 transition-colors mb-4 underline"
          >
            Clear bag
          </button>

          {/* Payment methods */}
          {store.paymentMethods && store.paymentMethods.length > 0 && (
            <div className="mb-4">
              <p className="mono text-xs text-gray-400 uppercase font-bold mb-1">Accepted Payment</p>
              <div className="flex gap-1 flex-wrap">
                {store.paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="text-[10px] font-mono font-bold uppercase bg-black text-white px-1.5 py-0.5"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Payment QR Codes */}
          {(() => {
            const qrList: { label: string; url: string }[] =
              store.paymentQRs && store.paymentQRs.length > 0
                ? store.paymentQRs
                : store.paymentQR
                  ? [{ label: 'GCash', url: store.paymentQR }]
                  : [];

            if (qrList.length === 0) return null;

            return (
              <div className="border-[3px] border-black p-3 mb-4 bg-gray-50 text-center">
                <p className="mono text-xs font-bold uppercase mb-2">Scan to pay</p>
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  {qrList.map((qr, idx) => (
                    <span key={idx} className="text-[10px] font-mono font-bold uppercase text-gray-500">
                      {qr.label}{idx < qrList.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                </div>
                <img
                  src={qrList[0].url}
                  alt={`${qrList[0].label} QR Code`}
                  className="w-48 h-48 object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
            );
          })()}

          {/* Buyer form */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="mono text-xs font-bold uppercase block mb-1">Your Name</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full border-[3px] border-black px-3 py-2 mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-pink"
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div>
              <label className="mono text-xs font-bold uppercase block mb-1">Contact Number</label>
              <input
                type="tel"
                value={buyerContact}
                onChange={(e) => setBuyerContact(e.target.value)}
                className="w-full border-[3px] border-black px-3 py-2 mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-pink"
                placeholder="09XX XXX XXXX"
              />
              <p className="mono text-[10px] text-gray-400 mt-0.5">Your WhatsApp/Viber number for the seller to reach you</p>
            </div>
            <div>
              <label className="mono text-xs font-bold uppercase block mb-1">Shipping Address</label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full border-[3px] border-black px-3 py-2 mono text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-neon-pink"
                placeholder="123 Main St, Brgy. Sample, Makati City, Metro Manila 1200"
              />
            </div>
            <div>
              <label className="mono text-xs font-bold uppercase block mb-1">Preferred Courier</label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full border-[3px] border-black px-3 py-2 mono text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-neon-pink"
              >
                {(store.couriers && store.couriers.length > 0
                  ? store.couriers
                  : ['J&T Express', 'LBC', 'Grab Express', 'Ninja Van']
                ).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Send Order */}
          <a
            href={whatsappUrl}
            {...(!isMobile ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={`flex items-center justify-center gap-2 w-full min-h-[48px] py-4 font-display text-lg border-[3px] border-black brutal-shadow no-underline transition-all ${
              canSubmit
                ? 'bg-neon-pink text-black hover:brightness-110 cursor-pointer'
                : 'bg-gray-200 text-gray-400 pointer-events-none'
            }`}
          >
            <ExternalLink className="w-5 h-5" />
            Send Order via WhatsApp
          </a>

          <p className="mono text-[10px] text-gray-400 text-center mt-3">
            This will open WhatsApp with all {totalItems} item{totalItems > 1 ? 's' : ''} and your details pre-filled.
          </p>
        </>
      )}
    </>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Mobile: bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-[3px] border-black px-4 pt-4 pb-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            {cartContent}
          </motion.div>

          {/* Desktop: right side panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="hidden md:block fixed top-0 right-0 z-50 bg-white border-l-[3px] border-black w-[440px] h-full overflow-y-auto px-6 py-6"
          >
            {cartContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
