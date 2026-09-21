import { Image as ImageIcon, Sparkles } from "lucide-react";
import AnswerOptions from "./AnswerOptions";

function QuestionPanel({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
  fontSize = "medium",
}) {
  if (!question) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center bg-[#F7F9FC] dark:bg-[#07111F]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 text-center shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E]">
          <p className="text-sm font-bold text-[#64748B] dark:text-[#A8B4C5]">
            Question not available.
          </p>
        </div>
      </section>
    );
  }

  const questionTextSize = {
    small: "text-[14px]",
    medium: "text-[16px]",
    large: "text-[18px]",
  };

  const questionSize =
    questionTextSize[fontSize] || questionTextSize.medium;

  const questionType =
    question.type === "multiple"
      ? "Multiple Choice"
      : question.type === "numerical"
        ? "Numerical Answer"
        : "MCQ Single";

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F7F9FC] dark:bg-[#07111F]">
      {/* Compact Question Header */}
      <div className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-2.5 dark:border-[#243A55] dark:bg-[#0D1B2E] sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-lg bg-[#001F4F] px-2.5 py-1.5 text-[10px] font-black uppercase text-white dark:bg-[#16345C]">
              Question
            </span>

            <span className="text-sm font-black tabular-nums text-[#001F4F] dark:text-white">
              {questionNumber}
            </span>

            <span className="hidden h-4 w-px bg-[#E2E8F0] dark:bg-[#243A55] sm:block" />

            <span className="truncate rounded-lg bg-[#EAF6FD] px-2.5 py-1.5 text-[10px] font-black text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
              {questionType}
            </span>
          </div>

          {question.image && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F7F9FC] px-2 py-1.5 text-[10px] font-bold text-[#64748B] dark:border-[#243A55] dark:bg-[#12243B] dark:text-[#A8B4C5]">
              <ImageIcon size={13} />
              <span className="hidden sm:inline">Diagram</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Question Area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-5 lg:px-7">
          {/* Question Card */}
          <div className="relative rounded-2xl border border-[#D9E3EE] bg-white px-4 py-4 shadow-[0_3px_14px_rgba(15,35,63,0.035)] dark:border-[#29425F] dark:bg-[#0D1B2E] dark:shadow-none sm:px-5 sm:py-4">
            <div className="absolute left-0 top-0 h-1 w-20 rounded-br-full bg-[#F6C400] dark:bg-[#FFD23F]" />

            <div className="mb-2 flex items-center gap-2">
              <Sparkles
                size={13}
                className="text-[#F0A000] dark:text-[#FFAA1F]"
              />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#64748B] dark:text-[#A8B4C5]">
                Question
              </span>
            </div>

            <div
              className={`font-semibold leading-7 text-[#10233F] dark:text-[#F8FAFC] ${questionSize}`}
            >
              {question.question}
            </div>
          </div>

          {/* Diagram */}
          {question.image && (
            <div className="mt-3 flex max-h-[190px] items-center justify-center overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-2.5 dark:border-[#243A55] dark:bg-[#0D1B2E]">
              <img
                src={question.image}
                alt="Question diagram"
                className="max-h-[165px] max-w-full object-contain"
              />
            </div>
          )}

          {/* Answers */}
          <div className="mt-4">
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-[#64748B] dark:text-[#A8B4C5]">
                  Answer Options
                </h3>

                <p className="mt-0.5 text-[9px] font-medium text-[#94A3B8]">
                  {question.type === "multiple"
                    ? "Select all applicable answers."
                    : question.type === "numerical"
                      ? "Enter the numerical value."
                      : "Select one answer."}
                </p>
              </div>

              {question.options?.length > 0 && (
                <span className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-[9px] font-black text-[#64748B] dark:border-[#243A55] dark:bg-[#12243B] dark:text-[#A8B4C5]">
                  {question.options.length} options
                </span>
              )}
            </div>

            <div
              className={
                question.type === "single" || !question.type
                  ? "[&>div]:grid [&>div]:grid-cols-1 [&>div]:gap-2.5 sm:[&>div]:grid-cols-2"
                  : ""
              }
            >
              <AnswerOptions
                question={question}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={onAnswerSelect}
                fontSize={fontSize}
              />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

export default QuestionPanel;
