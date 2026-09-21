import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  History,
  Search,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

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

function accuracyClass(accuracy) {
  if (accuracy >= 80) {
    return "bg-[#009FE3]/10 text-[#009FE3]";
  }

  if (accuracy >= 60) {
    return "bg-[#F6C400]/10 text-[#A56A00]";
  }

  return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-600";
}

function EmptyState({ filtered }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF7FF] via-white to-[#FFF9E8] dark:from-[#0D1B2E] dark:via-[#07111F] dark:to-[#12243B] text-[#009FE3]">
        {filtered ? <Filter size={24} /> : <History size={24} />}
      </div>

      <h3 className="mt-5 text-lg font-black text-[#10233F] dark:text-[#F4F7F6]">
        {filtered ? "No matching attempts" : "No attempts yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400 dark:text-slate-500">
        {filtered
          ? "Try changing your search or filters to find another completed test."
          : "Complete your first practice test and your attempt history will appear here."}
      </p>

      {!filtered ? (
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#009FE3]/15 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          Explore Tests
          <ArrowRight size={17} />
        </Link>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] px-8 py-7 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#009FE3]/20 border-t-[#009FE3]" />
        <p className="mt-4 text-sm font-bold text-[#10233F] dark:text-[#F4F7F6]">
          Loading your attempts...
        </p>
      </div>
    </div>
  );
}

function AttemptCard({ attempt, test }) {
  const accuracy = getAccuracy(attempt);
  const score = Number(attempt.score || 0);
  const maximum = Number(attempt.maximum_score || 0);

  const resultUrl =
    test?.examId &&
    test?.track?.id &&
    test?.subject?.id &&
    test?.set_number
      ? `/exam/${test.examId}/${test.track.id}/result/${test.subject.id}/set-${test.set_number}?attemptId=${attempt.id}`
      : null;

  return (
    <article className="rounded-[22px] border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#009FE3]/10 text-[#009FE3]">
                <BookOpen size={18} />
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-[#10233F] dark:text-[#F4F7F6] sm:text-lg">
                  {test?.title || "Practice Test"}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  {test?.subject?.name ? (
                    <span>{test.subject.name}</span>
                  ) : null}

                  {test?.set_number ? (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>Set {test.set_number}</span>
                    </>
                  ) : null}

                  {test?.track?.name ? (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>{test.track.name}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <span
            className={`self-start rounded-full px-3 py-1.5 text-xs font-black ${accuracyClass(
              accuracy
            )}`}
          >
            {accuracy}% Accuracy
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-[#F7F9FC] dark:bg-[#07111F] p-3.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Score
            </p>
            <p className="mt-1 text-base font-black text-[#10233F] dark:text-[#F4F7F6]">
              {formatScore(score)}
              <span className="font-bold text-slate-400 dark:text-slate-500">
                {" "}
                / {formatScore(maximum)}
              </span>
            </p>
          </div>

          <div className="rounded-xl bg-[#F7F9FC] dark:bg-[#07111F] p-3.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Correct
            </p>
            <p className="mt-1 text-base font-black text-[#009FE3]">
              {attempt.correct_answers || 0}
            </p>
          </div>

          <div className="rounded-xl bg-[#F7F9FC] dark:bg-[#07111F] p-3.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Wrong
            </p>
            <p className="mt-1 text-base font-black text-[#10233F] dark:text-[#F4F7F6]">
              {attempt.wrong_answers || 0}
            </p>
          </div>

          <div className="rounded-xl bg-[#F7F9FC] dark:bg-[#07111F] p-3.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Time
            </p>
            <p className="mt-1 text-base font-black text-[#10233F] dark:text-[#F4F7F6]">
              {formatDuration(attempt.time_taken_seconds)}
            </p>
          </div>

          <div className="rounded-xl bg-[#F7F9FC] dark:bg-[#07111F] p-3.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Date
            </p>
            <p className="mt-1 text-sm font-black text-[#10233F] dark:text-[#F4F7F6]">
              {formatDate(attempt.submitted_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E2E8F0] dark:border-[#243A55] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Target size={14} className="text-[#009FE3]" />
              {attempt.total_questions || 0} Questions
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#009FE3]" />
              {attempt.answered_questions || 0} Attempted
            </span>

            {attempt.marked_questions ? (
              <span className="inline-flex items-center gap-1.5">
                <Trophy size={14} className="text-[#D28725]" />
                {attempt.marked_questions} Marked
              </span>
            ) : null}
          </div>

          {resultUrl ? (
            <Link
              to={resultUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              View Result
              <ArrowRight size={15} />
            </Link>
          ) : (
            <span className="text-xs font-bold text-slate-300 dark:text-slate-600">
              Result unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function AttemptsPage() {
  const { user, loading: authLoading } = useAuth();

  const [attempts, setAttempts] = useState([]);
  const [testsById, setTestsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  async function loadAttempts() {
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
          safeAttempts
            .map((attempt) => attempt.test_id)
            .filter(Boolean)
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
          (testData || [])
            .map((test) => test.subject_id)
            .filter(Boolean)
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
          const { data: trackData, error: trackError } = await supabase
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
      console.error("Failed to load attempts:", err);
      setError(
        err?.message || "Unable to load your attempt history."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadAttempts();
    }
  }, [authLoading, user?.id]);

  const examOptions = useMemo(() => {
    const values = new Map();

    attempts.forEach((attempt) => {
      const test = testsById[attempt.test_id];
      if (!test?.track?.exam_id) return;

      const examId = test.track.exam_id;

      if (!values.has(examId)) {
        values.set(examId, examId.toUpperCase());
      }
    });

    return [...values.entries()];
  }, [attempts, testsById]);

  const subjectOptions = useMemo(() => {
    const values = new Map();

    attempts.forEach((attempt) => {
      const subject = testsById[attempt.test_id]?.subject;

      if (subject?.id && subject?.name) {
        values.set(subject.id, subject.name);
      }
    });

    return [...values.entries()].sort((a, b) =>
      a[1].localeCompare(b[1])
    );
  }, [attempts, testsById]);

  const filteredAttempts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = attempts.filter((attempt) => {
      const test = testsById[attempt.test_id];
      const subject = test?.subject;
      const track = test?.track;

      const searchable = [
        test?.title,
        subject?.name,
        track?.name,
        track?.exam_id,
        test?.set_number
          ? `set ${test.set_number}`
          : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesExam =
        examFilter === "all" ||
        track?.exam_id === examFilter;

      const matchesSubject =
        subjectFilter === "all" ||
        subject?.id === subjectFilter;

      return (
        matchesSearch &&
        matchesExam &&
        matchesSubject
      );
    });

    return [...result].sort((a, b) => {
      const dateA = new Date(a.submitted_at || 0).getTime();
      const dateB = new Date(b.submitted_at || 0).getTime();

      if (sortOrder === "oldest") {
        return dateA - dateB;
      }

      if (sortOrder === "highest") {
        return (
          Number(b.score || 0) /
            Math.max(Number(b.maximum_score || 1), 1) -
          Number(a.score || 0) /
            Math.max(Number(a.maximum_score || 1), 1)
        );
      }

      if (sortOrder === "accuracy") {
        return getAccuracy(b) - getAccuracy(a);
      }

      return dateB - dateA;
    });
  }, [
    attempts,
    testsById,
    search,
    examFilter,
    subjectFilter,
    sortOrder,
  ]);

  const totalScore = useMemo(
    () =>
      filteredAttempts.reduce(
        (sum, attempt) => sum + Number(attempt.score || 0),
        0
      ),
    [filteredAttempts]
  );

  const averageAccuracy = useMemo(() => {
    if (!filteredAttempts.length) return 0;

    const attempted = filteredAttempts.reduce(
      (sum, attempt) =>
        sum + Number(attempt.answered_questions || 0),
      0
    );

    const correct = filteredAttempts.reduce(
      (sum, attempt) =>
        sum + Number(attempt.correct_answers || 0),
      0
    );

    return attempted
      ? Math.round((correct / attempted) * 100)
      : 0;
  }, [filteredAttempts]);

  function clearFilters() {
    setSearch("");
    setExamFilter("all");
    setSubjectFilter("all");
    setSortOrder("latest");
  }

  const hasFilters =
    search ||
    examFilter !== "all" ||
    subjectFilter !== "all" ||
    sortOrder !== "latest";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F] text-[#10233F] dark:text-[#F4F7F6]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <LoadingState />
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F] text-[#10233F] dark:text-[#F4F7F6]">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#EEF7FF] via-white to-[#FFF9E8] dark:from-[#0D1B2E] dark:via-[#07111F] dark:to-[#12243B]">
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#F6C400]/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#009FE3]/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 dark:text-slate-500 transition hover:text-[#009FE3]"
            >
              <ArrowLeft size={15} />
              Back to Dashboard
            </Link>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#F6C400]/30 bg-white dark:bg-[#0D1B2E] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#A56A00] shadow-sm">
                  <History size={14} />
                  Test History
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#10233F] dark:text-[#F4F7F6] sm:text-5xl">
                  My{" "}
                  <span className="text-[#009FE3]">
                    Attempts
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 dark:text-slate-600 sm:text-base">
                  Review every completed practice test, compare your scores,
                  and identify where you can improve.
                </p>
              </div>

              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#009FE3]/15 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <BookOpen size={17} />
                Take Another Test
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-[#0D1B2E] p-5 text-sm text-red-700 shadow-sm">
              <p className="font-black">Unable to load attempts</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={loadAttempts}
                className="mt-4 rounded-xl bg-[#009FE3] px-4 py-2 text-xs font-black text-white"
              >
                Try Again
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#009FE3]/10 text-[#009FE3]">
                  <History size={19} />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                    {filteredAttempts.length}
                  </p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    Matching Attempts
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6C400]/10 text-[#A56A00]">
                  <Trophy size={19} />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                    {formatScore(totalScore)}
                  </p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    Total Score
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10233F]/5 text-[#10233F] dark:text-[#F4F7F6]">
                  <Target size={19} />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                    {averageAccuracy}%
                  </p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    Average Accuracy
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <section className="mt-7 rounded-[24px] border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="attempt-search"
                  className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 dark:text-slate-500"
                >
                  Search
                </label>

                <div className="relative">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  />

                  <input
                    id="attempt-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search test, subject or exam..."
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] dark:border-[#243A55] bg-[#F7F9FC] dark:bg-[#07111F] pl-10 pr-10 text-sm font-semibold text-[#10233F] dark:text-[#F4F7F6] outline-none transition placeholder:text-slate-400 dark:text-slate-500 dark:placeholder:text-slate-500 dark:text-slate-400 dark:text-slate-500 focus:border-[#009FE3]/40 focus:ring-4 focus:ring-[#009FE3]/5"
                  />

                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 dark:text-slate-600"
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[620px]">
                <div>
                  <label
                    htmlFor="attempt-exam"
                    className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 dark:text-slate-500"
                  >
                    Exam
                  </label>

                  <select
                    id="attempt-exam"
                    value={examFilter}
                    onChange={(event) => setExamFilter(event.target.value)}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] dark:border-[#243A55] bg-[#F7F9FC] dark:bg-[#07111F] px-3 text-sm font-bold text-[#10233F] dark:text-[#F4F7F6] outline-none focus:border-[#009FE3]/40"
                  >
                    <option value="all">All Exams</option>
                    {examOptions.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="attempt-subject"
                    className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 dark:text-slate-500"
                  >
                    Subject
                  </label>

                  <select
                    id="attempt-subject"
                    value={subjectFilter}
                    onChange={(event) =>
                      setSubjectFilter(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] dark:border-[#243A55] bg-[#F7F9FC] dark:bg-[#07111F] px-3 text-sm font-bold text-[#10233F] dark:text-[#F4F7F6] outline-none focus:border-[#009FE3]/40"
                  >
                    <option value="all">All Subjects</option>
                    {subjectOptions.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="attempt-sort"
                    className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 dark:text-slate-500"
                  >
                    Sort By
                  </label>

                  <select
                    id="attempt-sort"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] dark:border-[#243A55] bg-[#F7F9FC] dark:bg-[#07111F] px-3 text-sm font-bold text-[#10233F] dark:text-[#F4F7F6] outline-none focus:border-[#009FE3]/40"
                  >
                    <option value="latest">Latest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Score</option>
                    <option value="accuracy">Best Accuracy</option>
                  </select>
                </div>
              </div>
            </div>

            {hasFilters ? (
              <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] dark:border-[#243A55] pt-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  Filters are active
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#009FE3] hover:text-[#007CB5]"
                >
                  Clear Filters
                  <X size={14} />
                </button>
              </div>
            ) : null}
          </section>

          {/* Results */}
          <section className="mt-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
                  Completed Tests
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#10233F] dark:text-[#F4F7F6]">
                  Attempt History
                </h2>
              </div>

              <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 sm:flex">
                <CalendarDays size={15} className="text-[#009FE3]" />
                {filteredAttempts.length}{" "}
                {filteredAttempts.length === 1 ? "result" : "results"}
              </div>
            </div>

            {filteredAttempts.length === 0 ? (
              <EmptyState filtered={Boolean(hasFilters)} />
            ) : (
              <div className="space-y-4">
                {filteredAttempts.map((attempt) => (
                  <AttemptCard
                    key={attempt.id}
                    attempt={attempt}
                    test={testsById[attempt.test_id]}
                  />
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default AttemptsPage;
