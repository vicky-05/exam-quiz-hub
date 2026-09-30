import { useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { supabase } from "../services/supabase";

const REPORT_REASONS = [
  "Incorrect answer",
  "Question is incorrect",
  "Multiple options are correct",
  "Question is unclear",
  "Typo / spelling mistake",
  "Other",
];

function ReportQuestionModal({
  open,
  onClose,
  question,
  testId,
  userId,
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (submitting) return;

    setReason("");
    setDescription("");
    setError("");
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason) {
      setError("Please select a reason.");
      return;
    }

    if (!question?.id || !testId || !userId) {
      setError("Unable to identify this question. Please try again.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const { error: insertError } = await supabase
        .from("question_reports")
        .insert({
          question_id: String(question.id),
          test_id: String(testId),
          user_id: userId,
          reason,
          description: description.trim() || null,
          status: "pending",
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Failed to submit question report:", err);

      setError(
        err?.message ||
          "Unable to submit the report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          handleClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#243A55] dark:bg-[#0D1B2E]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-question-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-5 py-4 dark:border-[#243A55]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
              <AlertTriangle size={19} />
            </div>

            <div>
              <h2
                id="report-question-title"
                className="text-base font-black text-[#10233F] dark:text-white"
              >
                Report Question
              </h2>

              <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-[#A8B4C5]">
                Found something wrong with this question? Tell us what needs
                to be checked.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#12243B] dark:hover:text-white"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {success ? (
          /* Success */
          <div className="px-5 py-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
              <CheckCircle2 size={28} />
            </div>

            <h3 className="mt-4 text-lg font-black text-[#10233F] dark:text-white">
              Report Submitted
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
              Thank you for helping us improve the question bank. Our admin
              team will review this question.
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="mt-6 rounded-xl bg-[#003B82] px-6 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#002F68] dark:bg-[#19B8F2] dark:text-[#07111F]"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit}>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
              {/* Question preview */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC] p-4 dark:border-[#243A55] dark:bg-[#0B1728]">
                <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#009FE3] dark:text-[#19B8F2]">
                  Question
                </p>

                <p className="line-clamp-4 text-sm font-semibold leading-6 text-[#10233F] dark:text-white">
                  {question?.question ||
                    question?.q ||
                    question?.text ||
                    "Question"}
                </p>
              </div>

              {/* Reason */}
              <div className="mt-5">
                <label className="text-xs font-black text-[#10233F] dark:text-white">
                  What is wrong?
                </label>

                <div className="mt-3 space-y-2">
                  {REPORT_REASONS.map((item) => (
                    <label
                      key={item}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                        reason === item
                          ? "border-[#009FE3] bg-[#EAF6FD] dark:border-[#19B8F2] dark:bg-[#19B8F2]/10"
                          : "border-[#E2E8F0] hover:border-[#B8DDF0] hover:bg-[#F7F9FC] dark:border-[#243A55] dark:hover:bg-[#12243B]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="question-report-reason"
                        value={item}
                        checked={reason === item}
                        onChange={(event) =>
                          setReason(event.target.value)
                        }
                        className="h-4 w-4 accent-[#009FE3]"
                      />

                      <span className="text-xs font-bold text-[#10233F] dark:text-[#D8E1EC]">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mt-5">
                <label
                  htmlFor="question-report-description"
                  className="text-xs font-black text-[#10233F] dark:text-white"
                >
                  Additional details
                  <span className="ml-1 font-semibold text-slate-400">
                    (optional)
                  </span>
                </label>

                <textarea
                  id="question-report-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  maxLength={1000}
                  placeholder="Explain what you think is wrong..."
                  className="mt-2 w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-3 text-xs font-medium leading-5 text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#0B1728] dark:text-white dark:placeholder:text-[#718096] dark:focus:border-[#19B8F2]"
                />

                <div className="mt-1 text-right text-[9px] font-semibold text-slate-400">
                  {description.length}/1000
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-[#E2E8F0] px-5 py-4 dark:border-[#243A55]">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="rounded-xl px-4 py-2.5 text-xs font-black text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#A8B4C5] dark:hover:bg-[#12243B]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || !reason}
                className="rounded-xl bg-[#003B82] px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#002F68] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#19B8F2] dark:text-[#07111F]"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportQuestionModal;