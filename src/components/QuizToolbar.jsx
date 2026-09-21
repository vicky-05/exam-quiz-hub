import { Minus, Plus, Type, CircleHelp, Award, MinusCircle } from "lucide-react";

function QuizToolbar({
  currentQuestion,
  totalQuestions,
  questionType = "MCQ Single",
  marks = 4,
  negativeMarks = 1,
  fontSize = "medium",
  onFontSizeChange,
}) {
  const fontSizes = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  const currentFontSize = fontSizes[fontSize] || fontSizes.medium;

  const progress =
    totalQuestions > 0
      ? Math.min(100, Math.max(0, (currentQuestion / totalQuestions) * 100))
      : 0;

  const decreaseFont = () => {
    if (fontSize === "large") {
      onFontSizeChange?.("medium");
    } else if (fontSize === "medium") {
      onFontSizeChange?.("small");
    }
  };

  const increaseFont = () => {
    if (fontSize === "small") {
      onFontSizeChange?.("medium");
    } else if (fontSize === "medium") {
      onFontSizeChange?.("large");
    }
  };

  return (
    <div className="relative shrink-0 border-b border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E]">
      <div className="mx-auto flex min-h-[58px] w-full max-w-[1600px] items-center justify-between gap-3 px-3 py-2.5 sm:px-5 lg:px-7">
        {/* Question Progress */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#001F4F] text-white shadow-sm dark:bg-[#16345C]">
              <CircleHelp size={17} strokeWidth={2.4} />
            </div>

            <div className="leading-none">
              <p className="hidden text-[9px] font-black uppercase tracking-[0.16em] text-[#64748B] dark:text-[#A8B4C5] sm:block">
                Question
              </p>

              <p className="mt-0.5 text-sm font-black tabular-nums text-[#001F4F] dark:text-white sm:text-base">
                {currentQuestion}
                <span className="mx-1 text-[#94A3B8]">/</span>
                {totalQuestions}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="hidden w-28 md:block lg:w-40">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#243A55]">
              <div
                className="h-full rounded-full bg-[#009FE3] transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-[9px] font-bold text-[#64748B] dark:text-[#A8B4C5]">
              {Math.round(progress)}% progress
            </p>
          </div>

          <div className="hidden h-7 w-px bg-[#E2E8F0] dark:bg-[#243A55] sm:block" />

          {/* Question Type */}
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#64748B] dark:text-[#A8B4C5]">
              Type
            </span>
            <span className="rounded-lg border border-[#009FE3]/20 bg-[#EAF6FD] px-2.5 py-1.5 text-[11px] font-black text-[#003B82] dark:border-[#19B8F2]/25 dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
              {questionType}
            </span>
          </div>

          <div className="hidden h-7 w-px bg-[#E2E8F0] dark:bg-[#243A55] sm:block" />

          {/* Marking Scheme */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-lg bg-[#F0FBF5] px-2 py-1.5 dark:bg-[#19B8F2]/5">
              <Award size={13} className="text-[#009FE3]" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-[#003B82] dark:text-[#19B8F2] sm:text-[11px]">
                +{marks}
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1.5 dark:bg-red-400/10">
              <MinusCircle size={13} className="text-red-500" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-red-600 dark:text-red-300 sm:text-[11px]">
                −{negativeMarks}
              </span>
            </div>
          </div>
        </div>

        {/* Text Size Controls */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] p-1 dark:border-[#243A55] dark:bg-[#12243B]">
          <div className="hidden items-center gap-1 px-1.5 text-[#64748B] dark:text-[#A8B4C5] sm:flex">
            <Type size={14} strokeWidth={2.3} />
            <span className="text-[10px] font-black uppercase tracking-[0.12em]">
              Text
            </span>
          </div>

          <button
            type="button"
            onClick={decreaseFont}
            disabled={fontSize === "small"}
            aria-label="Decrease question font size"
            className="grid h-8 w-8 place-items-center rounded-lg border border-transparent bg-white text-[#001F4F] transition hover:border-[#009FE3]/20 hover:bg-[#EAF6FD] hover:text-[#003B82] disabled:cursor-not-allowed disabled:opacity-35 dark:bg-[#0D1B2E] dark:text-white dark:hover:bg-[#19B8F2]/10 dark:hover:text-[#19B8F2]"
          >
            <Minus size={15} strokeWidth={2.6} />
          </button>

          <span
            className={`grid h-8 min-w-8 place-items-center rounded-lg border border-[#F6C400]/40 bg-[#FFF8D9] px-2 font-black text-[#805F00] dark:border-[#FFD23F]/30 dark:bg-[#FFD23F]/10 dark:text-[#FFD23F] ${currentFontSize}`}
            aria-label={`Current font size: ${fontSize}`}
          >
            A
          </span>

          <button
            type="button"
            onClick={increaseFont}
            disabled={fontSize === "large"}
            aria-label="Increase question font size"
            className="grid h-8 w-8 place-items-center rounded-lg border border-transparent bg-white text-[#001F4F] transition hover:border-[#009FE3]/20 hover:bg-[#EAF6FD] hover:text-[#003B82] disabled:cursor-not-allowed disabled:opacity-35 dark:bg-[#0D1B2E] dark:text-white dark:hover:bg-[#19B8F2]/10 dark:hover:text-[#19B8F2]"
          >
            <Plus size={15} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizToolbar;
