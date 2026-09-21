import {
  ArrowLeft,
  ArrowRight,
  Eraser,
  Flag,
  Save,
} from "lucide-react";

function QuizFooter({
  currentQuestionIndex,
  totalQuestions,
  hasAnswer,
  isMarkedForReview,
  onPrevious,
  onClearResponse,
  onMarkForReview,
  onSaveAndNext,
}) {
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <footer className="sticky bottom-0 z-40 shrink-0 border-t border-slate-200 bg-white/98 text-[#10233F] shadow-[0_-6px_20px_rgba(16,35,63,0.08)] backdrop-blur transition-colors duration-200 dark:border-[#243A55] dark:bg-[#0D1B2E]/98 dark:text-white dark:shadow-[0_-6px_20px_rgba(0,0,0,0.16)]">
      <div className="mx-auto flex min-h-[58px] max-w-[1600px] items-center justify-between gap-2 px-3 py-2 sm:px-5 lg:px-6">
        {/* Left Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Previous */}
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirstQuestion}
            aria-label="Previous question"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-[#F7F9FC] px-2.5 text-[11px] font-black text-slate-600 transition hover:border-[#009FE3]/50 hover:bg-[#EAF6FD] hover:text-[#003B82] disabled:cursor-not-allowed disabled:opacity-35 sm:px-3.5 dark:border-[#29425F] dark:bg-[#12243B] dark:text-[#D7E0EA] dark:hover:border-[#19B8F2]/50 dark:hover:bg-[#19B8F2]/10 dark:hover:text-[#003B82] dark:text-[#19B8F2]"
          >
            <ArrowLeft size={15} strokeWidth={2.7} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Clear Response */}
          <button
            type="button"
            onClick={onClearResponse}
            disabled={!hasAnswer}
            aria-label="Clear response"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-[#F7F9FC] px-2.5 text-[11px] font-black text-slate-500 transition hover:border-red-400/40 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35 sm:px-3.5 dark:border-[#29425F] dark:bg-[#12243B] dark:text-[#A8B4C5] dark:hover:bg-red-400/10 dark:hover:text-red-300"
          >
            <Eraser size={14} />
            <span className="hidden md:inline">Clear Response</span>
          </button>
        </div>

        {/* Center Question Indicator */}
        <div className="hidden items-center rounded-lg border border-slate-200 bg-[#F7F9FC] px-3 py-1.5 sm:flex dark:border-[#29425F] dark:bg-[#12243B]">
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-[#64748B]">
            Question
          </span>
          <span className="mx-1.5 text-[11px] font-black text-[#003B82] dark:text-[#19B8F2]">
            {currentQuestionIndex + 1}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-[#64748B]">
            / {totalQuestions}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mark for Review */}
          <button
            type="button"
            onClick={onMarkForReview}
            aria-pressed={isMarkedForReview}
            aria-label={
              isMarkedForReview
                ? "Remove mark for review"
                : "Mark for review"
            }
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-black transition sm:px-3.5 ${
              isMarkedForReview
                ? "border-[#F6C400]/70 bg-[#FFF8D9] text-[#805F00] hover:bg-[#FFF1A8] dark:border-[#F6C400]/50 dark:bg-[#F6C400]/10 dark:text-[#FFD23F] dark:hover:bg-[#F6C400]/15"
                : "border-slate-200 bg-[#F7F9FC] text-slate-500 hover:border-[#8B5CF6]/50 hover:bg-purple-50 hover:text-purple-700 dark:border-[#29425F] dark:bg-[#12243B] dark:text-[#A8B4C5] dark:hover:bg-[#8B5CF6]/10 dark:hover:text-[#B79AFF]"
            }`}
          >
            <Flag
              size={14}
              fill={isMarkedForReview ? "currentColor" : "none"}
            />
            <span className="hidden lg:inline">
              {isMarkedForReview
                ? "Marked for Review"
                : "Mark for Review"}
            </span>
          </button>

          {/* Save & Next */}
          <button
            type="button"
            onClick={onSaveAndNext}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#009FE3] px-3 text-[11px] font-black text-white shadow-[0_3px_10px_rgba(0,159,227,0.20)] transition hover:bg-[#008BC7] hover:shadow-[0_4px_14px_rgba(0,159,227,0.28)] sm:px-4"
          >
            <Save size={14} strokeWidth={2.7} />

            <span>
              {isLastQuestion ? "Save" : "Save & Next"}
            </span>

            {!isLastQuestion && (
              <ArrowRight size={14} strokeWidth={2.7} />
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}

export default QuizFooter;
