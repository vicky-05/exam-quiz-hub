import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Flame,
  History,
  LogOut,
  Medal,
  Play,
  Target,
  Trophy,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function formatScore(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getAccuracy(attempt) {
  const answered = Number(attempt.answered_questions || 0);
  const correct = Number(attempt.correct_answers || 0);

  if (!answered) return 0;

  return Math.round((correct / answered) * 100);
}

function getScorePercentage(attempt) {
  const maximum = Number(attempt.maximum_score || 0);
  const score = Number(attempt.score || 0);

  if (!maximum) return 0;

  return Math.max(
    0,
    Math.min(100, Math.round((score / maximum) * 100))
  );
}

function getLocalDateKey(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateFromKey(key) {
  if (!key) return null;

  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getYesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  return getLocalDateKey(date);
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  detail,
  iconClass = "bg-[#EAF7FF] dark:bg-[#102B43] text-[#009FE3]",
}) {
  return (
    <div className="group rounded-[22px] border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_25px_rgba(16,35,63,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(16,35,63,0.09)] dark:border-[#243A55] dark:bg-[#0D1B2E]">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
        >
          {icon}
        </div>

        <div className="h-9 w-9 rounded-full bg-slate-50 opacity-70 transition group-hover:opacity-100 dark:bg-slate-800" />
      </div>

      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-[#10233F] dark:text-[#F4F7F6]">
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
        {detail}
      </p>
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  to,
  icon,
  title,
  description,
  className = "",
}) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-[22px] border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-current dark:bg-white/10">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-black">{title}</h3>

          <p className="mt-1 text-xs leading-5 opacity-75">
            {description}
          </p>
        </div>

        <span className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#009FE3] transition group-hover:translate-x-1 dark:bg-[#10251F]">
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

/* =========================================================
   DAILY GOAL
========================================================= */

function DailyGoal({ progress }) {
  const goal = 3;
  const completed = progress.todayTests;
  const percentage = Math.min(
    100,
    Math.round((completed / goal) * 100)
  );

  const remaining = Math.max(0, goal - completed);

  return (
    <section className="rounded-[26px] border border-[#009FE3]/10 bg-white p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7FF] text-[#009FE3] dark:bg-[#102B43]">
            <Target size={23} />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
              Today's target
            </p>

            <h2 className="mt-1 text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
              Daily Study Goal
            </h2>
          </div>
        </div>

        <div className="rounded-xl bg-[#F7F9FC] px-4 py-2 text-center dark:bg-[#07111F]">
          <p className="text-2xl font-black text-[#009FE3]">
            {completed}/{goal}
          </p>

          <p className="text-[10px] font-bold uppercase text-slate-400">
            Tests Today
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500 dark:text-slate-400">
            Daily progress
          </span>

          <span className="text-[#009FE3]">
            {percentage}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#243A55]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#003B82] to-[#009FE3] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {remaining > 0
              ? `${remaining} more test${
                  remaining > 1 ? "s" : ""
                } to complete today's goal`
              : "🎉 Daily goal completed!"}
          </p>

          <Link
            to="/"
            className="text-xs font-black text-[#009FE3] hover:text-[#007CB5]"
          >
            Practice →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   STUDY STREAK
========================================================= */

function StudyStreak({ streak }) {
  return (
    <section className="rounded-[26px] border border-[#F6C400]/20 bg-gradient-to-br from-[#FFFDF5] to-[#FFF9E8] p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:border-[#4A3A17] dark:from-[#12243B] dark:to-[#2B2417]">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C400]/10 text-[#F59E0B]">
          <Flame size={24} />
        </div>

        <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#A56A00] dark:bg-black/10">
          Consistency
        </span>
      </div>

      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
        Current streak
      </p>

      <div className="mt-1 flex items-end gap-2">
        <span className="text-4xl font-black text-[#10233F] dark:text-[#F4F7F6]">
          {streak.current}
        </span>

        <span className="mb-1 text-sm font-bold text-slate-500 dark:text-slate-400">
          day{streak.current !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 dark:bg-black/10">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Best streak
        </span>

        <strong className="text-sm font-black text-[#A56A00]">
          {streak.best} days
        </strong>
      </div>
    </section>
  );
}

/* =========================================================
   PERSONAL BEST
========================================================= */

function PersonalBest({ stats }) {
  return (
    <section className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7FF] text-[#009FE3] dark:bg-[#102B43]">
          <Trophy size={23} />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
            Your records
          </p>

          <h2 className="mt-1 text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
            Personal Best
          </h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#F7F9FC] p-4 dark:bg-[#07111F]">
          <p className="text-[10px] font-black uppercase text-slate-400">
            Best Score
          </p>

          <p className="mt-2 text-2xl font-black text-[#009FE3]">
            {stats.bestScore}%
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFF9E8] p-4 dark:bg-[#2B2417]">
          <p className="text-[10px] font-black uppercase text-slate-400">
            Best Accuracy
          </p>

          <p className="mt-2 text-2xl font-black text-[#A56A00]">
            {stats.bestAccuracy}%
          </p>
        </div>

        <div className="rounded-2xl bg-[#F7F9FC] p-4 dark:bg-[#07111F]">
          <p className="text-[10px] font-black uppercase text-slate-400">
            Questions
          </p>

          <p className="mt-2 text-2xl font-black text-[#10233F] dark:text-[#F4F7F6]">
            {formatNumber(stats.mostQuestions)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#EAF7FF] p-4 dark:bg-[#102B43]">
          <p className="text-[10px] font-black uppercase text-slate-400">
            Avg Score
          </p>

          <p className="mt-2 text-2xl font-black text-[#315E86]">
            {stats.averageScore}%
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WEAK SUBJECT ANALYSIS
========================================================= */

function WeakSubjectAnalysis({ subjects }) {
  if (!subjects.length) {
    return (
      <section className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF9E8] text-[#A56A00]">
            <TrendingUp size={23} />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
              Analysis
            </p>

            <h2 className="mt-1 text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
              Focus Areas
            </h2>
          </div>
        </div>

        <p className="mt-6 rounded-2xl bg-[#F7F9FC] p-5 text-sm font-semibold leading-6 text-slate-500 dark:bg-[#07111F] dark:text-slate-400">
          Complete more tests to identify the subjects where you
          need the most practice.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF9E8] text-[#A56A00]">
          <TrendingUp size={23} />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
            Analysis
          </p>

          <h2 className="mt-1 text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
            Focus Areas
          </h2>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
        Subjects with lower accuracy are shown first.
      </p>

      <div className="mt-6 space-y-5">
        {subjects.slice(0, 4).map((subject) => {
          const percentage = subject.accuracy;

          return (
            <div key={subject.id}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-xs font-black text-[#10233F] dark:text-[#F4F7F6]">
                  {subject.name}
                </span>

                <span
                  className={`shrink-0 text-xs font-black ${
                    percentage < 60
                      ? "text-red-500"
                      : percentage < 75
                        ? "text-[#A56A00]"
                        : "text-[#009FE3]"
                  }`}
                >
                  {percentage}%
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#243A55]">
                <div
                  className={`h-full rounded-full ${
                    percentage < 60
                      ? "bg-red-400"
                      : percentage < 75
                        ? "bg-[#F6C400]"
                        : "bg-[#009FE3]"
                  }`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                {formatNumber(subject.answered)} questions
                answered
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   RECOMMENDED TESTS
========================================================= */

function RecommendedTests({ tests }) {
  const [selectedTestId, setSelectedTestId] = useState(
    tests?.[0]?.id || ""
  );

  useEffect(() => {
    if (
      tests?.length &&
      !tests.some((test) => test.id === selectedTestId)
    ) {
      setSelectedTestId(tests[0].id);
    }
  }, [tests, selectedTestId]);

  const selectedTest =
    tests.find((test) => test.id === selectedTestId) ||
    tests[0] ||
    null;

  const testUrl =
    selectedTest?.examId &&
    selectedTest?.track?.id &&
    selectedTest?.subject?.id &&
    selectedTest?.set_number
      ? `/exam/${selectedTest.examId}/${selectedTest.track.id}/${selectedTest.subject.id}/set-${selectedTest.set_number}`
      : "/";

  return (
    <section className="min-w-0 overflow-hidden rounded-[26px] border border-[#009FE3]/10 bg-white p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E]">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7FF] text-[#009FE3] dark:bg-[#102B43]">
            <BookOpen size={23} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
              Keep improving
            </p>

            <h2 className="mt-1 text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
              Recommended Tests
            </h2>
          </div>
        </div>

        <Link
          to="/"
          className="shrink-0 text-xs font-black text-[#009FE3] hover:text-[#007CB5]"
        >
          Explore All →
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-[#F7F9FC] p-5 text-sm font-semibold leading-6 text-slate-500 dark:bg-[#07111F] dark:text-slate-400">
          More tests will appear here as they become available.
        </div>
      ) : (
        <div className="mt-6 min-w-0">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC] p-4 dark:border-[#243A55] dark:bg-[#07111F]">
            <label
              htmlFor="recommended-test-select"
              className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A56A00]"
            >
              Select a Test / Set
            </label>

            <div className="relative mt-2">
              <select
                id="recommended-test-select"
                value={selectedTest?.id || ""}
                onChange={(event) =>
                  setSelectedTestId(event.target.value)
                }
                className="w-full min-w-0 appearance-none rounded-xl border border-[#D9E2EC] bg-white px-4 py-3 pr-10 text-sm font-black text-[#10233F] outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:text-[#F4F7F6]"
              >
                {tests.slice(0, 4).map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {selectedTest && (
              <div className="mt-4 min-w-0">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7FF] text-[#009FE3] dark:bg-[#102B43]">
                    <Play size={17} fill="currentColor" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
                      {selectedTest.title}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {selectedTest.subject?.name || "Practice"} ·{" "}
                      {selectedTest.total_questions || 0} Questions ·{" "}
                      {selectedTest.duration_minutes || 0} Minutes
                    </p>
                  </div>
                </div>

                <Link
                  to={testUrl}
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#009FE3] px-4 py-3 text-xs font-black text-white transition hover:bg-[#007CB5]"
                >
                  Start Selected Test
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   PERFORMANCE CHART
========================================================= */

function PerformanceChart({ attempts }) {
  const chartAttempts = attempts.slice(0, 10).reverse();

  if (!chartAttempts.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-[#F7F9FC] dark:bg-[#07111F]">
        <div className="text-center">
          <BarChart3
            className="mx-auto text-slate-300 dark:text-slate-600"
            size={32}
          />

          <p className="mt-3 text-sm font-bold text-slate-400 dark:text-slate-500">
            Complete a test to see your performance trend.
          </p>
        </div>
      </div>
    );
  }

  const width = 720;
  const height = 250;
  const paddingX = 35;
  const paddingY = 28;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const points = chartAttempts.map((attempt, index) => {
    const x =
      paddingX +
      (chartAttempts.length === 1
        ? usableWidth / 2
        : (index / (chartAttempts.length - 1)) *
          usableWidth);

    const score = getScorePercentage(attempt);
    const y =
      paddingY +
      ((100 - score) / 100) * usableHeight;

    return {
      x,
      y,
      score,
      attempt,
    };
  });

  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const area = `${line} L ${
    points[points.length - 1].x
  } ${height - paddingY} L ${points[0].x} ${
    height - paddingY
  } Z`;

  return (
    <div className="overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full"
        role="img"
        aria-label="Recent performance trend"
      >
        {[0, 25, 50, 75, 100].map((value) => {
          const y =
            paddingY +
            ((100 - value) / 100) * usableHeight;

          return (
            <g key={value}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#CBD5E1"
                strokeWidth="1"
              />

              <text
                x="2"
                y={y + 4}
                fontSize="11"
                fill="#94A3B8"
                fontWeight="600"
              >
                {value}%
              </text>
            </g>
          );
        })}

        <path
          d={area}
          fill="#009FE3"
          opacity="0.10"
        />

        <path
          d={line}
          fill="none"
          stroke="#009FE3"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={`${point.attempt.id}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="7"
              fill="currentColor"
              className="text-white dark:text-[#0D1B2E]"
              stroke="#009FE3"
              strokeWidth="3"
            />

            <text
              x={point.x}
              y={height - 7}
              textAnchor="middle"
              fontSize="10"
              fill="#94A3B8"
              fontWeight="600"
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* =========================================================
   PERFORMANCE SNAPSHOT
========================================================= */

function PerformanceSnapshot({ stats }) {
  const correct = stats.totalCorrect;
  const wrong = stats.totalWrong;
  const unanswered = stats.totalUnanswered;
  const total = correct + wrong + unanswered;

  const correctPercent = total
    ? Math.round((correct / total) * 100)
    : 0;

  return (
    <section className="rounded-[26px] border border-[#F6C400]/15 bg-[#FFFDF7] p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:bg-[#12243B] sm:p-7">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6C400]/10 text-[#A56A00]">
          <Medal size={21} />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
            Overall analysis
          </p>

          <h2 className="mt-1 text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
            Performance Snapshot
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center">
        <div
          className="mx-auto grid h-36 w-36 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#009FE3 ${correctPercent}%, #E2E8EC ${correctPercent}% 100%)`,
          }}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-[#FFFDF7] text-center dark:bg-[#12243B]">
            <div>
              <p className="text-3xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                {stats.averageAccuracy}%
              </p>

              <p className="mt-1 text-[10px] font-black text-slate-400 dark:text-slate-500">
                AVERAGE
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-[#009FE3]" />
              Correct Answers
            </span>

            <strong className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
              {formatNumber(correct)}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              Incorrect Answers
            </span>

            <strong className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
              {formatNumber(wrong)}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              Unattempted
            </span>

            <strong className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
              {formatNumber(unanswered)}
            </strong>
          </div>

          <div className="mt-2 rounded-xl bg-[#FFF9E8] px-4 py-3 dark:bg-[#12243B]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#A56A00]">
                Total Questions
              </span>

              <strong className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
                {formatNumber(stats.totalQuestions)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   EMPTY ATTEMPTS
========================================================= */

function EmptyAttempts() {
  return (
    <div className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-white p-10 text-center dark:border-[#243A55] dark:bg-[#0D1B2E]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9E8] text-[#009FE3] dark:bg-[#12243B]">
        <History size={25} />
      </div>

      <h3 className="mt-5 text-lg font-black text-[#10233F] dark:text-[#F4F7F6]">
        No tests attempted yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        Start your first practice set and your performance
        will appear here.
      </p>

      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#009FE3]/15 transition hover:-translate-y-0.5 hover:shadow-xl"
      >
        Explore Tests
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingDashboard() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F9FC] px-4 dark:bg-[#07111F]">
      <div className="rounded-[24px] border border-[#E2E8F0] bg-white px-9 py-8 text-center shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E]">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#009FE3]/20 border-t-[#009FE3]" />

        <p className="mt-4 text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
          Preparing your dashboard...
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ERROR
========================================================= */

function ErrorDashboard({ message, onRetry }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F9FC] px-4 dark:bg-[#07111F]">
      <div className="w-full max-w-md rounded-[24px] border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900 dark:bg-[#0D1B2E]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40">
          <Target size={22} />
        </div>

        <h2 className="mt-5 text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
          Unable to load dashboard
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-xl bg-[#009FE3] px-5 py-3 text-sm font-black text-white transition hover:bg-[#007CB5]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   USER DASHBOARD
========================================================= */

function UserDashboard() {
  const {
    user,
    profile,
    loading: authLoading,
    signOut,
  } = useAuth();

  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [testsById, setTestsById] = useState({});
  const [availableTests, setAvailableTests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  async function loadDashboard() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      /* ---------------------------------------------------
         LOAD USER ATTEMPTS
      --------------------------------------------------- */

      const {
        data: attemptData,
        error: attemptError,
      } = await supabase
        .from("test_attempts")
        .select(`
          id,
          user_id,
          test_id,
          started_at,
          submitted_at,
          time_taken_seconds,
          total_questions,
          answered_questions,
          correct_answers,
          wrong_answers,
          unanswered_questions,
          marked_questions,
          score,
          maximum_score
        `)
        .eq("user_id", user.id)
        .order("submitted_at", {
          ascending: false,
        });

      if (attemptError) throw attemptError;

      const safeAttempts = attemptData || [];

      setAttempts(safeAttempts);

      /* ---------------------------------------------------
         TEST IDS FROM ATTEMPTS
      --------------------------------------------------- */

      const testIds = [
        ...new Set(
          safeAttempts
            .map((attempt) => attempt.test_id)
            .filter(Boolean)
        ),
      ];

      /* ---------------------------------------------------
         LOAD TESTS FROM ATTEMPTS
      --------------------------------------------------- */

      let testData = [];

      if (testIds.length) {
        const {
          data,
          error: testError,
        } = await supabase
          .from("tests")
          .select(`
            id,
            subject_id,
            title,
            set_number,
            total_questions,
            duration_minutes,
            marks_per_question,
            negative_marks
          `)
          .in("id", testIds);

        if (testError) throw testError;

        testData = data || [];
      }

      /* ---------------------------------------------------
         LOAD SUBJECTS
      --------------------------------------------------- */

      const subjectIds = [
        ...new Set(
          testData
            .map((test) => test.subject_id)
            .filter(Boolean)
        ),
      ];

      let subjectMap = {};
      let trackMap = {};

      if (subjectIds.length) {
        const {
          data: subjectData,
          error: subjectError,
        } = await supabase
          .from("subjects")
          .select("id, name, track_id")
          .in("id", subjectIds);

        if (subjectError) throw subjectError;

        subjectMap = Object.fromEntries(
          (subjectData || []).map((subject) => [
            subject.id,
            subject,
          ])
        );

        const trackIds = [
          ...new Set(
            (subjectData || [])
              .map((subject) => subject.track_id)
              .filter(Boolean)
          ),
        ];

        if (trackIds.length) {
          const {
            data: trackData,
            error: trackError,
          } = await supabase
            .from("tracks")
            .select("id, exam_id, name")
            .in("id", trackIds);

          if (trackError) throw trackError;

          trackMap = Object.fromEntries(
            (trackData || []).map((track) => [
              track.id,
              track,
            ])
          );
        }
      }

      /* ---------------------------------------------------
         CREATE TEST MAP
      --------------------------------------------------- */

      const testMap = Object.fromEntries(
        testData.map((test) => {
          const subject =
            subjectMap[test.subject_id] || null;

          const track = subject?.track_id
            ? trackMap[subject.track_id] || null
            : null;

          return [
            test.id,
            {
              ...test,
              subject,
              track,
              examId: track?.exam_id || null,
            },
          ];
        })
      );

      setTestsById(testMap);

      /* ---------------------------------------------------
         LOAD AVAILABLE TESTS FOR RECOMMENDATIONS

         We use only confirmed columns from the existing
         dashboard schema.
      --------------------------------------------------- */

      const {
        data: availableTestData,
        error: availableTestError,
      } = await supabase
        .from("tests")
        .select(`
          id,
          subject_id,
          title,
          set_number,
          total_questions,
          duration_minutes,
          marks_per_question,
          negative_marks
        `)
        .order("id", {
          ascending: false,
        })
        .limit(20);

      if (availableTestError) {
        console.warn(
          "Could not load recommended tests:",
          availableTestError
        );
      } else {
        const recommendationSubjectIds = [
          ...new Set(
            (availableTestData || [])
              .map((test) => test.subject_id)
              .filter(Boolean)
          ),
        ];

        let recommendationSubjectMap = {
          ...subjectMap,
        };

        let recommendationTrackMap = {
          ...trackMap,
        };

        const missingSubjectIds =
          recommendationSubjectIds.filter(
            (id) => !recommendationSubjectMap[id]
          );

        if (missingSubjectIds.length) {
          const {
            data: recommendationSubjects,
            error: recommendationSubjectError,
          } = await supabase
            .from("subjects")
            .select("id, name, track_id")
            .in("id", missingSubjectIds);

          if (recommendationSubjectError) {
            console.warn(
              "Could not load recommendation subjects:",
              recommendationSubjectError
            );
          } else {
            recommendationSubjectMap = {
              ...recommendationSubjectMap,
              ...(recommendationSubjects || []).reduce(
                (acc, subject) => {
                  acc[subject.id] = subject;
                  return acc;
                },
                {}
              ),
            };
          }
        }

        const recommendationTrackIds = [
          ...new Set(
            (availableTestData || [])
              .map(
                (test) =>
                  recommendationSubjectMap[test.subject_id]
                    ?.track_id
              )
              .filter(Boolean)
          ),
        ];

        const missingTrackIds =
          recommendationTrackIds.filter(
            (id) => !recommendationTrackMap[id]
          );

        if (missingTrackIds.length) {
          const {
            data: recommendationTracks,
            error: recommendationTrackError,
          } = await supabase
            .from("tracks")
            .select("id, exam_id, name")
            .in("id", missingTrackIds);

          if (recommendationTrackError) {
            console.warn(
              "Could not load recommendation tracks:",
              recommendationTrackError
            );
          } else {
            recommendationTrackMap = {
              ...recommendationTrackMap,
              ...(recommendationTracks || []).reduce(
                (acc, track) => {
                  acc[track.id] = track;
                  return acc;
                },
                {}
              ),
            };
          }
        }

        const recommendationTests =
          (availableTestData || []).map((test) => {
            const subject =
              recommendationSubjectMap[test.subject_id] ||
              null;

            const track = subject?.track_id
              ? recommendationTrackMap[subject.track_id] ||
                null
              : null;

            return {
              ...test,
              subject,
              track,
              examId: track?.exam_id || null,
            };
          });

        setAvailableTests(recommendationTests);
      }
    } catch (err) {
      console.error(
        "Failed to load user dashboard:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while loading your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboard();
    }
  }, [authLoading, user?.id]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const totalTests = attempts.length;

    const totalQuestions = attempts.reduce(
      (total, attempt) =>
        total + Number(attempt.total_questions || 0),
      0
    );

    const questionsAttempted = attempts.reduce(
      (total, attempt) =>
        total + Number(attempt.answered_questions || 0),
      0
    );

    const totalCorrect = attempts.reduce(
      (total, attempt) =>
        total + Number(attempt.correct_answers || 0),
      0
    );

    const totalWrong = attempts.reduce(
      (total, attempt) =>
        total + Number(attempt.wrong_answers || 0),
      0
    );

    const totalUnanswered = attempts.reduce(
      (total, attempt) =>
        total + Number(
          attempt.unanswered_questions || 0
        ),
      0
    );

    const totalTime = attempts.reduce(
      (total, attempt) =>
        total + Number(
          attempt.time_taken_seconds || 0
        ),
      0
    );

    const totalMaximumScore = attempts.reduce(
      (total, attempt) =>
        total + Number(attempt.maximum_score || 0),
      0
    );

    const totalScore = attempts.reduce(
      (total, attempt) =>
        total + Number(attempt.score || 0),
      0
    );

    const averageAccuracy = questionsAttempted
      ? Math.round(
          (totalCorrect / questionsAttempted) * 100
        )
      : 0;

    const bestScore = attempts.reduce(
      (best, attempt) =>
        Math.max(
          best,
          getScorePercentage(attempt)
        ),
      0
    );

    const bestAccuracy = attempts.reduce(
      (best, attempt) =>
        Math.max(
          best,
          getAccuracy(attempt)
        ),
      0
    );

    const mostQuestions = attempts.reduce(
      (best, attempt) =>
        Math.max(
          best,
          Number(attempt.total_questions || 0)
        ),
      0
    );

    const averageScore = totalTests
      ? Math.round(
          attempts.reduce(
            (total, attempt) =>
              total + getScorePercentage(attempt),
            0
          ) / totalTests
        )
      : 0;

    return {
      totalTests,
      totalQuestions,
      questionsAttempted,
      totalCorrect,
      totalWrong,
      totalUnanswered,
      totalTime,
      totalMaximumScore,
      totalScore,
      averageAccuracy,
      bestScore,
      bestAccuracy,
      mostQuestions,
      averageScore,
    };
  }, [attempts]);

  /* =======================================================
     SUBJECT ANALYSIS
  ======================================================= */

  const subjectAnalysis = useMemo(() => {
    const map = {};

    attempts.forEach((attempt) => {
      const test = testsById[attempt.test_id];
      const subject = test?.subject;

      if (!subject?.id) return;

      if (!map[subject.id]) {
        map[subject.id] = {
          id: subject.id,
          name: subject.name,
          answered: 0,
          correct: 0,
        };
      }

      map[subject.id].answered += Number(
        attempt.answered_questions || 0
      );

      map[subject.id].correct += Number(
        attempt.correct_answers || 0
      );
    });

    return Object.values(map)
      .filter((subject) => subject.answered > 0)
      .map((subject) => ({
        ...subject,
        accuracy: Math.round(
          (subject.correct / subject.answered) * 100
        ),
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [attempts, testsById]);

  /* =======================================================
     DAILY GOAL
  ======================================================= */

  const dailyProgress = useMemo(() => {
    const todayKey = getLocalDateKey();

    const todayAttempts = attempts.filter(
      (attempt) =>
        getLocalDateKey(attempt.submitted_at) ===
        todayKey
    );

    return {
      todayTests: todayAttempts.length,
    };
  }, [attempts]);

  /* =======================================================
     STUDY STREAK
  ======================================================= */

  const streak = useMemo(() => {
    const uniqueDates = [
      ...new Set(
        attempts
          .map((attempt) =>
            getLocalDateKey(attempt.submitted_at)
          )
          .filter(Boolean)
      ),
    ];

    if (!uniqueDates.length) {
      return {
        current: 0,
        best: 0,
      };
    }

    const dateSet = new Set(uniqueDates);

    let current = 0;

    let cursor = new Date();

    const todayKey = getLocalDateKey(cursor);

    /*
      If the user hasn't completed a test today,
      allow yesterday to continue the current streak.
    */

    if (!dateSet.has(todayKey)) {
      const yesterday = getYesterdayKey();

      if (!dateSet.has(yesterday)) {
        current = 0;
      } else {
        cursor = getDateFromKey(yesterday);

        while (
          dateSet.has(getLocalDateKey(cursor))
        ) {
          current += 1;
          cursor.setDate(cursor.getDate() - 1);
        }
      }
    } else {
      while (
        dateSet.has(getLocalDateKey(cursor))
      ) {
        current += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    const sortedDates = uniqueDates
      .map((date) => getDateFromKey(date))
      .sort((a, b) => a - b);

    let best = sortedDates.length ? 1 : 0;
    let running = sortedDates.length ? 1 : 0;

    for (let index = 1; index < sortedDates.length; index++) {
      const difference =
        (sortedDates[index].getTime() -
          sortedDates[index - 1].getTime()) /
        (1000 * 60 * 60 * 24);

      if (difference === 1) {
        running += 1;
        best = Math.max(best, running);
      } else {
        running = 1;
      }
    }

    return {
      current,
      best,
    };
  }, [attempts]);

  /* =======================================================
     RECOMMENDED TESTS
  ======================================================= */

  const recommendedTests = useMemo(() => {
    if (!availableTests.length) return [];

    const attemptedIds = new Set(
      attempts.map((attempt) => attempt.test_id)
    );

    /*
      Prefer tests from weaker subjects.
    */

    const weakSubjectIds = new Set(
      subjectAnalysis
        .slice(0, 3)
        .map((subject) => subject.id)
    );

    const sorted = [...availableTests].sort(
      (a, b) => {
        const aWeak = weakSubjectIds.has(
          a.subject_id
        );

        const bWeak = weakSubjectIds.has(
          b.subject_id
        );

        if (aWeak && !bWeak) return -1;
        if (!aWeak && bWeak) return 1;

        const aAttempted = attemptedIds.has(a.id);
        const bAttempted = attemptedIds.has(b.id);

        if (aAttempted && !bAttempted) return 1;
        if (!aAttempted && bAttempted) return -1;

        return 0;
      }
    );

    return sorted.slice(0, 4);
  }, [
    availableTests,
    attempts,
    subjectAnalysis,
  ]);

  const recentAttempts = attempts.slice(0, 6);

  const latestAttempt = attempts[0] || null;

  const latestTest = latestAttempt
    ? testsById[latestAttempt.test_id]
    : null;

  /* =======================================================
     SIGN OUT
  ======================================================= */

  async function handleSignOut() {
    if (signingOut) return;

    try {
      setSigningOut(true);

      await signOut();

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      console.error("Sign out failed:", err);

      setError(
        err?.message || "Unable to sign out."
      );
    } finally {
      setSigningOut(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-[#F4F7F6]">
        <Header />

        <LoadingDashboard />
      </div>
    );
  }

  if (!user) return null;

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-[#F4F7F6]">
        <Header />

        <ErrorDashboard
          message={error}
          onRetry={loadDashboard}
        />
      </div>
    );
  }

  /* =======================================================
     DISPLAY NAME
  ======================================================= */

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Student";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-[#F4F7F6]">
      <Header />

      <main>
        {/* =================================================
            HERO
        ================================================== */}

        <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-gradient-to-br from-[#EEF7FF] via-white to-[#FFF9E8] dark:border-[#243A55] dark:from-[#07111F] dark:via-[#0D1B2E] dark:to-[#12243B]">
          <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#009FE3]/10 blur-3xl" />

          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#F6C400]/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="grid gap-7 lg:grid-cols-[1fr_300px] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#009FE3] shadow-sm ring-1 ring-[#009FE3]/10 dark:bg-[#0D1B2E]">
                    <CheckCircle2 size={13} />
                    Account connected
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#A56A00] shadow-sm ring-1 ring-[#F6C400]/20 dark:bg-[#0D1B2E]">
                    <Medal size={13} />
                    Active learner
                  </span>
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] text-[#10233F] dark:text-[#F4F7F6] sm:text-5xl lg:text-[3.7rem]">
                  Welcome back,
                  <span className="block text-[#009FE3]">
                    {displayName} 👋
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                  Keep going. Consistency today creates
                  success tomorrow. Your preparation is
                  building one attempt at a time.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-[#009FE3]"
                    />
                    Account connected
                  </span>

                  <span className="flex items-center gap-2">
                    <Flame
                      size={15}
                      className="text-[#F6C400]"
                    />
                    {streak.current} day streak
                  </span>

                  <span className="flex items-center gap-2">
                    <TrendingUp
                      size={15}
                      className="text-[#009FE3]"
                    />
                    Track your progress
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[24px] bg-[#007CB5] p-6 text-white shadow-[0_15px_35px_rgba(0,107,79,0.2)]">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#F6C400]/25 blur-2xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                      <Trophy
                        size={23}
                        className="text-[#FFD23F]"
                      />
                    </div>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <ArrowRight size={16} />
                    </span>
                  </div>

                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFD23F]">
                    Keep going
                  </p>

                  <h2 className="mt-2 text-2xl font-black leading-tight">
                    Stay consistent.
                    <br />
                    Stay ahead.
                  </h2>

                  <p className="mt-3 text-xs leading-5 text-white/65">
                    {latestAttempt
                      ? `Your latest score was ${getScorePercentage(
                          latestAttempt
                        )}%. Keep pushing your benchmark higher.`
                      : "Start your first test and build your performance record."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            CONTENT
        ================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {/* =================================================
              STATISTICS
          ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<BookOpen size={22} />}
              label="Total Tests Attempted"
              value={formatNumber(stats.totalTests)}
              detail="Completed practice tests"
            />

            <StatCard
              icon={<Target size={22} />}
              label="Average Score"
              value={`${stats.averageScore}%`}
              detail={`${formatNumber(
                stats.questionsAttempted
              )} questions answered`}
              iconClass="bg-[#EEF7FF] text-[#315E86] dark:bg-[#17283A]"
            />

            <StatCard
              icon={<Trophy size={22} />}
              label="Best Score"
              value={`${stats.bestScore}%`}
              detail="Highest percentage achieved"
              iconClass="bg-[#FFF9E8] text-[#A56A00] dark:bg-[#2B2417]"
            />

            <StatCard
              icon={<Clock3 size={22} />}
              label="Total Practice Time"
              value={formatDuration(stats.totalTime)}
              detail="Time spent in completed tests"
              iconClass="bg-[#EEF7FF] text-[#007CB5] dark:bg-[#2A2018]"
            />
          </div>

          {/* =================================================
              DAILY GOAL
          ================================================== */}

          <section className="mt-8">
            <DailyGoal progress={dailyProgress} />
          </section>

          {/* =================================================
              STREAK + PERSONAL BEST
          ================================================== */}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <StudyStreak streak={streak} />

            <PersonalBest stats={stats} />
          </div>

          {/* =================================================
              FOCUS + RECOMMENDATIONS
          ================================================== */}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <WeakSubjectAnalysis
              subjects={subjectAnalysis}
            />

            <RecommendedTests
              tests={recommendedTests}
            />
          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================== */}

          <section className="mt-9">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A56A00]">
                  Next step
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#10233F] dark:text-[#F4F7F6]">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Jump into your next preparation task.
                </p>
              </div>

              <div className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#009FE3]" />
                Explore · Practice · Improve
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <QuickAction
                to="/"
                icon={
                  <Play
                    size={22}
                    fill="currentColor"
                  />
                }
                title="Start a New Test"
                description="Explore tests and challenge yourself."
                className="border-[#009FE3] bg-[#009FE3] text-white"
              />

              <QuickAction
                to="/dashboard/attempts"
                icon={<History size={22} />}
                title="Attempted History"
                description="View your complete test history."
                className="border-[#F6C400]/20 bg-[#FFF9E8] text-[#10233F] dark:bg-[#2B2618] dark:text-[#F4F7F6]"
              />

              <QuickAction
                to="/dashboard/profile"
                icon={<UserRound size={22} />}
                title="Profile & Account"
                description="Manage your profile and security."
                className="border-[#10233F] bg-[#10233F] text-white"
              />

              <QuickAction
                to="/dashboard/attempts"
                icon={<BarChart3 size={22} />}
                title="View Performance"
                description="Check your progress and insights."
                className="border-[#009FE3]/10 bg-[#EAF7FF] text-[#10233F] dark:bg-[#102B43] dark:text-[#F4F7F6]"
              />
            </div>
          </section>

          {/* =================================================
              TREND + SNAPSHOT
          ================================================== */}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
            <section className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E] sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
                    Analytics
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                    Your Performance Trend
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    See how your recent test scores are moving.
                  </p>
                </div>

                <span className="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-3 py-2 text-xs font-black text-slate-500 dark:border-[#243A55] dark:bg-[#07111F] dark:text-slate-400">
                  Last {Math.min(attempts.length, 10)} Tests
                </span>
              </div>

              <div className="mt-5">
                <PerformanceChart
                  attempts={attempts}
                />
              </div>
            </section>

            <PerformanceSnapshot stats={stats} />
          </div>

          {/* =================================================
              RECENT ATTEMPTS + TIPS
          ================================================== */}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_290px]">
            <section className="rounded-[26px] border border-[#E2E8F0] bg-white shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E]">
              <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-6 py-5 dark:border-[#243A55] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF7FF] text-[#009FE3] dark:bg-[#102B43]">
                    <History size={20} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                      Recent Attempts
                    </h2>

                    <p className="text-xs text-slate-400">
                      Your latest completed tests
                    </p>
                  </div>
                </div>

                <Link
                  to="/dashboard/attempts"
                  className="inline-flex items-center gap-2 text-xs font-black text-[#009FE3] hover:text-[#007CB5]"
                >
                  View All History
                  <ArrowRight size={15} />
                </Link>
              </div>

              {recentAttempts.length === 0 ? (
                <div className="p-5">
                  <EmptyAttempts />
                </div>
              ) : (
                <>
                  <div className="hidden grid-cols-[28px_1.7fr_0.9fr_0.7fr_0.7fr_0.6fr_0.6fr] gap-4 bg-[#F7F9FC] px-6 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:bg-[#07111F] dark:text-slate-500 md:grid">
                    <span>#</span>
                    <span>Test Name</span>
                    <span>Subject</span>
                    <span>Date</span>
                    <span>Score</span>
                    <span>Accuracy</span>
                    <span>Result</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-[#243A55]">
                    {recentAttempts.map(
                      (attempt, index) => {
                        const test =
                          testsById[attempt.test_id];

                        const accuracy =
                          getAccuracy(attempt);

                        const maximum = Number(
                          attempt.maximum_score || 0
                        );

                        const score = Number(
                          attempt.score || 0
                        );

                        const resultUrl =
                          test?.examId &&
                          test?.track?.id &&
                          test?.subject?.id &&
                          test?.set_number
                            ? `/exam/${test.examId}/${test.track.id}/result/${test.subject.id}/set-${test.set_number}?attemptId=${attempt.id}`
                            : null;

                        return (
                          <div
                            key={attempt.id}
                            className="grid gap-3 px-5 py-4 md:grid-cols-[28px_1.7fr_0.9fr_0.7fr_0.7fr_0.6fr_0.6fr] md:items-center md:gap-4 md:px-6"
                          >
                            <span className="hidden text-xs font-black text-slate-400 md:block">
                              {index + 1}
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
                                {test?.title ||
                                  "Practice Test"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400 md:hidden">
                                {test?.subject?.name ||
                                  "Practice"}{" "}
                                ·{" "}
                                {formatDate(
                                  attempt.submitted_at
                                )}
                              </p>
                            </div>

                            <span className="hidden truncate text-xs font-semibold text-slate-500 dark:text-slate-400 md:block">
                              {test?.subject?.name ||
                                "—"}
                            </span>

                            <span className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 md:block">
                              {formatDate(
                                attempt.submitted_at
                              )}
                            </span>

                            <span className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
                              {formatScore(score)}

                              <span className="font-bold text-slate-400">
                                {" "}
                                /{" "}
                                {formatScore(maximum)}
                              </span>
                            </span>

                            <span
                              className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${
                                accuracy >= 80
                                  ? "bg-[#009FE3]/10 text-[#009FE3]"
                                  : accuracy >= 60
                                    ? "bg-[#F6C400]/10 text-[#A56A00]"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {accuracy}%
                            </span>

                            <div className="flex justify-start md:justify-end">
                              {resultUrl ? (
                                <Link
                                  to={resultUrl}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#009FE3] px-3 py-2 text-[11px] font-black text-white transition hover:bg-[#007CB5]"
                                >
                                  View
                                  <ArrowRight
                                    size={13}
                                  />
                                </Link>
                              ) : (
                                <span className="text-xs text-slate-300">
                                  —
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </>
              )}
            </section>

            <section className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7FF] text-[#007CB5]">
                <Target size={21} />
              </div>

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
                Keep going
              </p>

              <h2 className="mt-2 text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                Build your edge.
              </h2>

              <div className="mt-5 space-y-4">
                {[
                  "Attempt at least one focused test regularly.",
                  "Spend extra time on weaker subjects.",
                  "Review incorrect answers after every test.",
                  "Improve accuracy before increasing speed.",
                  "Set a slightly higher target each week.",
                ].map((tip) => (
                  <div
                    key={tip}
                    className="flex gap-3"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-[#009FE3]"
                    />

                    <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                to="/"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-4 py-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Explore More Tests
                <ArrowRight size={15} />
              </Link>
            </section>
          </div>

          {/* =================================================
              FOOTER MOTIVATION
          ================================================== */}

          <section className="mt-8 overflow-hidden rounded-[24px] border border-[#F6C400]/15 bg-[#FFF9EC] px-6 py-5 text-center sm:px-8">
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
              <span className="text-2xl font-black text-[#F6C400]">
                “
              </span>

              <p className="text-sm font-bold italic text-slate-500 dark:text-slate-400">
                Success is the sum of small efforts, repeated
                day in and day out.
              </p>

              <span className="text-xs font-black text-[#A56A00]">
                — Robert Collier
              </span>
            </div>
          </section>

          {/* =================================================
              ACCOUNT ACTION
          ================================================== */}

          <div className="mt-7 flex flex-col gap-4 rounded-[22px] border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
                {user.email}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Your completed attempts are securely stored
                in your account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-[#0D1B2E] dark:hover:bg-red-950/40"
            >
              <LogOut size={17} />

              {signingOut
                ? "Signing out..."
                : "Sign Out"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;