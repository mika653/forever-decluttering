import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Store } from '../types';
import { serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Upload, Trash2, Plus, X } from 'lucide-react';

interface StoreSetupProps {
  user: User;
}

const RESERVED_SLUGS = ['dashboard', 'login', 'signup', 'admin', 'api', 'settings'];

export default function StoreSetup({ user }: StoreSetupProps) {
  const navigate = useNavigate();
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [contactMethod, setContactMethod] = useState<Store['contactMethod']>('WhatsApp');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['GCash']);
  const [couriers, setCouriers] = useState<string[]>(['J&T Express', 'LBC']);
  const [customCourier, setCustomCourier] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [paymentQR, setPaymentQR] = useState<string>('');
  const [uploadingQR, setUploadingQR] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing store if editing
  useEffect(() => {
    const loadStore = async () => {
      const storeQuery = query(collection(db, 'stores'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(storeQuery);
      if (!snapshot.empty) {
        const storeData = snapshot.docs[0].data() as Store;
        setSlug(storeData.slug);
        setDisplayName(storeData.displayName);
        setBio(storeData.bio || '');
        setContactNumber(storeData.contactNumber);
        setContactMethod(storeData.contactMethod);
        setPaymentMethods(storeData.paymentMethods || ['GCash']);
        setCouriers(storeData.couriers || ['J&T Express', 'LBC']);
        setPaymentQR(storeData.paymentQR || '');
        setIsEditing(true);
        setSlugStatus('available');
      }
    };
    loadStore();
  }, [user.uid]);

  // Check slug availability
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }

    if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
      setSlugStatus('taken');
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus('checking');
      const q = query(collection(db, 'stores'), where('slug', '==', slug.toLowerCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setSlugStatus('available');
      } else {
        // If editing and slug belongs to current user, it's fine
        const existingStore = snapshot.docs[0].data() as Store;
        setSlugStatus(existingStore.ownerId === user.uid ? 'available' : 'taken');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, user.uid]);

  const togglePayment = (method: string) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const toggleCourier = (c: string) => {
    setCouriers((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const addCustomCourier = () => {
    const trimmed = customCourier.trim();
    if (trimmed && !couriers.includes(trimmed)) {
      setCouriers((prev) => [...prev, trimmed]);
    }
    setCustomCourier('');
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !slug) return;

    setUploadingQR(true);
    try {
      const filename = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `stores/${slug.toLowerCase()}/payment-qr/${filename}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPaymentQR(url);
    } catch (err) {
      console.error('QR upload error', err);
    } finally {
      setUploadingQR(false);
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugStatus !== 'available' || !contactNumber) return;

    setSubmitting(true);
    try {
      const storeData: Record<string, unknown> = {
        slug: slug.toLowerCase(),
        ownerId: user.uid,
        displayName,
        bio,
        photoURL: user.photoURL,
        contactNumber,
        contactMethod,
        paymentMethods,
        couriers,
        paymentQR: paymentQR || null,
      };

      if (!isEditing) {
        storeData.createdAt = serverTimestamp();
      }

      // Use slug as document ID for easy lookup
      await setDoc(doc(db, 'stores', slug.toLowerCase()), storeData, { merge: true });
      navigate('/dashboard');
    } catch (err) {
      console.error('Store setup error', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[3px] border-black p-8 bg-white brutal-shadow"
      >
        <h1 className="text-3xl font-display mb-1">
          {isEditing ? 'Store Settings' : 'Set Up Your Store'}
        </h1>
        <p className="mono text-sm text-gray-500 mb-6">
          {isEditing ? 'Update your store details.' : 'Pick your link, add your contact. Takes 30 seconds.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Slug */}
          <div>
            <label className="mono text-xs font-bold uppercase block mb-1">Your Link</label>
            <div className="flex items-center">
              <span className="mono text-sm text-gray-400 bg-gray-100 border-[3px] border-r-0 border-black px-3 py-2.5">
                forever-decluttering.app/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="brutal-input border-l-0 text-sm flex-1"
                placeholder="your-name"
                required
                minLength={3}
                maxLength={30}
                disabled={isEditing}
              />
            </div>
            <div className="mono text-xs mt-1">
              {slugStatus === 'checking' && <span className="text-gray-400">Checking...</span>}
              {slugStatus === 'available' && <span className="text-neon-green font-bold">Available!</span>}
              {slugStatus === 'taken' && <span className="text-red-500 font-bold">Already taken</span>}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="mono text-xs font-bold uppercase block mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="brutal-input text-sm"
              placeholder="Your name or store name"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="mono text-xs font-bold uppercase block mb-1">Bio (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="brutal-input text-sm min-h-[80px]"
              placeholder="Decluttering my life, one item at a time..."
              maxLength={200}
            />
          </div>

          {/* Contact */}
          <div>
            <label className="mono text-xs font-bold uppercase block mb-1">Contact for Buyers</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value as Store['contactMethod'])}
                className="brutal-input text-sm appearance-none bg-white"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Viber">Viber</option>
                <option value="SMS">SMS</option>
                <option value="Messenger">Messenger</option>
              </select>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="brutal-input text-sm"
                placeholder="+63 917 123 4567"
                required
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="mono text-xs font-bold uppercase block mb-1">Payment Methods Accepted</label>
            <div className="flex flex-wrap gap-2">
              {['GCash', 'Maya', 'Bank Transfer', 'Cash on Pickup'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => togglePayment(method)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase border-[3px] border-black brutal-shadow-small transition-colors ${
                    paymentMethods.includes(method)
                      ? 'bg-neon-pink'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Couriers */}
          <div>
            <label className="mono text-xs font-bold uppercase block mb-1">Available Couriers</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['J&T Express', 'LBC', 'Flash Express', 'Grab Express', 'Lalamove', 'Ninja Van'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCourier(c)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase border-[3px] border-black brutal-shadow-small transition-colors ${
                    couriers.includes(c)
                      ? 'bg-neon-pink'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {/* Custom couriers */}
            {couriers.filter((c) => !['J&T Express', 'LBC', 'Flash Express', 'Grab Express', 'Lalamove', 'Ninja Van'].includes(c)).map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase border-[3px] border-black bg-neon-pink mr-1 mb-1">
                {c}
                <button type="button" onClick={() => toggleCourier(c)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customCourier}
                onChange={(e) => setCustomCourier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCourier())}
                className="brutal-input text-sm flex-1"
                placeholder="Add custom courier..."
              />
              <button
                type="button"
                onClick={addCustomCourier}
                disabled={!customCourier.trim()}
                className="px-3 border-[3px] border-black bg-white hover:bg-gray-100 brutal-shadow-small transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Payment QR Code */}
          <div>
            <label className="mono text-xs font-bold uppercase block mb-1">Payment QR Code (optional)</label>
            <p className="mono text-[10px] text-gray-400 mb-2">Upload your GCash, Maya, or bank QR code so buyers can pay easily.</p>

            {paymentQR ? (
              <div className="border-[3px] border-black p-3 bg-gray-50">
                <img
                  src={paymentQR}
                  alt="Payment QR Code"
                  className="w-48 h-48 object-contain mx-auto mb-3"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => setPaymentQR('')}
                  className="flex items-center gap-1 mx-auto px-3 py-1.5 text-xs font-bold uppercase border-[3px] border-black bg-white hover:bg-red-100 transition-colors brutal-shadow-small"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove QR
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => qrInputRef.current?.click()}
                disabled={uploadingQR || !slug}
                className="flex items-center justify-center gap-2 w-full py-3 border-[3px] border-dashed border-black bg-gray-50 hover:bg-gray-100 transition-colors mono text-sm font-bold uppercase disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploadingQR ? 'Uploading...' : 'Upload QR Code'}
              </button>
            )}

            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              onChange={handleQRUpload}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || slugStatus !== 'available' || !contactNumber}
            className="w-full py-3 bg-black text-white font-display text-lg hover:bg-neon-pink hover:text-black transition-all brutal-shadow border-[3px] border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create My Store'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
