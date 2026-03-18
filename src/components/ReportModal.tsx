import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flag, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  type: 'store' | 'item';
  targetId: string;
  targetLabel: string;
}

const REASONS = [
  'Inappropriate or offensive content',
  'Suspected scam or fraud',
  'Misleading listing (wrong photos/description)',
  'Prohibited item',
  'Harassment or abusive behavior',
  'Other',
];

export default function ReportModal({ open, onClose, type, targetId, targetLabel }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        type,
        targetId,
        targetLabel,
        reason,
        details: details || null,
        reporterContact: contact || null,
        createdAt: Timestamp.now(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setReason('');
      setDetails('');
      setContact('');
      setSubmitted(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-[3px] border-black px-4 sm:px-6 pt-4 pb-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            {submitted ? (
              <div className="text-center py-8">
                <div className="inline-block p-3 bg-neon-green border-[3px] border-black brutal-shadow-small mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-display mb-2">Report Submitted</h2>
                <p className="mono text-sm text-gray-500 mb-6">
                  Thanks for helping keep Forever Decluttering safe. We'll review this shortly.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border-[3px] border-black bg-black text-white font-display brutal-shadow-small hover:bg-neon-pink hover:text-black transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    <h2 className="text-2xl font-display">Report {type === 'store' ? 'Store' : 'Item'}</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 border-[3px] border-black hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="mono text-xs text-gray-400 mb-4">
                  Reporting: <span className="font-bold text-black">{targetLabel}</span>
                </p>

                {/* Reason selection */}
                <div className="space-y-2 mb-4">
                  <p className="mono text-xs font-bold uppercase">What's wrong?</p>
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full text-left px-3 py-2.5 border-[3px] border-black mono text-sm transition-colors ${
                        reason === r ? 'bg-neon-pink font-bold' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Optional details */}
                <div className="mb-4">
                  <label className="mono text-xs font-bold uppercase block mb-1">
                    Details <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Tell us more about what happened..."
                    className="w-full border-[3px] border-black px-3 py-2 mono text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-neon-pink"
                  />
                </div>

                {/* Optional contact */}
                <div className="mb-6">
                  <label className="mono text-xs font-bold uppercase block mb-1">
                    Your contact <span className="text-gray-400 font-normal">(optional, for follow-up)</span>
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Email or phone number"
                    className="w-full border-[3px] border-black px-3 py-2 mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-pink"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!reason || submitting}
                  className={`flex items-center justify-center gap-2 w-full py-4 font-display text-lg border-[3px] border-black brutal-shadow transition-all ${
                    reason && !submitting
                      ? 'bg-red-500 text-white hover:brightness-110 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Flag className="w-5 h-5" />
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>

                <p className="mono text-[10px] text-gray-400 text-center mt-3">
                  Reports are reviewed by our team. False reports may result in action against the reporter.
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
