import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
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
  return Math.max(0, Math.min(100, Math.round((score / maximum) * 100)));
}

function StatCard({ icon, label, value, detail, iconClass = "bg-[#EAF7FF] dark:bg-[#102B43] text-[#009FE3]" }) {
  return (
    <div className="group rounded-[22px] border border-[#E2E8F0] dark:border-[#243A55] bg-white dark:bg-[#0D1B2E] p-5 shadow-[0_8px_25px_rgba(16,35,63,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(16,35,63,0.09)]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}>
          {icon}
        </div>

        <div className="h-9 w-9 rounded-full bg-slate-50 dark:bg-slate-800 opacity-70 transition group-hover:opacity-100" />
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

function QuickAction({ to, icon, title, description, className = "" }) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-[22px] border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 dark:bg-white/10 text-current">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-black">{title}</h3>
          <p className="mt-1 text-xs leading-5 opacity-75">{description}</p>
        </div>

        <span className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 dark:bg-[#10251F] text-[#009FE3] transition group-hover:translate-x-1">
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

function PerformanceChart({ attempts }) {
  const chartAttempts = attempts.slice(0, 10).reverse();

  if (!chartAttempts.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-[#F7F9FC] dark:bg-[#07111F]">
        <div className="text-center">
          <BarChart3 className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
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
        : (index / (chartAttempts.length - 1)) * usableWidth);

    const score = getScorePercentage(attempt);
    const y = paddingY + ((100 - score) / 100) * usableHeight;

    return { x, y, score, attempt };
  });

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const area = `${line} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full"
        role="img"
        aria-label="Recent performance trend"
      >
        {[0, 25, 50, 75, 100].map((value) => {
          const y = paddingY + ((100 - value) / 100) * usableHeight;

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

        <path d={area} fill="#009FE3" opacity="0.10" />
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

function PerformanceSnapshot({ stats }) {
  const correct = stats.totalCorrect;
  const wrong = stats.totalWrong;
  const unanswered = stats.totalUnanswered;
  const total = correct + wrong + unanswered;

  const correctPercent = total ? Math.round((correct / total) * 100) : 0;

  return (
    <section className="rounded-[26px] border border-[#F6C400]/15 bg-[#FFFDF7] dark:bg-[#12243B] p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] sm:p-7">
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
          <div className="grid h-28 w-28 place-items-center rounded-full bg-[#FFFDF7] dark:bg-[#12243B] text-center">
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
            <span className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#009FE3]" />
              Correct Answers
            </span>
            <strong className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
              {formatNumber(correct)}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              Incorrect Answers
            </span>
            <strong className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
              {formatNumber(wrong)}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              Unattempted
            </span>
            <strong className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
              {formatNumber(unanswered)}
            </strong>
          </div>

          <div className="mt-2 rounded-xl bg-[#FFF9E8] dark:bg-[#12243B] px-4 py-3">
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

function EmptyAttempts() {
  return (
    <div className="rounded-[24px] border border-dashed border-[#CBD5E1] dark:border-[#243A55] bg-white dark:bg-[#0D1B2E] p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9E8] dark:bg-[#12243B] text-[#009FE3]">
        <History size={25} />
      </div>

      <h3 className="mt-5 text-lg font-black text-[#10233F] dark:text-[#F4F7F6]">
        No tests attempted yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400 dark:text-slate-500">
        Start your first practice set and your performance will appear here.
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

function LoadingDashboard() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F9FC] dark:bg-[#07111F] px-4">
      <div className="rounded-[24px] border border-[#E2E8F0] dark:border-[#243A55] bg-white dark:bg-[#0D1B2E] px-9 py-8 text-center shadow-sm">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#009FE3]/20 border-t-[#009FE3]" />
        <p className="mt-4 text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
          Preparing your dashboard...
        </p>
      </div>
    </div>
  );
}

function ErrorDashboard({ message, onRetry }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F9FC] dark:bg-[#07111F] px-4">
      <div className="w-full max-w-md rounded-[24px] border border-red-200 dark:border-red-900 bg-white dark:bg-[#0D1B2E] p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600">
          <Target size={22} />
        </div>

        <h2 className="mt-5 text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
          Unable to load dashboard
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400 dark:text-slate-500">{message}</p>

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

function UserDashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [testsById, setTestsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  async function loadDashboard() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: attemptData, error: attemptError } = await supabase
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
        .order("submitted_at", { ascending: false });

      if (attemptError) throw attemptError;

      const safeAttempts = attemptData || [];
      setAttempts(safeAttempts);

      const testIds = [
        ...new Set(
          safeAttempts.map((attempt) => attempt.test_id).filter(Boolean)
        ),
      ];

      if (!testIds.length) {
        setTestsById({});
        return;
      }

      const { data: testData, error: testError } = await supabase
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

      const subjectIds = [
        ...new Set(
          (testData || []).map((test) => test.subject_id).filter(Boolean)
        ),
      ];

      let subjectMap = {};
      let trackMap = {};

      if (subjectIds.length) {
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("id, name, track_id")
          .in("id", subjectIds);

        if (subjectError) throw subjectError;

        subjectMap = Object.fromEntries(
          (subjectData || []).map((subject) => [subject.id, subject])
        );

        const trackIds = [
          ...new Set(
            (subjectData || [])
              .map((subject) => subject.track_id)
              .filter(Boolean)
          ),
        ];

        if (trackIds.length) {
          const { data: trackData, error: trackError } = await supabase
            .from("tracks")
            .select("id, exam_id, name")
            .in("id", trackIds);

          if (trackError) throw trackError;

          trackMap = Object.fromEntries(
            (trackData || []).map((track) => [track.id, track])
          );
        }
      }

      const testMap = Object.fromEntries(
        (testData || []).map((test) => {
          const subject = subjectMap[test.subject_id] || null;
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
    } catch (err) {
      console.error("Failed to load user dashboard:", err);
      setError(
        err?.message || "Something went wrong while loading your dashboard."
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

  const stats = useMemo(() => {
    const totalTests = attempts.length;

    const totalQuestions = attempts.reduce(
      (total, attempt) => total + Number(attempt.total_questions || 0),
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
        total + Number(attempt.unanswered_questions || 0),
      0
    );

    const totalTime = attempts.reduce(
      (total, attempt) =>
        total + Number(attempt.time_taken_seconds || 0),
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
      ? Math.round((totalCorrect / questionsAttempted) * 100)
      : 0;

    const bestScore = attempts.reduce(
      (best, attempt) => Math.max(best, getScorePercentage(attempt)),
      0
    );

    const averageScore = totalTests
      ? Math.round(
          attempts.reduce(
            (total, attempt) => total + getScorePercentage(attempt),
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
      averageScore,
    };
  }, [attempts]);

  const recentAttempts = attempts.slice(0, 6);
  const latestAttempt = attempts[0] || null;
  const latestTest = latestAttempt
    ? testsById[latestAttempt.test_id]
    : null;

  async function handleSignOut() {
    if (signingOut) return;

    try {
      setSigningOut(true);
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Sign out failed:", err);
      setError(err?.message || "Unable to sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F] text-[#10233F] dark:text-[#F4F7F6]">
        <Header />
        <LoadingDashboard />
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F] text-[#10233F] dark:text-[#F4F7F6]">
        <Header />
        <ErrorDashboard message={error} onRetry={loadDashboard} />
      </div>
    );
  }

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Student";

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F] text-[#10233F] dark:text-[#F4F7F6]">
      <Header />

      <main>
        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-gradient-to-br from-[#EEF7FF] via-white to-[#FFF9E8] dark:border-[#243A55] dark:from-[#07111F] dark:via-[#0D1B2E] dark:to-[#12243B]">
          <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#009FE3]/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#F6C400]/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="grid gap-7 lg:grid-cols-[1fr_300px] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#0D1B2E] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#009FE3] shadow-sm ring-1 ring-[#009FE3]/10">
                    <CheckCircle2 size={13} />
                    Account connected
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#0D1B2E] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#A56A00] shadow-sm ring-1 ring-[#F6C400]/20">
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

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 dark:text-slate-600 sm:text-base">
                  Keep going. Consistency today creates success tomorrow.
                  Your preparation is building one attempt at a time.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#009FE3]" />
                    Account connected
                  </span>

                  <span className="flex items-center gap-2">
                    <Medal size={15} className="text-[#F6C400]" />
                    Keep improving
                  </span>

                  <span className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-[#009FE3]" />
                    Track your progress
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[24px] bg-[#007CB5] p-6 text-white shadow-[0_15px_35px_rgba(0,107,79,0.2)]">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#F6C400]/25 blur-2xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 dark:bg-white/5">
                      <Trophy size={23} className="text-[#FFD23F]" />
                    </div>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 dark:bg-white/5">
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
                      ? `Your latest score was ${getScorePercentage(latestAttempt)}%. Keep pushing your benchmark higher.`
                      : "Start your first test and build your performance record."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {/* =====================================================
              STATISTICS
          ====================================================== */}
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
              detail={`${formatNumber(stats.questionsAttempted)} questions answered`}
              iconClass="bg-[#EEF7FF] dark:bg-[#17283A] text-[#315E86]"
            />

            <StatCard
              icon={<Trophy size={22} />}
              label="Best Score"
              value={`${stats.bestScore}%`}
              detail="Highest percentage achieved"
              iconClass="bg-[#FFF9E8] dark:bg-[#2B2417] text-[#A56A00]"
            />

            <StatCard
              icon={<Clock3 size={22} />}
              label="Total Practice Time"
              value={formatDuration(stats.totalTime)}
              detail="Time spent in completed tests"
              iconClass="bg-[#EEF7FF] dark:bg-[#2A2018] text-[#007CB5]"
            />
          </div>

          {/* =====================================================
              QUICK ACTIONS
          ====================================================== */}
          <section className="mt-9">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A56A00]">
                  Next step
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#10233F] dark:text-[#F4F7F6]">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  Jump into your next preparation task.
                </p>
              </div>

              <div className="hidden items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#009FE3]" />
                Explore · Practice · Improve
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <QuickAction
                to="/"
                icon={<Play size={22} fill="currentColor" />}
                title="Start a New Test"
                description="Explore tests and challenge yourself."
                className="border-[#009FE3] bg-[#009FE3] text-white"
              />

              <QuickAction
                to="/dashboard/attempts"
                icon={<History size={22} />}
                title="Attempted History"
                description="View your complete test history."
                className="border-[#F6C400]/20 bg-[#FFF9E8] dark:bg-[#2B2618] text-[#10233F] dark:text-[#F4F7F6]"
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
                className="border-[#009FE3]/10 bg-[#EAF7FF] dark:bg-[#102B43] text-[#10233F] dark:text-[#F4F7F6]"
              />
            </div>
          </section>

          {/* =====================================================
              TREND + SNAPSHOT
          ====================================================== */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
            <section className="rounded-[26px] border border-[#E2E8F0] dark:border-[#243A55] bg-white dark:bg-[#0D1B2E] p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)] sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
                    Analytics
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                    Your Performance Trend
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    See how your recent test scores are moving.
                  </p>
                </div>

                <span className="rounded-xl border border-[#E2E8F0] dark:border-[#243A55] bg-[#F7F9FC] dark:bg-[#07111F] px-3 py-2 text-xs font-black text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  Last {Math.min(attempts.length, 10)} Tests
                </span>
              </div>

              <div className="mt-5">
                <PerformanceChart attempts={attempts} />
              </div>
            </section>

            <PerformanceSnapshot stats={stats} />
          </div>

          {/* =====================================================
              RECENT ATTEMPTS + TIPS
          ====================================================== */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_290px]">
            <section className="rounded-[26px] border border-[#E2E8F0] dark:border-[#243A55] bg-white dark:bg-[#0D1B2E] shadow-[0_8px_25px_rgba(16,35,63,0.05)]">
              <div className="flex flex-col gap-3 border-b border-[#E2E8F0] dark:border-[#243A55] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF7FF] dark:bg-[#102B43] text-[#009FE3]">
                    <History size={20} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                      Recent Attempts
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
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
                  <div className="hidden grid-cols-[28px_1.7fr_0.9fr_0.7fr_0.7fr_0.6fr_0.6fr] gap-4 bg-[#F7F9FC] dark:bg-[#07111F] px-6 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 md:grid">
                    <span>#</span>
                    <span>Test Name</span>
                    <span>Subject</span>
                    <span>Date</span>
                    <span>Score</span>
                    <span>Accuracy</span>
                    <span>Result</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {recentAttempts.map((attempt, index) => {
                      const test = testsById[attempt.test_id];
                      const accuracy = getAccuracy(attempt);
                      const maximum = Number(attempt.maximum_score || 0);
                      const score = Number(attempt.score || 0);

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
                          <span className="hidden text-xs font-black text-slate-400 dark:text-slate-500 md:block">
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
                              {test?.title || "Practice Test"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 md:hidden">
                              {test?.subject?.name || "Practice"} ·{" "}
                              {formatDate(attempt.submitted_at)}
                            </p>
                          </div>

                          <span className="hidden truncate text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 md:block">
                            {test?.subject?.name || "—"}
                          </span>

                          <span className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 md:block">
                            {formatDate(attempt.submitted_at)}
                          </span>

                          <span className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
                            {formatScore(score)}
                            <span className="font-bold text-slate-400 dark:text-slate-500">
                              {" "}
                              / {formatScore(maximum)}
                            </span>
                          </span>

                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${
                              accuracy >= 80
                                ? "bg-[#009FE3]/10 text-[#009FE3]"
                                : accuracy >= 60
                                  ? "bg-[#F6C400]/10 text-[#A56A00]"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-600"
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
                                <ArrowRight size={13} />
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            <section className="rounded-[26px] border border-[#E2E8F0] dark:border-[#243A55] bg-white dark:bg-[#0D1B2E] p-6 shadow-[0_8px_25px_rgba(16,35,63,0.05)]">
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
                  <div key={tip} className="flex gap-3">
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-[#009FE3]"
                    />
                    <p className="text-xs leading-5 font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">
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

          {/* =====================================================
              FOOTER MOTIVATION
          ====================================================== */}
          <section className="mt-8 overflow-hidden rounded-[24px] border border-[#F6C400]/15 bg-[#FFF9EC] px-6 py-5 text-center sm:px-8">
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
              <span className="text-2xl font-black text-[#F6C400]">“</span>

              <p className="text-sm font-bold italic text-slate-500 dark:text-slate-400 dark:text-slate-500">
                Success is the sum of small efforts, repeated day in and day out.
              </p>

              <span className="text-xs font-black text-[#A56A00]">
                — Robert Collier
              </span>
            </div>
          </section>

          {/* ACCOUNT ACTION */}
          <div className="mt-7 flex flex-col gap-4 rounded-[22px] border border-[#E2E8F0] dark:border-[#243A55] bg-white dark:bg-[#0D1B2E] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
                {user.email}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Your completed attempts are securely stored in your account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-[#0D1B2E] px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-50 dark:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={17} />
              {signingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;
