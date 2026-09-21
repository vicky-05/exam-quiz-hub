import { Check, Circle, Square } from "lucide-react";

function AnswerOptions({
  question,
  selectedAnswer,
  onAnswerSelect,
  fontSize = "medium",
}) {
  if (!question) return null;

  const type = question.type || "single";

  const optionTextSize = {
    small: "text-sm",
    medium: "text-[15px]",
    large: "text-base",
  };

  const textSize =
    optionTextSize[fontSize] || optionTextSize.medium;

  /*
   * SINGLE CHOICE
   * Example: A, B, C, D — only one answer
   */
  if (type === "single") {
    return (
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = selectedAnswer === index;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onAnswerSelect(index)}
              aria-pressed={isSelected}
              className={`group relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-150 active:scale-[0.995] sm:px-5 ${
                isSelected
                  ? "border-[#009FE3] bg-[#EAF6FD] shadow-[0_6px_20px_rgba(0,159,227,0.08)] dark:border-[#19B8F2] dark:bg-[#19B8F2]/10 dark:shadow-none"
                  : "border-[#E2E8F0] bg-white hover:border-[#009FE3]/40 hover:bg-[#F7FBFE] hover:shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E] dark:hover:border-[#19B8F2]/40 dark:hover:bg-[#12243B]"
              }`}
            >
              {isSelected && (
                <span className="absolute inset-y-0 left-0 w-1 bg-[#009FE3] dark:bg-[#19B8F2]" />
              )}

              {/* Radio */}
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? "border-[#009FE3] dark:border-[#19B8F2]"
                    : "border-[#CBD5E1] group-hover:border-[#009FE3]/60 dark:border-[#52647B] dark:group-hover:border-[#19B8F2]/60"
                }`}
              >
                {isSelected && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#009FE3] dark:bg-[#19B8F2]" />
                )}
              </span>

              {/* Letter */}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                  isSelected
                    ? "bg-[#003B82] text-white dark:bg-[#19B8F2] dark:text-[#07111F]"
                    : "bg-[#F7F9FC] text-[#003B82] group-hover:bg-[#EAF6FD] dark:bg-[#12243B] dark:text-[#A8DDF4] dark:group-hover:bg-[#19B8F2]/10"
                }`}
              >
                {letter}
              </span>

              {/* Text */}
              <span
                className={`pt-0.5 font-medium leading-6 ${textSize} ${
                  isSelected
                    ? "text-[#001F4F] dark:text-[#F8FAFC]"
                    : "text-[#334155] dark:text-[#D7E0EA]"
                }`}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  /*
   * MULTIPLE CHOICE
   * Example: More than one answer can be selected
   */
  if (type === "multiple") {
    const selected = Array.isArray(selectedAnswer)
      ? selectedAnswer
      : [];

    const toggleAnswer = (index) => {
      if (selected.includes(index)) {
        onAnswerSelect(
          selected.filter((item) => item !== index)
        );
      } else {
        onAnswerSelect([...selected, index]);
      }
    };

    return (
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = selected.includes(index);

          return (
            <button
              key={index}
              type="button"
              onClick={() => toggleAnswer(index)}
              aria-pressed={isSelected}
              className={`group relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-150 active:scale-[0.995] sm:px-5 ${
                isSelected
                  ? "border-[#009FE3] bg-[#EAF6FD] shadow-[0_6px_20px_rgba(0,159,227,0.08)] dark:border-[#19B8F2] dark:bg-[#19B8F2]/10 dark:shadow-none"
                  : "border-[#E2E8F0] bg-white hover:border-[#009FE3]/40 hover:bg-[#F7FBFE] hover:shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E] dark:hover:border-[#19B8F2]/40 dark:hover:bg-[#12243B]"
              }`}
            >
              {isSelected && (
                <span className="absolute inset-y-0 left-0 w-1 bg-[#009FE3] dark:bg-[#19B8F2]" />
              )}

              {/* Checkbox */}
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                  isSelected
                    ? "border-[#009FE3] bg-[#009FE3] text-white dark:border-[#19B8F2] dark:bg-[#19B8F2] dark:text-[#07111F]"
                    : "border-[#CBD5E1] bg-white group-hover:border-[#009FE3]/60 dark:border-[#52647B] dark:bg-transparent dark:group-hover:border-[#19B8F2]/60"
                }`}
              >
                {isSelected ? (
                  <Check size={13} strokeWidth={3.2} />
                ) : (
                  <Square size={9} className="opacity-0" />
                )}
              </span>

              {/* Letter */}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                  isSelected
                    ? "bg-[#003B82] text-white dark:bg-[#19B8F2] dark:text-[#07111F]"
                    : "bg-[#F7F9FC] text-[#003B82] group-hover:bg-[#EAF6FD] dark:bg-[#12243B] dark:text-[#A8DDF4] dark:group-hover:bg-[#19B8F2]/10"
                }`}
              >
                {letter}
              </span>

              {/* Text */}
              <span
                className={`pt-0.5 font-medium leading-6 ${textSize} ${
                  isSelected
                    ? "text-[#001F4F] dark:text-[#F8FAFC]"
                    : "text-[#334155] dark:text-[#D7E0EA]"
                }`}
              >
                {option}
              </span>
            </button>
          );
        })}

        <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-[#64748B] dark:text-[#A8B4C5]">
          <Circle size={6} fill="currentColor" />
          Select all correct answers.
        </div>
      </div>
    );
  }

  /*
   * NUMERICAL ANSWER
   */
  if (type === "numerical") {
    return (
      <div className="max-w-md">
        <label
          htmlFor="numerical-answer"
          className="mb-2 block text-sm font-bold text-[#334155] dark:text-[#D7E0EA]"
        >
          Enter your answer
        </label>

        <div className="relative">
          <input
            id="numerical-answer"
            type="number"
            inputMode="decimal"
            value={selectedAnswer ?? ""}
            onChange={(event) =>
              onAnswerSelect(event.target.value)
            }
            placeholder="Enter numerical value"
            className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3.5 text-base font-semibold text-[#001F4F] outline-none transition placeholder:text-[#94A3B8] focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:text-[#F8FAFC] dark:placeholder:text-[#64748B] dark:focus:border-[#19B8F2] dark:focus:ring-[#19B8F2]/10"
          />
        </div>

        <p className="mt-2 text-xs font-medium text-[#64748B] dark:text-[#A8B4C5]">
          Enter only the numerical value.
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
      Unsupported question type.
    </p>
  );
}

export default AnswerOptions;
