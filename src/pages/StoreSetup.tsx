import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Store } from '../types';
import { serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Trash2, Plus, X, Copy, Check, ExternalLink } from 'lucide-react';

interface StoreSetupProps {
  user: User;
}

const RESERVED_SLUGS = ['dashboard', 'login', 'signup', 'admin', 'api', 'settings'];
const TOTAL_STEPS = 9;
const DEFAULT_COURIERS = ['J&T Express', 'LBC', 'Flash Express', 'Grab Express', 'Lalamove', 'Ninja Van'];

export default function StoreSetup({ user }: StoreSetupProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
  const [paymentQRs, setPaymentQRs] = useState<{ label: string; url: string }[]>([]);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [qrLabel, setQrLabel] = useState<string>('GCash');
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

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
        // Migrate old single paymentQR to paymentQRs array
        if (storeData.paymentQRs && storeData.paymentQRs.length > 0) {
          setPaymentQRs(storeData.paymentQRs);
        } else if (storeData.paymentQR) {
          setPaymentQRs([{ label: 'GCash', url: storeData.paymentQR }]);
        }
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
      const ext = file.name.split('.').pop() || 'png';
      const filename = `${qrLabel.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
      const storageRef = ref(storage, `stores/${slug.toLowerCase()}/payment-qr/${filename}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPaymentQRs((prev) => [...prev, { label: qrLabel, url }]);
    } catch (err) {
      console.error('QR upload error', err);
    } finally {
      setUploadingQR(false);
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  };

  const removeQR = (index: number) => {
    setPaymentQRs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
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
        paymentQR: paymentQRs.length > 0 ? paymentQRs[0].url : (paymentQR || null),
        paymentQRs: paymentQRs.length > 0 ? paymentQRs : null,
      };

      if (!isEditing) {
        storeData.createdAt = serverTimestamp();
      }

      // Use slug as document ID for easy lookup
      await setDoc(doc(db, 'stores', slug.toLowerCase()), storeData, { merge: true });
    } catch (err) {
      console.error('Store setup error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return true;
      case 2: return displayName.trim().length > 0;
      case 3: return slugStatus === 'available';
      case 4: return contactNumber.trim().length > 0;
      case 5: return true;
      case 6: return paymentMethods.length > 0;
      case 7: return couriers.length > 0;
      case 8: return true;
      case 9: return true;
      default: return false;
    }
  };

  const goNext = async () => {
    if (step === 8) {
      // Save on transition to Done step
      await handleSave();
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://forever-decluttering.app/${slug.toLowerCase()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const storeUrl = `forever-decluttering.app/${slug.toLowerCase()}`;

  // Progress bar
  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i + 1 === step
              ? 'w-8 bg-black'
              : i + 1 < step
              ? 'w-4 bg-neon-pink'
              : 'w-4 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );

  // Navigation buttons
  const NavButtons = ({ showSkip, skipLabel }: { showSkip?: boolean; skipLabel?: string }) => (
    <div className="flex items-center justify-between mt-8 gap-3">
      {step > 1 ? (
        <button
          type="button"
          onClick={goBack}
          className="px-5 py-3 bg-white border-[3px] border-black brutal-shadow-small hover:bg-gray-100 font-display text-sm transition-colors"
        >
          Back
        </button>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-3">
        {showSkip && (
          <button
            type="button"
            onClick={goNext}
            className="mono text-sm text-gray-400 hover:text-black underline transition-colors"
          >
            {skipLabel || 'Skip'}
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={!canAdvance() || submitting}
          className="px-8 py-4 bg-black text-white font-display text-lg hover:bg-neon-pink hover:text-black transition-all brutal-shadow border-[3px] border-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 8 ? (submitting ? 'Saving...' : 'Finish') : 'Next'}
        </button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      // Step 1: Welcome
      case 1:
        return (
          <div className="text-center py-8">
            <h1 className="text-2xl sm:text-3xl font-display mb-3">
              {isEditing ? 'Update Your Store' : "Let's set up your store"}
            </h1>
            <p className="mono text-sm text-gray-500 mb-10">
              {isEditing
                ? 'Change any of your store details.'
                : "It only takes a minute. We'll walk you through it."}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="w-full py-4 bg-black text-white font-display text-lg hover:bg-neon-pink hover:text-black transition-all brutal-shadow border-[3px] border-black"
            >
              {isEditing ? "Let's Update" : "Let's Go"}
            </button>
          </div>
        );

      // Step 2: Store Name
      case 2:
        return (
          <div>
            <h1 className="text-2xl sm:text-3xl font-display mb-2">
              What should we call your store?
            </h1>
            <p className="mono text-sm text-gray-500 mb-8">
              This is what buyers will see.
            </p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="brutal-input text-lg w-full py-4 px-4"
              placeholder="Your name or store name"
              autoFocus
            />
            <NavButtons />
          </div>
        );

      // Step 3: Your Link
      case 3:
        return (
          <div>
            <h1 className="text-2xl sm:text-3xl font-display mb-2">
              Pick your link
            </h1>
            <p className="mono text-sm text-gray-500 mb-8">
              This is your personal URL. Share it anywhere.
            </p>
            <div className="flex items-center">
              <span className="mono text-xs sm:text-sm text-gray-400 bg-gray-100 border-[3px] border-r-0 border-black px-2 sm:px-3 py-4 whitespace-nowrap">
                <span className="hidden sm:inline">forever-decluttering.app/</span>
                <span className="sm:hidden">f-d.app/</span>
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="brutal-input border-l-0 text-lg flex-1 py-4 px-4"
                placeholder="your-name"
                minLength={3}
                maxLength={30}
                disabled={isEditing}
                autoFocus={!isEditing}
              />
            </div>
            {isEditing ? (
              <p className="mono text-xs mt-2 text-gray-400">
                Your link can't be changed.
              </p>
            ) : (
              <div className="mono text-xs mt-2">
                {slugStatus === 'checking' && <span className="text-gray-400">Checking...</span>}
                {slugStatus === 'available' && <span className="text-neon-green font-bold">Available!</span>}
                {slugStatus === 'taken' && <span className="text-red-500 font-bold">Already taken</span>}
                {slugStatus === 'idle' && slug.length > 0 && slug.length < 3 && (
                  <span className="text-gray-400">At least 3 characters</span>
                )}
              </div>
            )}
            <NavButtons />
          </div>
        );

      // Step 4: Contact
      case 4:
        return (
          <div>
            <h1 className="text-2xl sm:text-3xl font-display mb-2">
              How should buyers reach you?
            </h1>
            <p className="mono text-sm text-gray-500 mb-8">
              When someone wants your item, they'll message you here.
            </p>
            <div className="space-y-4">
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value as Store['contactMethod'])}
                className="brutal-input text-lg w-full py-4 px-4 appearance-none bg-white"
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
                className="brutal-input text-lg w-full py-4 px-4"
                placeholder="+63 917 123 4567"
                autoFocus
              />
            </div>
            <NavButtons />
          </div>
        );

      // Step 5: Bio
      case 5:
        return (
          <div>
            <h1 className="text-2xl sm:text-3xl font-display mb-2">
              Tell buyers about yourself
            </h1>
            <p className="mono text-sm text-gray-500 mb-8">
              Optional — a short bio for your store page.
            </p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="brutal-input text-lg w-full py-4 px-4 min-h-[140px]"
              placeholder="Decluttering my life, one item at a time..."
              maxLength={200}
              autoFocus
            />
            <NavButtons showSkip skipLabel="Skip" />
          </div>
        );

      // Step 6: Payment
      case 6:
        return (
          <div>
            <h1 className="text-2xl sm:text-3xl font-display mb-2">
              How do you want to get paid?
            </h1>
            <p className="mono text-sm text-gray-500 mb-8">
              Select all that apply.
            </p>
            <div className="flex flex-wrap gap-3">
              {['GCash', 'Maya', 'Bank Transfer', 'Cash on Pickup'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => togglePayment(method)}
                  className={`px-5 py-3 text-sm font-bold uppercase border-[3px] border-black brutal-shadow-small transition-colors ${
                    paymentMethods.includes(method)
                      ? 'bg-neon-pink'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            <NavButtons />
          </div>
        );

      // Step 7: Couriers
      case 7:
        return (
          <div>
            <h1 className="text-2xl sm:text-3xl font-display mb-2">
              Which couriers do you use?
            </h1>
            <p className="mono text-sm text-gray-500 mb-8">
              Buyers will choose from these when ordering.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              {DEFAULT_COURIERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCourier(c)}
                  className={`px-5 py-3 text-sm font-bold uppercase border-[3px] border-black brutal-shadow-small transition-colors ${
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
            {couriers.filter((c) => !DEFAULT_COURIERS.includes(c)).map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase border-[3px] border-black bg-neon-pink mr-2 mb-2">
                {c}
                <button type="button" onClick={() => toggleCourier(c)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customCourier}
                onChange={(e) => setCustomCourier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCourier())}
                className="brutal-input text-lg flex-1 py-3 px-4"
                placeholder="Add custom courier..."
              />
              <button
                type="button"
                onClick={addCustomCourier}
                disabled={!customCourier.trim()}
                className="px-4 border-[3px] border-black bg-white hover:bg-gray-100 brutal-shadow-small transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <NavButtons />
          </div>
        );

      // Step 8: Payment QR Codes
      case 8:
        return (
          <div>
            <h1 className="text-2xl sm:text-3xl font-display mb-2">
              Add your payment QR codes
            </h1>
            <p className="mono text-sm text-gray-500 mb-8">
              Optional — buyers can scan and pay instantly.
            </p>

            {/* Uploaded QR list */}
            {paymentQRs.length > 0 && (
              <div className="space-y-2 mb-4">
                {paymentQRs.map((qr, index) => (
                  <div key={index} className="border-[3px] border-black p-3 bg-gray-50 flex items-center gap-3">
                    <img
                      src={qr.url}
                      alt={`${qr.label} QR`}
                      className="w-16 h-16 object-contain border-[2px] border-black bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <span className="mono text-xs font-bold uppercase flex-1">{qr.label}</span>
                    <button
                      type="button"
                      onClick={() => removeQR(index)}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold uppercase border-[3px] border-black bg-white hover:bg-red-100 transition-colors brutal-shadow-small"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add QR Code */}
            <div className="border-[3px] border-dashed border-black p-4 bg-gray-50">
              <div className="flex gap-2">
                <select
                  value={qrLabel}
                  onChange={(e) => setQrLabel(e.target.value)}
                  className="flex-1 border-[3px] border-black px-3 py-3 mono text-sm font-bold uppercase bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-neon-pink"
                >
                  <option value="GCash">GCash</option>
                  <option value="Maya">Maya</option>
                  <option value="GoTyme">GoTyme</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  disabled={uploadingQR || !slug}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-[3px] border-black bg-white hover:bg-gray-100 transition-colors mono text-sm font-bold uppercase disabled:opacity-50 brutal-shadow-small"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingQR ? 'Uploading...' : 'Add QR'}
                </button>
              </div>
            </div>

            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              onChange={handleQRUpload}
              className="hidden"
            />

            <NavButtons showSkip skipLabel="Skip" />
          </div>
        );

      // Step 9: Done
      case 9:
        return (
          <div className="text-center py-6">
            <h1 className="text-2xl sm:text-3xl font-display mb-2">
              You're all set!
            </h1>
            <p className="mono text-sm text-gray-500 mb-8">
              Your store is live. Share your link and start decluttering.
            </p>

            {/* Store link */}
            <div className="border-[3px] border-black bg-gray-50 p-4 mb-8 flex items-center justify-between gap-2">
              <span className="mono text-sm sm:text-base font-bold truncate">
                {storeUrl}
              </span>
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-1 px-3 py-2 border-[3px] border-black bg-white hover:bg-gray-100 transition-colors brutal-shadow-small mono text-xs font-bold uppercase shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-black text-white font-display text-lg hover:bg-neon-pink hover:text-black transition-all brutal-shadow border-[3px] border-black"
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate(`/${slug.toLowerCase()}`)}
                className="w-full py-4 bg-white font-display text-lg hover:bg-gray-100 transition-all brutal-shadow border-[3px] border-black flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                View My Store
              </button>
            </div>

            <div className="mt-6 flex justify-start">
              <button
                type="button"
                onClick={goBack}
                className="px-5 py-3 bg-white border-[3px] border-black brutal-shadow-small hover:bg-gray-100 font-display text-sm transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <ProgressBar />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="border-[3px] border-black p-8 bg-white brutal-shadow"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
