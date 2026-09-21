import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ListChecks,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMemo } from "react";

import Header from "./Header";
import { useEffect, useState } from "react";
import {
  getTests as getSupabaseTests,
  getQuestions as getSupabaseQuestions,
} from "../services/examService";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

function ResultPage() {
  const {
    examId,
    trackId,
    subjectId,
    setId,
  } = useParams();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attemptIdFromUrl = searchParams.get("attemptId");
  const { user, loading: authLoading } = useAuth();

  const [reviewFilter, setReviewFilter] = useState("all");

  /* =========================================================
     LOAD TEST + SAVED ATTEMPT

     Tests are now loaded from Supabase.
     The submitted attempt contains the exact shuffled question
     snapshots used during the quiz, so ResultPage can evaluate
     the same option indexes the user actually saw.
  ========================================================= */

  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadResult() {
      try {
        setLoading(true);
        setLoadError(null);
        setTest(null);
        setAttempt(null);

        const setNumber = setId?.replace("set-", "");

        if (!examId || !trackId || !subjectId || !setNumber) {
          throw new Error("Invalid result URL.");
        }

        if (authLoading) {
          return;
        }

        if (!user) {
          navigate("/login", {
            state: {
              from: window.location.pathname + window.location.search,
            },
            replace: true,
          });
          return;
        }

        const testData = await getSupabaseTests(subjectId);

        const selectedTest = (testData || []).find(
          (item) =>
            String(item.set_number) === String(setNumber)
        );

        if (!selectedTest) {
          throw new Error("Test not found.");
        }

        const formattedTest = {
          id: selectedTest.id,
          subjectId: selectedTest.subject_id,
          title: selectedTest.title,
          setNumber: selectedTest.set_number,
          totalQuestions: selectedTest.total_questions,
          durationMinutes: selectedTest.duration_minutes,
          marksPerQuestion: Number(
            selectedTest.marks_per_question ?? 1
          ),
          negativeMarks: Number(
            selectedTest.negative_marks ?? 0
          ),
          subject: subjectId,
          exam: examId,
        };

        const attemptId =
          attemptIdFromUrl ||
          (() => {
            try {
              const saved = sessionStorage.getItem(
                `quiz-attempt-${selectedTest.id}`
              );
              return saved ? JSON.parse(saved)?.attemptId : null;
            } catch {
              return null;
            }
          })();

        if (!attemptId) {
          throw new Error(
            "This result session could not be identified. Please complete the test again."
          );
        }

        const { data: attemptRow, error: attemptError } =
          await supabase
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
            .eq("id", attemptId)
            .eq("user_id", user.id)
            .eq("test_id", selectedTest.id)
            .single();

        if (attemptError) {
          throw attemptError;
        }

        const { data: answerRows, error: answersError } =
          await supabase
            .from("attempt_answers")
            .select(`
              id,
              attempt_id,
              question_id,
              selected_answer,
              is_correct,
              marked_for_review,
              answered_at
            `)
            .eq("attempt_id", attemptRow.id);

        if (answersError) {
          throw answersError;
        }

        let savedAttempt = null;

        try {
          const saved = sessionStorage.getItem(
            `quiz-attempt-${selectedTest.id}`
          );
          savedAttempt = saved ? JSON.parse(saved) : null;
        } catch {
          savedAttempt = null;
        }

        const snapshotMap = new Map(
          (savedAttempt?.questionSnapshots || []).map(
            (question) => [question.id, question]
          )
        );

        let questionSnapshots = savedAttempt?.questionSnapshots || [];

        // If the browser session still has the quiz snapshot, preserve the
        // exact shuffled order the user saw. Otherwise fall back to the
        // original Supabase question order.
        if (questionSnapshots.length === 0) {
          const dbQuestions = await getSupabaseQuestions(
            selectedTest.id
          );

          questionSnapshots = (dbQuestions || []).map(
            (question) => ({
              id: question.id,
              testId: question.test_id,
              question: question.question_text,
              q: question.question_text,
              text: question.question_text,
              options: [
                question.option_a,
                question.option_b,
                question.option_c,
                question.option_d,
              ],
              correctAnswer: Number(
                question.correct_answer
              ),
              ans: Number(question.correct_answer),
              marks: Number(question.marks ?? 1),
              negativeMarks: Number(
                question.negative_marks ?? 0
              ),
              type: question.question_type || "single",
              displayOrder: Number(
                question.display_order ?? 0
              ),
              originalOptionIndexes: [0, 1, 2, 3],
              originalCorrectAnswer: Number(
                question.correct_answer
              ),
            })
          );
        }

        const answers = {};
        const markedForReview = {};

        (answerRows || []).forEach((row) => {
          const question = snapshotMap.get(row.question_id);
          let uiAnswer = row.selected_answer;

          if (row.selected_answer !== null && question) {
            const mapping = question.originalOptionIndexes || [];
            const mappedIndex = mapping.indexOf(
              Number(row.selected_answer)
            );

            if (mappedIndex >= 0) {
              uiAnswer = mappedIndex;
            }
          }

          if (uiAnswer !== null && uiAnswer !== undefined) {
            answers[row.question_id] = Number(uiAnswer);
          }

          const snapshotIndex = questionSnapshots.findIndex(
            (item) => item.id === row.question_id
          );

          if (snapshotIndex >= 0) {
            markedForReview[snapshotIndex] =
              !!row.marked_for_review;
          }
        });

        const timeTakenSeconds = Number(
          attemptRow.time_taken_seconds ?? 0
        );
        const durationSeconds =
          Number(formattedTest.durationMinutes || 0) * 60;

        const parsedAttempt = {
          ...(savedAttempt || {}),
          attemptId: attemptRow.id,
          userId: attemptRow.user_id,
          testId: attemptRow.test_id,
          answers,
          markedForReview,
          submittedAt: attemptRow.submitted_at,
          startedAt: attemptRow.started_at,
          timeRemaining: Math.max(
            0,
            durationSeconds - timeTakenSeconds
          ),
          timeTakenSeconds,
          answeredQuestions: attemptRow.answered_questions,
          correctAnswers: attemptRow.correct_answers,
          wrongAnswers: attemptRow.wrong_answers,
          unansweredQuestions: attemptRow.unanswered_questions,
          markedQuestions: attemptRow.marked_questions,
          score: Number(attemptRow.score ?? 0),
          maximumScore: Number(
            attemptRow.maximum_score ?? 0
          ),
          questionSnapshots,
        };

        if (!cancelled) {
          setTest(formattedTest);
          setAttempt(parsedAttempt);
        }
      } catch (err) {
        console.error(
          "Failed to load result from Supabase:",
          err
        );

        if (!cancelled) {
          setLoadError(
            err?.message || "Unable to load result."
          );
        }
      } finally {
        if (!cancelled && !authLoading) {
          setLoading(false);
        }
      }
    }

    loadResult();

    return () => {
      cancelled = true;
    };
  }, [
    examId,
    trackId,
    subjectId,
    setId,
    attemptIdFromUrl,
    user,
    authLoading,
    navigate,
  ]);

  /* =========================================================
     LOAD QUESTION SNAPSHOTS

     QuizPage stores the shuffled questions inside the attempt.
     This is required because selected answer indexes refer to
     the shuffled option order, not the original DB order.
  ========================================================= */

  const questions = useMemo(() => {
    if (!attempt?.questionSnapshots) {
      return [];
    }

    return attempt.questionSnapshots.map((question) => ({
      ...question,
      answer: Number(
        question.answer ??
        question.correctAnswer ??
        question.ans
      ),
      correctAnswer: Number(
        question.correctAnswer ??
        question.answer ??
        question.ans
      ),
    }));
  }, [attempt]);

  /* =========================================================
     CALCULATE RESULT
  ========================================================= */

  const result = useMemo(() => {
    if (!test || !attempt) {
      return null;
    }

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    let positiveMarks = 0;
    let negativeMarks = 0;

    const review = questions.map((question, index) => {
      const userAnswer =
        attempt.answers?.[question.id];

      const hasAnswer =
        userAnswer !== undefined &&
        userAnswer !== null &&
        userAnswer !== "";

      if (!hasAnswer) {
        unanswered += 1;

        return {
          question,
          questionNumber: index + 1,
          userAnswer: undefined,
          status: "unanswered",
        };
      }

      /*
       * Current system supports single-choice questions.
       * Multiple/numerical handling can be expanded later.
       */

      const isCorrect =
        userAnswer === question.answer;

      if (isCorrect) {
        correct += 1;

        const marks =
          Number(
            question.marks ??
              test.marksPerQuestion ??
              4
          );

        positiveMarks += marks;

        return {
          question,
          questionNumber: index + 1,
          userAnswer,
          status: "correct",
        };
      }

      wrong += 1;

      const negative =
        Number(
          question.negativeMarks ??
            test.negativeMarks ??
            1
        );

      negativeMarks += negative;

      return {
        question,
        questionNumber: index + 1,
        userAnswer,
        status: "wrong",
      };
    });

    const attempted =
      correct + wrong;

    const totalQuestions =
      questions.length;

    const score =
      Number.isFinite(Number(attempt.score))
        ? Number(attempt.score)
        : positiveMarks - negativeMarks;

    const maximumMarks =
      Number(attempt.maximumScore ?? 0) > 0
        ? Number(attempt.maximumScore)
        : questions.reduce(
            (total, question) =>
              total +
              Number(
                question.marks ??
                  test.marksPerQuestion ??
                  1
              ),
            0
          );

    const accuracy =
      attempted > 0
        ? Math.round(
            (correct / attempted) * 100
          )
        : 0;

    const timeLimit =
      Number(
        test.durationMinutes ?? 60
      ) * 60;

    const timeRemaining =
      Number(
        attempt.timeRemaining ?? 0
      );

    const timeUsed = Math.max(
      0,
      timeLimit - timeRemaining
    );

    return {
      correct,
      wrong,
      unanswered,
      attempted,
      totalQuestions,
      positiveMarks,
      negativeMarks,
      score,
      maximumMarks,
      accuracy,
      timeUsed,
      review,
    };
  }, [
    test,
    attempt,
    questions,
  ]);

  const filteredReview = useMemo(() => {
    if (!result?.review) return [];
    if (reviewFilter === "all") return result.review;

    if (reviewFilter === "answered") {
      return result.review.filter(
        (item) => item.status === "correct" || item.status === "wrong"
      );
    }

    return result.review.filter(
      (item) => item.status === reviewFilter
    );
  }, [result, reviewFilter]);

  /* =========================================================
     FORMAT TIME
  ========================================================= */

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(
      0,
      Number(seconds || 0)
    );

    const minutes = Math.floor(
      safeSeconds / 60
    );

    const remainingSeconds =
      safeSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  /* =========================================================
     LOADING RESULT
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9E8] px-4">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] p-8 text-center shadow-lg">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#009FE3]/20 border-t-[#009FE3]" />

          <h1 className="mt-5 text-xl font-black text-[#10233F]">
            Loading Result
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Loading your test result...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     LOAD ERROR
  ========================================================= */

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9E8] px-4">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] p-8 text-center shadow-lg">
          <h1 className="text-xl font-black text-[#10233F]">
            Unable to Load Result
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#009FE3] px-5 py-3 text-sm font-black text-white transition hover:bg-[#006A9C]"
          >
            <ArrowLeft size={17} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     INVALID TEST
  ========================================================= */

  if (!test) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9E8] px-4">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] p-8 text-center shadow-lg">
          <h1 className="text-xl font-black text-[#10233F]">
            Test Not Found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            The result you are trying to access does
            not exist.
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#009FE3] px-5 py-3 text-sm font-black text-white transition hover:bg-[#006A9C]"
          >
            <ArrowLeft size={17} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     NO ATTEMPT
  ========================================================= */

  if (!attempt || !result) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-[#F8FAFC] dark:bg-[#07111F] dark:text-[#F8FAFC]">
        <Header />

        <main className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl rounded-3xl border border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E] dark:border-[#243A55] dark:bg-[#0D1B2E] p-8 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#FFF9E8] text-[#F0A000]">
              <ListChecks size={28} />
            </div>

            <h1 className="mt-5 text-2xl font-black">
              Result Not Available
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              No completed attempt was found for{" "}
              {test.title}.
            </p>

            <Link
              to={`/exam/${examId}/${trackId}/subject/${subjectId}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#009FE3]/15 transition hover:-translate-y-0.5"
            >
              <ArrowLeft size={17} />
              Back to Sets
            </Link>
          </div>
        </main>
      </div>
    );
  }

  /* =========================================================
     MAIN RESULT PAGE
  ========================================================= */

  const scorePercentage =
    result.maximumMarks > 0
      ? Math.max(0, Math.min(100, Math.round((result.score / result.maximumMarks) * 100)))
      : 0;

  const attemptedPercentage =
    result.totalQuestions > 0
      ? Math.round((result.attempted / result.totalQuestions) * 100)
      : 0;

  const performanceLabel =
    scorePercentage >= 80
      ? "Excellent Performance"
      : scorePercentage >= 60
        ? "Strong Performance"
        : scorePercentage >= 40
          ? "Good Effort"
          : "Keep Practicing";

  const performanceMessage =
    scorePercentage >= 80
      ? "Excellent work. You are showing strong command of this subject."
      : scorePercentage >= 60
        ? "Good performance. A little more practice can push you even higher."
        : scorePercentage >= 40
          ? "You are building a solid foundation. Review the weak areas and try again."
          : "Every attempt is progress. Review the answers below and strengthen your basics.";

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-[#F8FAFC]">
      <Header />

      <main className="px-3 py-5 sm:px-5 sm:py-7 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to={`/exam/${examId}/${trackId}/subject/${subjectId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-extrabold text-[#003B82] shadow-sm transition hover:-translate-y-0.5 hover:border-[#009FE3]/40 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:text-[#19B8F2]"
            >
              <ArrowLeft size={15} />
              Back to {test.subject} sets
            </Link>

            <div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:flex">
              <span>Result</span><span>•</span><span>{test.exam}</span>
              <span>•</span><span>Set {test.setNumber}</span>
            </div>
          </div>

          <section className="relative mt-5 overflow-hidden rounded-[28px] border border-[#DCE6F0] bg-white shadow-[0_16px_45px_rgba(16,35,63,0.08)] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-none">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#003B82] via-[#009FE3] to-[#F6C400]" />

            <div className="relative overflow-hidden bg-gradient-to-br from-[#F3F9FF] via-white to-[#FFF9E8] px-5 pb-7 pt-8 sm:px-8 sm:pb-9 sm:pt-10 dark:from-[#0D1B2E] dark:via-[#07111F] dark:to-[#12243B]">
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#009FE3]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#F6C400]/10 blur-3xl" />

              <div className="relative mx-auto max-w-5xl">
                <div className="flex flex-col items-center text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#F6C400]/30 bg-[#FFF9E8] text-[#F0A000] shadow-sm sm:h-[72px] sm:w-[72px] dark:border-[#FFD23F]/20 dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]">
                    <Trophy size={30} strokeWidth={2.2} />
                  </div>

                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#009FE3] dark:text-[#19B8F2]">
                    Test Completed
                  </p>

                  <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-[#001F4F] sm:text-4xl dark:text-white">
                    {test.title}
                  </h1>

                  <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-[#A8B4C5]">
                    {test.exam} <span className="mx-1.5 text-slate-300 dark:text-[#243A55]">•</span> {test.subject}
                  </p>

                  <div className="mt-7 grid w-full max-w-3xl gap-4 sm:grid-cols-[1.15fr_.85fr] sm:items-stretch">
                    <div className="relative overflow-hidden rounded-2xl border border-[#F6C400]/35 bg-white px-5 py-5 text-left shadow-[0_10px_28px_rgba(246,196,0,0.10)] dark:border-[#FFD23F]/25 dark:bg-[#0D1B2E]">
                      <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-[#F6C400]/10" />
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-[#A8B4C5]">
                        Your Score
                      </p>
                      <div className="mt-1 flex items-end gap-2">
                        <span className="text-5xl font-black leading-none tracking-tight text-[#009FE3] sm:text-6xl dark:text-[#19B8F2]">
                          {result.score}
                        </span>
                        <span className="pb-1 text-base font-black text-slate-400">
                          / {result.maximumMarks}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-[#12243B]">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#003B82] to-[#19B8F2]" style={{ width: `${scorePercentage}%` }} />
                        </div>
                        <span className="text-xs font-black text-[#003B82] dark:text-[#19B8F2]">
                          {scorePercentage}%
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#DCE6F0] bg-white/80 px-5 py-5 text-left dark:border-[#29425F] dark:bg-[#12243B]/80">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-[#A8B4C5]">
                            Performance
                          </p>
                          <h2 className="mt-1 text-lg font-black text-[#001F4F] dark:text-white">
                            {performanceLabel}
                          </h2>
                        </div>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF6FD] text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                          <CheckCircle2 size={18} />
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-[#A8B4C5]">
                        {performanceMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-[#E2E8F0] dark:border-[#243A55] sm:grid-cols-4">
              {[
                ["Correct", result.correct, CheckCircle2, "bg-[#EAF6FD] text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]", "text-[#003B82] dark:text-[#19B8F2]"],
                ["Wrong", result.wrong, XCircle, "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300", "text-red-600 dark:text-red-300"],
                ["Unanswered", result.unanswered, ListChecks, "bg-slate-100 text-slate-500 dark:bg-[#12243B] dark:text-[#A8B4C5]", "text-slate-700 dark:text-[#D7E0EA]"],
                ["Accuracy", `${result.accuracy}%`, Trophy, "bg-[#FFF8D9] text-[#805F00] dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]", "text-[#805F00] dark:text-[#FFD23F]"],
              ].map(([label, value, Icon, box, valueClass], index) => (
                <div
                  key={label}
                  className={`p-4 sm:p-5 ${index < 2 ? "border-b border-[#E2E8F0] dark:border-[#243A55] sm:border-b-0" : ""} ${index % 2 === 0 ? "border-r border-[#E2E8F0] dark:border-[#243A55] sm:border-r-0" : ""} ${index < 3 ? "sm:border-r sm:border-[#E2E8F0] sm:dark:border-[#243A55]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${box}`}>
                      <Icon size={17} />
                    </span>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-[#7F90A6]">{label}</p>
                      <p className={`mt-0.5 text-xl font-black ${valueClass}`}>{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#009FE3] dark:text-[#19B8F2]">Performance Overview</p>
                  <h2 className="mt-1 text-xl font-black text-[#001F4F] dark:text-white">Your attempt at a glance</h2>
                </div>
                <span className="rounded-full border border-[#E2E8F0] bg-[#F7F9FC] px-3 py-1.5 text-[10px] font-black text-slate-500 dark:border-[#243A55] dark:bg-[#12243B] dark:text-[#A8B4C5]">
                  {attemptedPercentage}% attempted
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#DCE6F0] bg-[#F8FBFE] p-4 dark:border-[#29425F] dark:bg-[#12243B]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#A8B4C5]">Questions Attempted</span>
                    <span className="text-sm font-black text-[#003B82] dark:text-[#19B8F2]">{result.attempted}/{result.totalQuestions}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-[#07111F]">
                    <div className="h-full rounded-full bg-[#009FE3]" style={{ width: `${attemptedPercentage}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E9DFAF] bg-[#FFFDF2] p-4 dark:border-[#66571E] dark:bg-[#2A2512]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#A8B4C5]">Accuracy</span>
                    <span className="text-sm font-black text-[#805F00] dark:text-[#FFD23F]">{result.accuracy}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3E9B7] dark:bg-[#403816]">
                    <div className="h-full rounded-full bg-[#F6C400]" style={{ width: `${result.accuracy}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["Time Used", formatTime(result.timeUsed), "text-[#10233F] dark:text-white"],
                  ["Positive", `+${result.positiveMarks}`, "text-[#003B82] dark:text-[#19B8F2]"],
                  ["Negative", `-${result.negativeMarks}`, "text-red-600 dark:text-red-300"],
                ].map(([label, value, valueClass]) => (
                  <div key={label} className="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] p-3 dark:border-[#243A55] dark:bg-[#07111F]">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-[#7F90A6]">{label}</p>
                    <p className={`mt-1 text-base font-black ${valueClass}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#DCE6F0] bg-gradient-to-br from-[#001F4F] to-[#003B82] p-5 text-white shadow-[0_14px_35px_rgba(0,31,79,0.18)] sm:p-6">
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7DD8FF]">What Next?</p>
                    <h2 className="mt-1 text-xl font-black">Keep your momentum</h2>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#FFD23F]"><RotateCcw size={19} /></div>
                </div>
                <p className="mt-3 text-xs leading-5 text-blue-100">
                  Review the questions you missed, then take the test again to improve your score.
                </p>
                <div className="mt-auto grid gap-2.5 pt-6">
                  <Link
                    to={`/exam/${examId}/${trackId}/quiz/${subjectId}/${setId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F6C400] px-4 py-3 text-xs font-black text-[#10233F] transition hover:-translate-y-0.5 hover:bg-[#FFD23F]"
                  >
                    <RotateCcw size={15} /> Try Again
                  </Link>
                  <Link
                    to={`/exam/${examId}/${trackId}/subject/${subjectId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-black text-white transition hover:bg-white/15"
                  >
                    <ListChecks size={15} /> More Practice Sets
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#009FE3] dark:text-[#19B8F2]">
                    Detailed Review
                  </p>
                  <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#001F4F] dark:text-white">
                    Question-wise Review
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#A8B4C5]">
                    See your answer, the correct answer, and the result for every question.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-[9px] font-black">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF6FD] px-2.5 py-1.5 text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#009FE3]" />
                    {result.correct} Correct
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1.5 text-red-600 dark:bg-red-400/10 dark:text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {result.wrong} Wrong
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-slate-500 dark:bg-[#12243B] dark:text-[#A8B4C5]">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    {result.unanswered} Unanswered
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC] p-2 dark:border-[#243A55] dark:bg-[#0B1728]">
                {[
                  ["all", "All Questions", result.totalQuestions],
                  ["answered", "Answered", result.attempted],
                  ["wrong", "Wrong", result.wrong],
                  ["unanswered", "Unanswered", result.unanswered],
                ].map(([key, label, count]) => {
                  const active = reviewFilter === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setReviewFilter(key)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black transition ${
                        active
                          ? "bg-[#003B82] text-white shadow-sm dark:bg-[#19B8F2] dark:text-[#07111F]"
                          : "text-slate-500 hover:bg-white hover:text-[#003B82] dark:text-[#A8B4C5] dark:hover:bg-[#12243B] dark:hover:text-[#19B8F2]"
                      }`}
                    >
                      {label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                          active
                            ? "bg-white/15"
                            : "bg-slate-200 text-slate-500 dark:bg-[#243A55] dark:text-[#A8B4C5]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              {filteredReview.map((item) => {
                const { question, questionNumber, userAnswer, status } = item;

                const statusConfig = {
                  correct: {
                    label: "Correct",
                    wrapper: "border-[#BFE8FA] bg-white dark:border-[#24506A] dark:bg-[#0D1B2E]",
                    top: "bg-[#EAF6FD] dark:bg-[#19B8F2]/10",
                    badge: "bg-[#009FE3] text-white",
                    icon: <CheckCircle2 size={15} />,
                    accent: "bg-[#009FE3]",
                  },
                  wrong: {
                    label: "Wrong",
                    wrapper: "border-red-100 bg-white dark:border-red-400/20 dark:bg-[#0D1B2E]",
                    top: "bg-red-50 dark:bg-red-400/10",
                    badge: "bg-red-500 text-white",
                    icon: <XCircle size={15} />,
                    accent: "bg-red-500",
                  },
                  unanswered: {
                    label: "Unanswered",
                    wrapper: "border-[#E2E8F0] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E]",
                    top: "bg-slate-50 dark:bg-[#12243B]",
                    badge: "bg-slate-200 text-slate-600 dark:bg-[#243A55] dark:text-[#D7E0EA]",
                    icon: <ListChecks size={15} />,
                    accent: "bg-slate-400",
                  },
                };

                const config = statusConfig[status];

                return (
                  <article key={question.id} className={`overflow-hidden rounded-2xl border shadow-sm ${config.wrapper}`}>
                    <div className={`border-b border-black/5 px-4 py-3 dark:border-white/5 sm:px-5 ${config.top}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-[#003B82] shadow-sm dark:bg-[#0D1B2E] dark:text-[#19B8F2]">{questionNumber}</span>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-[#7F90A6]">Question</p>
                            <p className="truncate text-xs font-black text-[#001F4F] dark:text-white">Question {questionNumber}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-black ${config.badge}`}>
                          {config.icon}{config.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-7 w-1 shrink-0 rounded-full ${config.accent}`} />
                        <p className="text-sm font-bold leading-6 text-[#10233F] dark:text-[#F8FAFC] sm:text-[15px]">{question.question}</p>
                      </div>

                      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                        {question.options?.map((option, optionIndex) => {
                          const isCorrect = optionIndex === question.answer;
                          const isUserAnswer = optionIndex === userAnswer;

                          let optionClass = "border-[#E2E8F0] bg-[#F7F9FC] dark:border-[#243A55] dark:bg-[#12243B]";
                          let letterClass = "bg-white text-[#003B82] dark:bg-[#0D1B2E] dark:text-[#19B8F2]";

                          if (isCorrect) {
                            optionClass = "border-[#009FE3]/35 bg-[#EAF6FD] dark:border-[#19B8F2]/30 dark:bg-[#19B8F2]/10";
                            letterClass = "bg-[#009FE3] text-white dark:bg-[#19B8F2] dark:text-[#07111F]";
                          } else if (isUserAnswer && status === "wrong") {
                            optionClass = "border-red-200 bg-red-50 dark:border-red-400/25 dark:bg-red-400/10";
                            letterClass = "bg-red-500 text-white";
                          }

                          return (
                            <div key={`${question.id}-${optionIndex}`} className={`rounded-xl border p-3 ${optionClass}`}>
                              <div className="flex items-start gap-2.5">
                                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-black ${letterClass}`}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold leading-5 text-[#10233F] dark:text-[#F8FAFC]">{option}</p>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {isCorrect && <span className="rounded-full bg-[#009FE3]/10 px-2 py-0.5 text-[9px] font-black text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">Correct Answer</span>}
                                    {isUserAnswer && status === "wrong" && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-black text-red-600 dark:text-red-300">Your Answer</span>}
                                    {isUserAnswer && status === "correct" && <span className="rounded-full bg-[#009FE3]/10 px-2 py-0.5 text-[9px] font-black text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">Your Answer</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {status === "unanswered" && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[10px] font-bold text-slate-500 dark:bg-[#12243B] dark:text-[#A8B4C5]">
                          <ListChecks size={14} /> You did not answer this question.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

              {filteredReview.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#DCE6F0] bg-white px-5 py-10 text-center dark:border-[#29425F] dark:bg-[#0D1B2E]">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF6FD] text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                    <ListChecks size={22} />
                  </div>
                  <h3 className="mt-3 text-sm font-black text-[#001F4F] dark:text-white">
                    No questions in this filter
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#A8B4C5]">
                    Choose another filter to view the corresponding questions.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#E2E8F0] pt-6 dark:border-[#243A55] sm:flex-row sm:items-center sm:justify-between">
            <Link
              to={`/exam/${examId}/${trackId}/subject/${subjectId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-xs font-black text-[#10233F] transition hover:border-[#009FE3]/40 hover:text-[#003B82] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:text-[#D7E0EA] dark:hover:border-[#19B8F2]/40 dark:hover:text-[#19B8F2]"
            >
              <ArrowLeft size={15} /> Back to Practice Sets
            </Link>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link
                to={`/exam/${examId}/${trackId}/quiz/${subjectId}/${setId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#009FE3]/30 bg-[#EAF6FD] px-5 py-3 text-xs font-black text-[#003B82] transition hover:-translate-y-0.5 hover:bg-[#DDF2FC] dark:border-[#19B8F2]/25 dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]"
              >
                <RotateCcw size={15} /> Try Again
              </Link>
              <Link
                to={`/exam/${examId}/${trackId}/subject/${subjectId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <ListChecks size={15} /> More Sets
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
export default ResultPage;