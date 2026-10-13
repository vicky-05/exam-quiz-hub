
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  LoaderCircle,
  RefreshCw,
  Star,
  XCircle,
} from "lucide-react";

import { supabase } from "../../services/supabase";

export default function AdminAspirantReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let query = supabase
        .from("aspirant_reviews")
        .select(
          "id, user_id, rating, review_text, exam_name, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const userIds = [...new Set((data ?? []).map((r) => r.user_id))];
      let profilesById = {};

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profileError) throw profileError;

        profilesById = Object.fromEntries(
          (profiles ?? []).map((profile) => [
            profile.id,
            profile,
          ])
        );
      }

      setReviews(
        (data ?? []).map((review) => ({
          ...review,
          profile: profilesById[review.user_id] ?? null,
        }))
      );
    } catch (err) {
      console.error("Unable to load aspirant reviews:", err);
      setError(err.message || "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function moderateReview(review, status) {
    const action = status === "approved" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} this review?`
      )
    ) {
      return;
    }

    setProcessingId(review.id);
    setError("");
    setMessage("");

    try {
      const { data, error: updateError } = await supabase
        .from("aspirant_reviews")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", review.id)
        .eq("status", review.status)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;

      if (!data) {
        throw new Error(
          "The review was not updated. Refresh the list and try again."
        );
      }

      setMessage(
        status === "approved"
          ? "Review approved and published successfully."
          : "Review rejected successfully."
      );

      await loadReviews();
    } catch (err) {
      console.error("Unable to moderate review:", err);
      setError(err.message || "Unable to update this review.");
    } finally {
      setProcessingId(null);
    }
  }

  const pendingCount = reviews.filter(
    (review) => review.status === "pending"
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Aspirant Reviews
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review feedback before publishing it on Exam Quiz Hub.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReviews}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "all", label: "All Reviews" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              filter === option.value
                ? "bg-blue-700 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <LoaderCircle className="animate-spin text-blue-700" size={30} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <Clock className="mx-auto text-slate-400" size={36} />
          <h2 className="mt-4 text-lg font-bold text-slate-800">
            No reviews found
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Reviews matching this filter will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const busy = processingId === review.id;

            return (
              <article
                key={review.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0">
                    <h2 className="break-words font-bold text-slate-900">
                      {review.profile?.full_name ||
                        review.profile?.email ||
                        "Aspirant"}
                    </h2>

                    {review.profile?.email && (
                      <p className="mt-1 break-all text-sm text-slate-500">
                        {review.profile.email}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={17}
                          className={
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }
                        />
                      ))}
                      <span className="ml-1 text-sm font-bold text-slate-700">
                        {review.rating}/5
                      </span>
                    </div>

                    {review.exam_name && (
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-semibold">Exam:</span>{" "}
                        {review.exam_name}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-start">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        review.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : review.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {review.status}
                    </span>
                  </div>
                </div>

                <p className="mt-5 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {review.review_text}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Submitted:{" "}
                  {new Date(review.created_at).toLocaleString("en-IN")}
                </p>

                {review.status !== "approved" &&
                  review.status !== "rejected" && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          moderateReview(review, "approved")
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {busy ? (
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Approve & Publish
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          moderateReview(review, "rejected")
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}

      {!loading && filter === "pending" && (
        <p className="text-sm text-slate-500">
          {pendingCount} pending review(s) in this view.
        </p>
      )}
    </div>
  );
}
