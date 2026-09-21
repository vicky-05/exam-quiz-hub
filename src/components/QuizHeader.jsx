import { Clock3, ShieldCheck, UserRound } from "lucide-react";
import logo from "../assets/exam-quiz-hub-logo.png";
import { formatTime } from "../utils/quizUtils";

function getUserDisplayName(user) {
  if (!user) return "Student";

  const metadata = user.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.fullName ||
    metadata.name ||
    metadata.display_name ||
    metadata.username ||
    metadata.user_name;

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Student";
}

function QuizHeader({ test, timeRemaining, user }) {
  const isCritical = timeRemaining <= 300;
  const isWarning = timeRemaining <= 600 && !isCritical;

  const timerTone = isCritical
    ? "border-red-300 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300"
    : isWarning
      ? "border-[#F6C400]/40 bg-[#FFF8D9] text-[#805F00] dark:border-[#FFD23F]/30 dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]"
      : "border-[#009FE3]/20 bg-[#EAF6FD] text-[#003B82] dark:border-[#19B8F2]/25 dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]";

  const displayName = getUserDisplayName(user);

  return (
    <header className="relative z-50 shrink-0 border-b border-slate-200 bg-white dark:border-[#243A55] dark:bg-[#0D1B2E]">
      <div className="mx-auto flex min-h-[68px] w-full max-w-[1600px] items-center gap-3 px-3 py-2.5 sm:px-5 lg:px-7">
        {/* Brand + Test Information */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden h-10 w-[118px] shrink-0 items-center sm:flex">
            <img
              src={logo}
              alt="Exam Quiz Hub"
              className="h-full w-full object-contain object-left"
            />
          </div>

          <div className="min-w-0 border-l border-slate-200 pl-3 dark:border-[#243A55] sm:pl-4">
            <div className="flex items-center gap-2">
              <span className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-[#009FE3] md:inline">
                {test?.testType === "mock" ? "Mock Test" : "Practice Test"}
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 md:block" />

              <span className="truncate text-xs font-bold text-slate-500 dark:text-[#A8B4C5]">
                {test?.exam || "Exam Quiz Hub"}
              </span>
            </div>

            <h1 className="mt-0.5 max-w-[34rem] truncate text-sm font-black tracking-tight text-[#001F4F] dark:text-white sm:text-base">
              {test?.title || "Quiz"}
            </h1>
          </div>
        </div>

        {/* Timer */}
        <div
          className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 shadow-sm transition sm:min-w-[148px] sm:px-4 ${timerTone}`}
          aria-label={`Time remaining ${formatTime(timeRemaining)}`}
        >
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
              isCritical
                ? "bg-red-100 dark:bg-red-400/15"
                : isWarning
                  ? "bg-[#F6C400]/15 dark:bg-[#FFD23F]/10"
                  : "bg-white/70 dark:bg-white/5"
            }`}
          >
            <Clock3 size={17} strokeWidth={2.5} />
          </span>

          <div className="leading-none">
            <p className="hidden text-[9px] font-black uppercase tracking-[0.14em] opacity-70 sm:block">
              Time left
            </p>
            <p className="mt-0.5 text-sm font-black tabular-nums sm:text-base">
              {formatTime(timeRemaining)}
            </p>
          </div>
        </div>

        {/* Authenticated User */}
        <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 dark:border-[#243A55] sm:flex">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF6FD] text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
            <UserRound size={17} />
          </div>

          <div className="max-w-[150px]">
            <p
              className="truncate text-xs font-black text-[#001F4F] dark:text-white"
              title={displayName}
            >
              {displayName}
            </p>

            <div className="mt-0.5 flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-[#A8B4C5]">
              <ShieldCheck size={11} className="text-[#009FE3]" />
              Logged in
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default QuizHeader;
