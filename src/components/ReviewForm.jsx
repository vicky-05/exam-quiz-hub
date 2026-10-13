
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

const examOptions = [
  "TNPSC Group 1",
  "TNPSC Group 2",
  "TNPSC Group 4",
  "RRB NTPC",
  "RRB Group D",
  "TNUSRB SI",
  "Other",
];

const initialForm = {
  rating: 0,
  reviewText: "",
  examName: "",
};

function getReviewError(error) {
  if (error?.code === "42501") {
    return "Your review could not be saved because of a database permission issue. Please contact support.";
  }

  if (error?.code === "23505") {
    return "You have already submitted a review. Refresh the page to check its status.";
  }

  if (error?.code === "23503") {
    return "Your account could not be verified. Please sign in again.";
  }

  return error?.message || "Unable to submit your review. Please try again.";
}

export default function ReviewForm() {
  const { user } = useAuth();

  const [rating, setRating] = useState(initialForm.rating);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState(initialForm.reviewText);
  const [examName, setExamName] = useState(initialForm.examName);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadExistingReview = useCallback(async () => {
    if (!user?.id) {
      setExistingReview(null);
      setChecking(false);
      return;
    }

    setChecking(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("aspirant_reviews")
        .select("id, rating, review_text, exam_name, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      setExistingReview(data);

      if (data) {
        setRating(data.rating);
        setReviewText(data.review_text);
        setExamName(data.exam_name || "");
      } else {
        setRating(0);
        setReviewText("");
        setExamName("");
      }
    } catch (error) {
      console.error("Unable to load your review:", error);
      setErrorMessage(
        "Unable to check your review status. Please refresh and try again."
      );
    } finally {
      setChecking(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.id) {
        setExistingReview(null);
        setChecking(false);
        return;
      }

      setChecking(true);
      setErrorMessage("");

      try {
        const { data, error } = await supabase
          .from("aspirant_reviews")
          .select("id, rating, review_text, exam_name, status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (cancelled) return;

        setExistingReview(data);

        if (data) {
          setRating(data.rating);
          setReviewText(data.review_text);
          setExamName(data.exam_name || "");
        }
      } catch (error) {
        console.error("Unable to load your review:", error);

        if (!cancelled) {
          setErrorMessage(
            "Unable to check your review status. Please refresh and try again."
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!user?.id) {
      setErrorMessage("Please sign in to submit your review.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setErrorMessage("Please select a star rating.");
      return;
    }

    const cleanText = reviewText.trim();

    if (cleanText.length < 10 || cleanText.length > 1000) {
      setErrorMessage(
        "Your review must contain between 10 and 1000 characters."
      );
      return;
    }

    if (
      existingReview?.status === "approved" ||
      existingReview?.status === "rejected"
    ) {
      setErrorMessage(
        "Your review has already been processed. Please contact support if you need help."
      );
      return;
    }

    setLoading(true);

    try {
      // Confirm the current Supabase session before writing.
      const {
        data: { user: authenticatedUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authenticatedUser?.id || authenticatedUser.id !== user.id) {
        throw new Error(
          "Your sign-in session has expired. Please sign in again."
        );
      }

      const reviewData = {
        user_id: authenticatedUser.id,
        rating,
        review_text: cleanText,
        exam_name: examName || null,
        status: "pending",
        updated_at: new Date().toISOString(),
      };

      if (existingReview?.id) {
        // Editing an existing pending review.
        const { data, error } = await supabase
          .from("aspirant_reviews")
          .update({
            rating: reviewData.rating,
            review_text: reviewData.review_text,
            exam_name: reviewData.exam_name,
            updated_at: reviewData.updated_at,
          })
          .eq("id", existingReview.id)
          .eq("user_id", authenticatedUser.id)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          throw new Error(
            "Your pending review could not be updated. Refresh and try again."
          );
        }

        setExistingReview({
          ...existingReview,
          ...reviewData,
        });

        setMessage(
          "Your review has been updated and is awaiting admin approval."
        );
      } else {
        // Insert without returning the pending row.
        // This avoids requiring SELECT permission in the INSERT request.
        const { error } = await supabase
          .from("aspirant_reviews")
          .insert(reviewData);

        if (error) throw error;

        setExistingReview({
          id: null,
          ...reviewData,
        });

        setMessage(
          "Thank you! Your review has been submitted and is awaiting admin approval."
        );
      }
    } catch (error) {
      console.error("Review submission failed:", error);
      setErrorMessage(getReviewError(error));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex justify-center py-10">
        <LoaderCircle
          className="animate-spin text-blue-600"
          size={28}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
          Share Your Experience
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to rate Exam Quiz Hub and share your feedback.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          Sign In to Review
        </Link>
      </div>
    );
  }

  if (existingReview?.status === "approved") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 dark:border-emerald-900 dark:bg-slate-900">
        <CheckCircle2 className="text-emerald-600" size={28} />
        <h3 className="mt-3 font-extrabold text-slate-900 dark:text-white">
          Your review is published
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Thank you for helping other aspirants!
        </p>
      </div>
    );
  }

  if (existingReview?.status === "rejected") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-extrabold text-slate-900 dark:text-white">
          Your previous review was rejected
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Please contact support if you need help with your review.
        </p>
      </div>
    );
  }

  const pendingReview = existingReview?.status === "pending";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7"
    >
      <h3 className="text-xl font-black text-slate-900 dark:text-white">
        {pendingReview ? "Update Your Review" : "Write a Review"}
      </h3>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Tell other aspirants about your experience with Exam Quiz Hub.
      </p>

      {pendingReview && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Your review is awaiting admin approval. You can edit it while it is pending.
        </p>
      )}

      <div className="mt-6">
        <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Your Rating
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} out of 5 stars`}
              aria-pressed={rating === value}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              onFocus={() => setHoverRating(value)}
              onBlur={() => setHoverRating(0)}
              onClick={() => setRating(value)}
              className="rounded-md p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Star
                size={30}
                className={
                  value <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-slate-600"
                }
              />
            </button>
          ))}

          <span className="ml-2 text-sm font-bold text-slate-600 dark:text-slate-400">
            {rating ? `${rating}/5` : "Select rating"}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="review-exam"
          className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200"
        >
          Exam Preparation
        </label>

        <select
          id="review-exam"
          value={examName}
          onChange={(event) => setExamName(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="">Select your exam (optional)</option>
          {examOptions.map((exam) => (
            <option key={exam} value={exam}>
              {exam}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label
            htmlFor="review-text"
            className="text-sm font-bold text-slate-800 dark:text-slate-200"
          >
            Your Feedback
          </label>
          <span className="text-xs text-slate-500">
            {reviewText.length}/1000
          </span>
        </div>

        <textarea
          id="review-text"
          value={reviewText}
          onChange={(event) =>
            setReviewText(event.target.value.slice(0, 1000))
          }
          rows={5}
          minLength={10}
          maxLength={1000}
          required
          placeholder="What do you like about the practice sets, tests, or study experience?"
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
        >
          {errorMessage}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading && (
          <LoaderCircle size={17} className="animate-spin" />
        )}
        {loading
          ? "Submitting..."
          : pendingReview
            ? "Update Review"
            : "Submit Review"}
      </button>

      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Reviews are checked by our admin before being displayed publicly.
        Please submit honest feedback and avoid sharing personal information.
      </p>
    </form>
  );
}
