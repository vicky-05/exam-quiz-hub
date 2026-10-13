import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageSquareQuote,
  Star,
  LoaderCircle,
  MessageCircle,
} from "lucide-react";
import { supabase } from "../services/supabase";

function StarRating({ rating, size = 16 }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300 dark:text-slate-600"
          }
        />
      ))}
    </div>
  );
}

function formatReviewDate(date) {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function AspirantReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      setLoading(true);
      setLoadError(false);

      try {
        const { data, error } = await supabase
          .from("aspirant_reviews")
          .select("id, user_id, rating, review_text, exam_name, created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) throw error;

        if (!cancelled) {
          setReviews(data || []);
        }
      } catch (error) {
        console.error("Unable to load aspirant reviews:", error);

        if (!cancelled) {
          setLoadError(true);
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((total, review) => total + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <section
      id="aspirant-reviews"
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-blue-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">
            <MessageSquareQuote size={15} />
            Aspirant Reviews
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Experiences from Our{" "}
            <span className="text-blue-600 dark:text-sky-400">
              Aspirant Community
            </span>
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            Read feedback from aspirants using Exam Quiz Hub
            for their competitive exam preparation.
          </p>
        </div>

        {/* Rating summary */}
        {!loading && !loadError && reviews.length > 0 && (
          <div className="mx-auto mt-8 flex w-fit items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-center">
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {averageRating}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                out of 5
              </p>
            </div>

            <div className="border-l border-slate-200 pl-4 dark:border-slate-700">
              <StarRating rating={Math.round(Number(averageRating))} size={18} />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Based on {reviews.length} approved{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <LoaderCircle
              size={30}
              className="animate-spin text-blue-600 dark:text-sky-400"
            />
          </div>
        )}

        {/* Error */}
        {!loading && loadError && (
          <div
            role="status"
            className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Reviews are temporarily unavailable. Please try again later.
            </p>
          </div>
        )}

        {/* Review cards */}
        {!loading && !loadError && reviews.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <StarRating rating={review.rating} />

                  <MessageSquareQuote
                    size={23}
                    className="shrink-0 text-blue-100 transition group-hover:text-blue-200 dark:text-slate-700 dark:group-hover:text-sky-900"
                  />
                </div>

                <p className="mt-5 flex-1 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-300">
                  “{review.review_text}”
                </p>

                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-sky-400 text-sm font-black text-white">
                      A
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Exam Aspirant
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {review.exam_name || "Competitive Exam Preparation"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    {formatReviewDate(review.created_at)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !loadError && reviews.length === 0 && (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-sky-400/10 dark:text-sky-300">
              <MessageCircle size={23} />
            </div>

            <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">
              Be the First to Share Your Experience
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Your honest feedback can help other aspirants
              discover Exam Quiz Hub.
            </p>
          </div>
        )}

        {/* Write a review */}
        <div className="mt-10 text-center">
          <Link
            to="/dashboard/review"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Write Your Review
            <ArrowRight size={17} />
          </Link>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Reviews are displayed after admin approval.
          </p>
        </div>
      </div>
    </section>
  );
}