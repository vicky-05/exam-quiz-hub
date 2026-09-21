import {
  CheckCircle2,
  Circle,
  Flag,
  ListChecks,
} from "lucide-react";

function QuestionPalette({
  totalQuestions,
  currentQuestionIndex,
  questionStatuses = {},
  onQuestionSelect,
}) {
  const getStatus = (index) =>
    questionStatuses[index] || "notVisited";

  const getStatusClass = (status, isCurrent) => {
    const base =
      "relative flex h-8 w-full items-center justify-center rounded-lg border text-[10px] font-black tabular-nums transition-all duration-150 active:scale-95";

    if (isCurrent) {
      return `${base} border-2 border-[#009FE3] bg-[#EAF6FD] text-[#003B82] shadow-[0_0_0_2px_rgba(0,159,227,0.10)] dark:border-[#19B8F2] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2] dark:shadow-[0_0_0_2px_rgba(25,184,242,0.10)]`;
    }

    switch (status) {
      case "answered":
        return `${base} border-[#009FE3] bg-[#009FE3] text-white hover:bg-[#008BC7]`;
      case "notAnswered":
        return `${base} border-[#F6C400]/70 bg-[#FFF8D9] text-[#805F00] hover:bg-[#FFF1A8] dark:border-[#F6C400]/60 dark:bg-[#F6C400]/10 dark:text-[#FFD23F] dark:hover:bg-[#F6C400]/15`;
      case "markedForReview":
      case "answeredAndMarked":
        return `${base} border-[#8B5CF6] bg-[#8B5CF6] text-white hover:bg-[#7C3AED]`;
      default:
        return `${base} border-slate-200 bg-[#F7F9FC] text-slate-500 hover:border-[#009FE3]/50 hover:bg-[#EAF6FD] hover:text-[#003B82] dark:border-[#29425F] dark:bg-[#12243B] dark:text-[#A8B4C5] dark:hover:border-[#19B8F2]/50 dark:hover:bg-[#19B8F2]/10 dark:hover:text-[#19B8F2]`;
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "answered":
        return "Answered";
      case "notAnswered":
        return "Not Answered";
      case "markedForReview":
        return "Marked for Review";
      case "answeredAndMarked":
        return "Answered & Marked";
      default:
        return "Not Visited";
    }
  };

  const statusCounts = {
    answered: 0,
    notAnswered: 0,
    markedForReview: 0,
    answeredAndMarked: 0,
    notVisited: 0,
  };

  for (let i = 0; i < totalQuestions; i += 1) {
    const status = getStatus(i);

    if (statusCounts[status] !== undefined) {
      statusCounts[status] += 1;
    }
  }

  const answeredTotal =
    statusCounts.answered + statusCounts.answeredAndMarked;

  const markedTotal =
    statusCounts.markedForReview + statusCounts.answeredAndMarked;

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-slate-200 bg-white text-[#10233F] transition-colors duration-200 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:text-white lg:w-[300px] xl:w-[320px]">
      {/* Compact Header */}
      <div className="shrink-0 border-b border-slate-200 px-3 py-2.5 dark:border-[#243A55]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EAF6FD] text-[#003B82] dark:bg-[#16345C] dark:text-[#19B8F2]">
              <ListChecks size={15} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-[13px] font-black text-[#001F4F] dark:text-white">
                Question Palette
              </h2>
              <p className="text-[8px] font-semibold text-slate-500 dark:text-[#A8B4C5]">
                Navigate your test
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-lg border border-slate-200 bg-[#F7F9FC] px-2.5 py-1.5 text-[10px] font-black text-[#001F4F] dark:border-[#29425F] dark:bg-[#12243B] dark:text-white">
            {currentQuestionIndex + 1}
            <span className="mx-1 text-slate-400 dark:text-[#64748B]">/</span>
            {totalQuestions}
          </div>
        </div>
      </div>

      {/* Compact Status Summary */}
      <div className="shrink-0 border-b border-slate-200 px-3 py-2 dark:border-[#243A55]">
        <div className="grid grid-cols-4 gap-1.5">
          <PaletteStat
            icon={<CheckCircle2 size={10} />}
            value={answeredTotal}
            label="Answered"
            className="bg-[#EAF6FD] text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]"
          />

          <PaletteStat
            icon={<Circle size={10} />}
            value={statusCounts.notAnswered}
            label="Pending"
            className="bg-[#FFF8D9] text-[#805F00] dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]"
          />

          <PaletteStat
            icon={<Flag size={10} />}
            value={markedTotal}
            label="Marked"
            className="bg-purple-50 text-purple-700 dark:bg-[#8B5CF6]/15 dark:text-[#B79AFF]"
          />

          <PaletteStat
            icon={<Circle size={10} />}
            value={statusCounts.notVisited}
            label="Unvisited"
            className="bg-slate-100 text-slate-500 dark:bg-[#12243B] dark:text-[#A8B4C5]"
          />
        </div>
      </div>

      {/* Question Numbers
          No additional headings, progress bars, ranges, or instructions.
          This keeps maximum space available for the palette. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <div className="grid grid-cols-8 gap-1.5 pb-1">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const status = getStatus(index);
            const isCurrent = index === currentQuestionIndex;
            const isMarked =
              status === "markedForReview" ||
              status === "answeredAndMarked";

            return (
              <button
                key={index}
                type="button"
                onClick={() => onQuestionSelect?.(index)}
                title={`Question ${index + 1} — ${statusLabel(status)}`}
                aria-label={`Question ${index + 1}, ${statusLabel(status)}`}
                aria-current={isCurrent ? "step" : undefined}
                className={getStatusClass(status, isCurrent)}
              >
                {index + 1}

                {isMarked && (
                  <span className="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-[#F6C400] text-[#001F4F]">
                    <Flag size={6} fill="currentColor" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimal Legend */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2 dark:border-[#243A55] dark:bg-[#0D1B2E]">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <LegendItem indicator="bg-[#009FE3]" label="Answered" />
          <LegendItem indicator="bg-[#F6C400]" label="Pending" />
          <LegendItem indicator="bg-slate-300 dark:bg-white" label="Not Visited" />
          <LegendItem indicator="bg-[#8B5CF6]" label="Marked" />
        </div>
      </div>
    </aside>
  );
}

function PaletteStat({ icon, value, label, className }) {
  return (
    <div
      className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-1.5 ${className}`}
      title={`${value} ${label}`}
    >
      <span className="shrink-0 opacity-90">{icon}</span>

      <div className="min-w-0 text-center">
        <p className="text-[11px] font-black leading-none tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 truncate text-[6px] font-black uppercase tracking-[0.04em] opacity-70">
          {label}
        </p>
      </div>
    </div>
  );
}

function LegendItem({ indicator, label }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${indicator}`}
      />
      <span className="truncate text-[8px] font-bold text-slate-500 dark:text-[#A8B4C5]">
        {label}
      </span>
    </div>
  );
}

export default QuestionPalette;
