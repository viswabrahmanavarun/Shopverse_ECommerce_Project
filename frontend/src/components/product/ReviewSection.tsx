import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, MessageSquare, ThumbsUp } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
}

// ─── Star Rating Picker ────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-125"
        >
          <Star
            size={28}
            className="transition-colors"
            fill={(hovered || value) >= star ? '#f59e0b' : 'none'}
            stroke={(hovered || value) >= star ? '#f59e0b' : '#d1d5db'}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Static Star Display ──────────────────────────────────────────────────────
function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={rating >= star ? '#f59e0b' : rating >= star - 0.5 ? '#fcd34d' : 'none'}
          stroke={rating >= star ? '#f59e0b' : '#d1d5db'}
        />
      ))}
    </div>
  );
}

// ─── Rating Breakdown Bar ─────────────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-6 text-right text-gray-500">{star}</span>
      <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="h-full bg-amber-400 rounded-full"
        />
      </div>
      <span className="w-8 text-gray-400 text-xs">{pct}%</span>
    </div>
  );
}

// ─── Main ReviewSection ───────────────────────────────────────────────────────
export default function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [reviewEligibilityReason, setReviewEligibilityReason] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const { data } = await api.get(`/products/${productId}/reviews`);
      setReviews(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const checkEligibility = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get(`/products/${productId}/can-review`);
      setCanReview(data.can_review);
      setReviewEligibilityReason(data.reason);
    } catch {
      setCanReview(false);
    }
  }, [productId, user]);

  useEffect(() => { 
    fetchReviews(); 
    checkEligibility();
  }, [fetchReviews, checkEligibility]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    if (title.trim().length < 3) { toast.error('Title must be at least 3 characters'); return; }
    if (body.trim().length < 10) { toast.error('Review must be at least 10 characters'); return; }

    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, title, body });
      toast.success('Review posted! ⭐');
      setShowForm(false);
      setRating(0); setTitle(''); setBody('');
      fetchReviews();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/products/${productId}/reviews/${reviewId}`);
      toast.success('Review deleted');
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare size={22} className="text-brand" />
            Customer Reviews
          </h2>
          {reviews.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        {canReview && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand/90 transition-colors shadow-md shadow-brand/20"
          >
            {showForm ? 'Cancel' : '+ Write a Review'}
          </button>
        )}
        {!canReview && user && (
          <div className="text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 flex items-center gap-2">
            <Star size={14} className="text-gray-300" />
            {reviewEligibilityReason === 'already_reviewed' ? 'Review Posted' : 'Verified Purchase Only'}
          </div>
        )}
      </div>

      {/* Summary Row */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="text-center flex-shrink-0">
            <p className="text-6xl font-black text-amber-500">{avgRating.toFixed(1)}</p>
            <StarDisplay rating={avgRating} size={20} />
            <p className="text-xs text-gray-500 mt-1">{reviews.length} ratings</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingCounts.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={reviews.length} />
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mb-8 bg-white border-2 border-brand/20 rounded-2xl p-6 space-y-5 overflow-hidden"
          >
            <h3 className="font-bold text-gray-900 text-lg">Your Review</h3>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Rating *</label>
              <StarPicker value={rating} onChange={setRating} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Review *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Share your experience with this product..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand focus:border-transparent outline-none resize-none"
              />
              <p className="text-xs text-gray-400">{body.length}/1000 characters</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand/90 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Star size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No reviews yet</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand to-green-400 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {review.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{review.user_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StarDisplay rating={review.rating} size={14} />
                  {(review.user_id === user?.id || user?.role === 'admin') && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="font-bold text-gray-900">{review.title}</p>
                <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">{review.body}</p>
              </div>

              {/* Verified badge for high ratings */}
              {review.rating >= 4 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <ThumbsUp size={12} /> Verified Purchase
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
