import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadItemImage } from '../lib/storage';
import { Camera, Plus, X, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AddItemProps {
  user: User;
  storeSlug: string;
}

export default function AddItem({ user, storeSlug }: AddItemProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('Good');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos = [...photos, ...files].slice(0, 5);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((file) => URL.createObjectURL(file)));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0 || !price) return;

    setSubmitting(true);
    try {
      const itemRef = await addDoc(collection(db, 'items'), {
        storeSlug,
        sellerId: user.uid,
        title,
        description,
        price: parseFloat(price),
        condition,
        images: [],
        status: 'available',
        createdAt: serverTimestamp(),
      });

      const imageUrls = await Promise.all(
        photos.map((file) => uploadItemImage(storeSlug, itemRef.id, file))
      );

      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'items', itemRef.id), { images: imageUrls });

      navigate('/dashboard');
    } catch (err) {
      console.error('Submit error', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[3px] border-black p-6 bg-white brutal-shadow"
      >
        <h1 className="text-3xl font-display mb-1">Add Item</h1>
        <p className="mono text-sm text-gray-500 mb-6">Snap a photo, fill in the details, post.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo Section */}
          <div>
            <label className="mono text-xs font-bold uppercase block mb-2">Photos</label>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photoPreviews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-square border-[3px] border-black overflow-hidden">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-black text-white p-0.5 hover:bg-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-[3px] border-dashed border-black flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-gray-400" />
                  </button>
                )}
              </div>
            )}

            {photos.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] border-[3px] border-dashed border-black flex flex-col items-center justify-center gap-3 hover:bg-neon-pink/5 transition-colors cursor-pointer"
              >
                <div className="bg-neon-pink border-[3px] border-black p-4 brutal-shadow-small">
                  <Camera className="w-8 h-8" />
                </div>
                <span className="mono text-sm font-bold uppercase text-gray-500">
                  Tap to add a photo
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* Details (shown after photo) */}
          {photos.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div>
                <label className="mono text-xs font-bold uppercase block mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="brutal-input text-sm"
                  placeholder="What is it?"
                  required
                />
              </div>

              <div>
                <label className="mono text-xs font-bold uppercase block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="brutal-input text-sm min-h-[80px]"
                  placeholder="Details, features, why you're selling..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mono text-xs font-bold uppercase block mb-1">Price (₱)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="brutal-input text-sm"
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="mono text-xs font-bold uppercase block mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="brutal-input text-sm appearance-none bg-white"
                  >
                    <option>Brand New</option>
                    <option>Like New</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Well-loved</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || photos.length === 0}
                className="w-full py-3 bg-black text-white font-display text-lg hover:bg-neon-pink hover:text-black transition-all brutal-shadow border-[3px] border-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Item'
                )}
              </button>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
