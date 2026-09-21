import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  X,
} from "lucide-react";

function SubmitModal({
  isOpen,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedCount,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  const completion =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020B18]/75 px-4 py-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-test-title"
    >
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#29425F] bg-[#0D1B2E] text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        {/* Header */}
        <div className="border-b border-[#243A55] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFD23F]/10 text-[#FFD23F]">
                <AlertTriangle size={19} />
              </div>

              <div>
                <h2
                  id="submit-test-title"
                  className="text-base font-black text-white"
                >
                  Submit Test?
                </h2>

                <p className="mt-0.5 text-[10px] font-semibold text-[#A8B4C5]">
                  Review your test before final submission.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              aria-label="Close submission dialog"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#64748B] transition hover:bg-[#12243B] hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5 sm:px-6">
          <p className="text-sm leading-6 text-[#D7E0EA]">
            Are you sure you want to submit this test? After submission,
            your answers cannot be changed.
          </p>

          {/* Completion */}
          <div className="mt-4 rounded-xl border border-[#29425F] bg-[#12243B] p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#A8B4C5]">
                Attempted
              </span>

              <span className="text-xs font-black text-[#19B8F2]">
                {completion}%
              </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#243A55]">
              <div
                className="h-full rounded-full bg-[#19B8F2] transition-[width]"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatusCard
              icon={<CheckCircle2 size={14} />}
              label="Total Questions"
              value={totalQuestions}
              className="border-[#29425F] bg-[#12243B] text-[#D7E0EA]"
            />

            <StatusCard
              icon={<CheckCircle2 size={14} />}
              label="Answered"
              value={answeredCount}
              className="border-[#19B8F2]/20 bg-[#19B8F2]/10 text-[#19B8F2]"
            />

            <StatusCard
              icon={<AlertTriangle size={14} />}
              label="Unanswered"
              value={unansweredCount}
              className={
                unansweredCount > 0
                  ? "border-[#FFD23F]/20 bg-[#FFD23F]/10 text-[#FFD23F]"
                  : "border-[#29425F] bg-[#12243B] text-[#A8B4C5]"
              }
            />

            <StatusCard
              icon={<Flag size={14} />}
              label="Marked for Review"
              value={markedCount}
              className="border-[#8B5CF6]/20 bg-[#8B5CF6]/10 text-[#B79AFF]"
            />
          </div>

          {/* Warning */}
          {unansweredCount > 0 && (
            <div className="mt-3 flex gap-2.5 rounded-xl border border-[#FFD23F]/25 bg-[#FFD23F]/10 px-3.5 py-3">
              <AlertTriangle
                size={15}
                className="mt-0.5 shrink-0 text-[#FFD23F]"
              />

              <p className="text-[11px] font-semibold leading-5 text-[#DCCB87]">
                You still have{" "}
                <span className="font-black text-[#FFD23F]">
                  {unansweredCount}
                </span>{" "}
                unanswered{" "}
                {unansweredCount === 1 ? "question" : "questions"}.
                You can continue the test and attempt them before submitting.
              </p>
            </div>
          )}

          {unansweredCount === 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#19B8F2]/20 bg-[#19B8F2]/10 px-3.5 py-2.5">
              <CheckCircle2
                size={14}
                className="shrink-0 text-[#19B8F2]"
              />
              <p className="text-[10px] font-bold text-[#A8DDF4]">
                All questions have been answered.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-[#243A55] bg-[#0A1728] px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-[#29425F] bg-[#12243B] px-5 text-sm font-black text-[#D7E0EA] transition hover:border-[#19B8F2]/40 hover:bg-[#19B8F2]/10 hover:text-[#19B8F2]"
          >
            Continue Test
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-lg bg-[#009FE3] px-5 text-sm font-black text-white shadow-[0_3px_12px_rgba(0,159,227,0.20)] transition hover:bg-[#008BC7] hover:shadow-[0_5px_16px_rgba(0,159,227,0.28)]"
          >
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value, className }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-xl border p-2.5 ${className}`}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-black/10">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="truncate text-[9px] font-bold opacity-70">
          {label}
        </p>

        <p className="mt-0.5 text-base font-black leading-none tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

export default SubmitModal;
