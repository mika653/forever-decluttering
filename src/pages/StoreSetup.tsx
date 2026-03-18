import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { Store } from '../types';
import { serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';

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
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
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
