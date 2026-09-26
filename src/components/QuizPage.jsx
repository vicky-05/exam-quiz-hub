import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


import { X } from "lucide-react";

import { createPortal } from "react-dom";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import QuizHeader from "../components/QuizHeader";
import QuizToolbar from "../components/QuizToolbar";
import QuestionPanel from "../components/QuestionPanel";
import QuestionPalette from "../components/QuestionPalette";
import QuizFooter from "../components/QuizFooter";
import SubmitModal from "../components/SubmitModal";
import ExitQuizModal from "../components/ExitQuizModal";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

import {
  getTests as getSupabaseTests,
  getMockTests as getSupabaseMockTests,
  getQuestions as getSupabaseQuestions,
} from "../services/examService";


/* =========================================================
   OPTION SHUFFLING

   Keeps the correct answer attached to its option while
   changing the visible option order for every quiz load.
========================================================= */

function shuffleQuestionOptions(question) {
  const options = [...(question.options || [])];
  const correctIndex = Number(question.correctAnswer);

  const indexedOptions = options.map((option, index) => ({
    option,
    originalIndex: index,
  }));

  // Fisher-Yates shuffle
  for (let i = indexedOptions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexedOptions[i], indexedOptions[j]] = [
      indexedOptions[j],
      indexedOptions[i],
    ];
  }

  const shuffledCorrectIndex =
    indexedOptions.findIndex(
      (item) => item.originalIndex === correctIndex
    );

  return {
    ...question,
    options: indexedOptions.map((item) => item.option),
    correctAnswer: shuffledCorrectIndex,
    ans: shuffledCorrectIndex,

    // Maps the displayed/shuffled option index back to the
    // original database option index (0 = A, 1 = B, etc.).
    originalOptionIndexes: indexedOptions.map(
      (item) => item.originalIndex
    ),

    originalCorrectAnswer: correctIndex,
  };
}


/* =========================================================
   QUIZ PAGE
========================================================= */

function isCustomTestCountValid(isCustomQuiz, count, max) {
  if (!isCustomQuiz) return false;
  return Number.isInteger(count) && count >= 1 && count <= max;
}

function shuffleArray(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function QuizPage() {

  const {
    examId,
    trackId,
    subjectId,
    setId,
    mockId,
  } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const isMockTest = Boolean(mockId);
  const searchParams = new URLSearchParams(location.search);
  const isCustomQuiz = !isMockTest && searchParams.get("custom") === "1";
  const requestedCustomCount = Number(searchParams.get("count") || 0);
  const questionOrder =
    searchParams.get("order") === "random" ||
    (isCustomQuiz && !searchParams.has("order"))
      ? "random"
      : "sequential";

  const {
    user,
    loading: authLoading,
    sessionRowId,
    deviceId,
  } = useAuth();

  const [savingAttempt, setSavingAttempt] = useState(false);


  /* =========================================================
     LOAD TEST + QUESTIONS FROM SUPABASE
  ========================================================= */

  const [test, setTest] = useState(null);

  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState(null);

  // Identifies this exact quiz so its in-progress state can be restored if
  // the browser recreates the page/tab.
  const activeQuizKey = useMemo(
    () =>
      `active-quiz-${examId || "unknown"}-${trackId || "unknown"}-${
        isMockTest
          ? `mock-${mockId || "unknown"}`
          : `practice-${subjectId || "unknown"}-${setId || "unknown"}`
      }-${isCustomQuiz ? `custom-${requestedCustomCount}` : "standard"}-${questionOrder}`,
    [
      examId,
      trackId,
      subjectId,
      setId,
      mockId,
      isMockTest,
      isCustomQuiz,
      requestedCustomCount,
      questionOrder,
    ]
  );

  const [quizHydrated, setQuizHydrated] = useState(false);


  useEffect(() => {

    let cancelled = false;

    async function loadQuiz() {

      /*
        Authentication gate:
        A quiz attempt is available only to authenticated users.
        Do not load the quiz/question data for logged-out visitors.
      */
      if (authLoading) {
        return;
      }

      if (!user) {
        navigate("/login", {
          replace: true,
          state: {
            from: `${location.pathname}${location.search}`,
          },
        });
        return;
      }

      try {

        setLoading(true);
        setLoadError(null);
        setTest(null);
        setQuestions([]);

        try {
          const stored = sessionStorage.getItem(activeQuizKey);
          const parsed = stored ? JSON.parse(stored) : null;

          if (
            parsed?.test &&
            Array.isArray(parsed.questions) &&
            parsed.questions.length > 0
          ) {
            if (!cancelled) {
              setTest(parsed.test);
              setQuestions(parsed.questions);
              setLoading(false);
            }
            return;
          }
        } catch (restoreError) {
          console.warn("Unable to restore active quiz:", restoreError);
        }

        const setNumber =
          setId?.replace("set-", "");

        const isMockTest = Boolean(mockId);

        if (!examId || !trackId || (!isMockTest && (!subjectId || !setNumber))) {
          throw new Error("Invalid quiz URL.");
        }

        let selectedTest = null;

        if (isMockTest) {
          const mockTests = await getSupabaseMockTests();

          selectedTest = (mockTests || []).find(
            (item) =>
              String(item.id) === String(mockId) &&
              String(item.track_id) === String(trackId)
          );
        } else {
          const testData = await getSupabaseTests(subjectId);

          selectedTest = (testData || []).find(
            (item) =>
              String(item.set_number) === String(setNumber)
          );
        }

        if (!selectedTest) {
          if (!cancelled) {
            setTest(null);
            setQuestions([]);
          }
          return;
        }

        const sourceTotalQuestions = Number(
          selectedTest.total_questions || 0
        );

        const customCount = isCustomTestCountValid(
          isCustomQuiz,
          requestedCustomCount,
          sourceTotalQuestions
        )
          ? requestedCustomCount
          : sourceTotalQuestions;

        const sourceDurationMinutes = Number(
          selectedTest.duration_minutes || 0
        );

        const customDurationMinutes = isCustomQuiz
          ? Math.max(
              1,
              Math.ceil(
                (sourceDurationMinutes * customCount) /
                  Math.max(sourceTotalQuestions, 1)
              )
            )
          : sourceDurationMinutes;

        const formattedTest = {
          id: selectedTest.id,
          subjectId: selectedTest.subject_id ?? null,
          trackId: selectedTest.track_id ?? trackId,
          testType: selectedTest.test_type || "practice",
          isCustomQuiz,
          customQuestionCount: isCustomQuiz ? customCount : null,
          title: isCustomQuiz
            ? `${selectedTest.title} · Custom Quiz`
            : selectedTest.title,
          setNumber: selectedTest.set_number,
          totalQuestions: customCount,
          sourceTotalQuestions,
          durationMinutes: customDurationMinutes,
          sourceDurationMinutes,
          marksPerQuestion: selectedTest.marks_per_question,
          negativeMarks: selectedTest.negative_marks,
          questionOrder,
        };

        /*
          Questions now come from Supabase.

          IMPORTANT:
          correct_answer is expected to be returned for now so
          the existing result/quiz logic can work.

          Later we should move answer validation server-side.
        */

        const questionData =
          await getSupabaseQuestions(
            selectedTest.id
          );

        const formattedQuestions =
          (questionData || [])
            .sort(
              (a, b) =>
                Number(a.display_order || 0) -
                Number(b.display_order || 0)
            )
            .map((question) =>
              shuffleQuestionOptions({
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

                correctAnswer:
                  Number(question.correct_answer),

                ans:
                  Number(question.correct_answer),

                marks:
                  Number(
                    question.marks ??
                    selectedTest.marks_per_question ??
                    1
                  ),

                negativeMarks:
                  Number(
                    question.negative_marks ??
                    selectedTest.negative_marks ??
                    0
                  ),

                type:
                  question.question_type ||
                  "single",

                displayOrder:
                  Number(
                    question.display_order || 0
                  ),
              })
            );

        let orderedQuestions =
          questionOrder === "random"
            ? shuffleArray(formattedQuestions)
            : formattedQuestions;

        const finalQuestions =
          isCustomQuiz && customCount < orderedQuestions.length
            ? orderedQuestions.slice(0, customCount)
            : orderedQuestions;

        if (!cancelled) {
          const finalTest = {
            ...formattedTest,
            totalQuestions: finalQuestions.length,
          };

          setTest(finalTest);
          setQuestions(finalQuestions);

          try {
            sessionStorage.setItem(
              activeQuizKey,
              JSON.stringify({
                version: 1,
                test: finalTest,
                questions: finalQuestions,
                savedAt: Date.now(),
              })
            );
          } catch (persistError) {
            console.warn("Unable to persist active quiz:", persistError);
          }
        }

      } catch (err) {

        console.error(
          "Failed to load quiz from Supabase:",
          err
        );

        if (!cancelled) {
          setLoadError(
            err.message ||
            "Unable to load quiz."
          );
        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }

    loadQuiz();

    return () => {
      cancelled = true;
    };

  }, [
    examId,
    trackId,
    subjectId,
    setId,
    mockId,
    location.pathname,
    location.search,
    authLoading,
    user,
    navigate,
    activeQuizKey,
    questionOrder,
  ]);

  /* =========================================================
     QUIZ STATE
  ========================================================= */

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0);


  const [
    answers,
    setAnswers,
  ] = useState({});


  /*
    First question is immediately considered visited.
  */

  const [
    questionStatuses,
    setQuestionStatuses,
  ] = useState({});


  const [
    markedForReview,
    setMarkedForReview,
  ] = useState({});


  useEffect(() => {
    if (questions.length === 0) {
      setQuestionStatuses({});
      setQuizHydrated(false);
      return;
    }

    let restored = false;

    try {
      const stored = sessionStorage.getItem(activeQuizKey);
      const parsed = stored ? JSON.parse(stored) : null;
      const state = parsed?.activeState;

      if (
        state &&
        parsed?.test?.id === test?.id &&
        Array.isArray(parsed.questions) &&
        parsed.questions.length === questions.length
      ) {
        setCurrentQuestionIndex(
          Number.isInteger(state.currentQuestionIndex)
            ? Math.min(
                Math.max(state.currentQuestionIndex, 0),
                questions.length - 1
              )
            : 0
        );
        setAnswers(state.answers || {});
        setMarkedForReview(state.markedForReview || {});
        setQuestionStatuses(state.questionStatuses || {});
        restored = true;
      }
    } catch (restoreError) {
      console.warn("Unable to restore quiz progress:", restoreError);
    }

    if (!restored) {
      setCurrentQuestionIndex(0);
      setAnswers({});
      setMarkedForReview({});
      setQuestionStatuses({
        0: "notAnswered",
      });
    }

    setQuizHydrated(true);
  }, [questions, test, activeQuizKey]);


  /*
    Initialize the timer from the test configuration.

    RRB:
    90 minutes → 5400 seconds

    TNPSC / AAO:
    180 minutes → 10800 seconds
  */

  const [
    timeRemaining,
    setTimeRemaining,
  ] = useState(0);


  const [
    fontSize,
    setFontSize,
  ] = useState("medium");


  const [
    showSubmitModal,
    setShowSubmitModal,
  ] = useState(false);

  const autoSubmitTriggeredRef = useRef(false);


  /*
    Mobile Question Palette drawer.
  */

  const [
    showMobilePalette,
    setShowMobilePalette,
  ] = useState(false);

  /*
     Browser Back protection.

     A protected history entry is added only after the quiz itself
     has loaded. Pressing browser Back returns to that protected
     entry, immediately restores it, and opens the warning modal.
     The quiz state therefore stays mounted and the timer continues.
  */
  const [showExitModal, setShowExitModal] = useState(false);
  const quizHistoryGuardAddedRef = useRef(false);
  const allowQuizExitRef = useRef(false);

  /*
     Use the natural parent route as the safe destination when the
     user explicitly chooses "Leave Test". This avoids depending on
     how many entries happen to exist in the browser history.
  */
  const quizReturnPath = useMemo(() => {
    if (isMockTest) {
      return `/exam/${examId}/${trackId}`;
    }

    return `/exam/${examId}/${trackId}/subject/${subjectId}`;
  }, [examId, trackId, subjectId, isMockTest]);

  /* =========================================================
     SERVER-SIDE ACTIVE EXAM SESSION

     Only one active exam is allowed for a user.
     The database RPC is the source of truth.
  ========================================================= */

  const [examSessionReady, setExamSessionReady] = useState(false);
  const [examSessionError, setExamSessionError] = useState("");

  const activeExamSessionIdRef = useRef(null);
  const examSessionKeyRef = useRef(null);
  const examSessionStartingRef = useRef(false);

  /*
     End the server-side active exam session.
     This is called after a successful submission and when the
     user explicitly chooses to leave the quiz.
  */
  const endExamSession = useCallback(async () => {
    const activeExamSessionId =
      activeExamSessionIdRef.current;

    if (!activeExamSessionId || !sessionRowId) {
      return true;
    }

    const { data, error } = await supabase.rpc(
      "end_exam_session",
      {
        p_active_exam_session_id:
          activeExamSessionId,
        p_session_row_id: sessionRowId,
      }
    );

    if (error) {
      console.error(
        "Unable to end active exam session:",
        error
      );

      return false;
    }

    activeExamSessionIdRef.current = null;
    examSessionKeyRef.current = null;
    setExamSessionReady(false);

    return data !== false;
  }, [sessionRowId]);

  /*
     Start/resume the server-side exam session.

     Two browsers can be logged in at the same time, but only
     one of them can own an active exam. The database RPC uses
     an advisory lock, so simultaneous starts are race-safe.
  */
  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !test?.id ||
      !questions.length ||
      !quizHydrated ||
      !sessionRowId ||
      !deviceId
    ) {
      return undefined;
    }

    const sessionKey = [
      test.id,
      sessionRowId,
      deviceId,
    ].join(":");

    if (
      examSessionKeyRef.current === sessionKey ||
      examSessionStartingRef.current
    ) {
      return undefined;
    }

    let cancelled = false;

    async function startExamSession() {
      examSessionStartingRef.current = true;
      setExamSessionReady(false);
      setExamSessionError("");

      try {
        const { data, error } = await supabase.rpc(
          "start_exam_session",
          {
            p_test_id: test.id,
            p_session_row_id: sessionRowId,
            p_device_id: deviceId,
          }
        );

        if (error) {
          const errorMessage = [
            error?.message,
            error?.details,
            error?.hint,
            error?.code,
          ]
            .filter(Boolean)
            .join(" ");

          if (
            errorMessage.includes(
              "EXAM_ALREADY_ACTIVE"
            )
          ) {
            throw new Error(
              "EXAM_ALREADY_ACTIVE"
            );
          }

          throw error;
        }

        let sessionData = data;

        if (typeof sessionData === "string") {
          try {
            sessionData = JSON.parse(sessionData);
          } catch {
            // Keep original value.
          }
        }

        const activeExamSessionId =
          sessionData?.active_exam_session_id ||
          sessionData?.id ||
          (Array.isArray(sessionData)
            ? sessionData[0]?.active_exam_session_id ||
              sessionData[0]?.id
            : null);

        if (!activeExamSessionId) {
          throw new Error(
            "Unable to create the active exam session."
          );
        }

        if (cancelled) {
          return;
        }

        activeExamSessionIdRef.current =
          activeExamSessionId;
        examSessionKeyRef.current = sessionKey;

        setExamSessionReady(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Unable to start active exam session:",
          error
        );

        if (
          String(error?.message || "").includes(
            "EXAM_ALREADY_ACTIVE"
          )
        ) {
          setExamSessionError(
            "This user already has an active exam in another browser or device. Please finish or leave that exam before starting another test."
          );
        } else {
          setExamSessionError(
            error?.message ||
              "Unable to start the secure exam session. Please try again."
          );
        }

        setExamSessionReady(false);
      } finally {
        if (!cancelled) {
          examSessionStartingRef.current = false;
        }
      }
    }

    startExamSession();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    user,
    test?.id,
    questions.length,
    quizHydrated,
    sessionRowId,
    deviceId,
  ]);

  /*
     Heartbeat the active exam every minute.
     If the server says the exam session is no longer active,
     stop this quiz instead of allowing two browsers to continue.
  */
  useEffect(() => {
    if (
      !examSessionReady ||
      !activeExamSessionIdRef.current ||
      !sessionRowId
    ) {
      return undefined;
    }

    let cancelled = false;

    const heartbeatExamSession = async () => {
      const activeExamSessionId =
        activeExamSessionIdRef.current;

      if (!activeExamSessionId) {
        return;
      }

      const { data, error } = await supabase.rpc(
        "heartbeat_exam_session",
        {
          p_active_exam_session_id:
            activeExamSessionId,
          p_session_row_id: sessionRowId,
        }
      );

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          "Active exam heartbeat failed:",
          error
        );
        return;
      }

      if (data === false) {
        activeExamSessionIdRef.current = null;
        examSessionKeyRef.current = null;
        setExamSessionReady(false);
        setExamSessionError(
          "Your active exam session is no longer valid. Please return to the test list and start again."
        );

        try {
          sessionStorage.removeItem(activeQuizKey);
        } catch (clearError) {
          console.warn(
            "Unable to clear inactive quiz state:",
            clearError
          );
        }
      }
    };

    const timer = setInterval(
      heartbeatExamSession,
      60 * 1000
    );

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    examSessionReady,
    sessionRowId,
    activeQuizKey,
  ]);

  /* =========================================================
     PERSISTENT EXAM TIMER + ACTIVE PROGRESS
  ========================================================= */

  useEffect(() => {
    if (
      !test ||
      !questions.length ||
      !quizHydrated ||
      !examSessionReady
    ) {
      return;
    }

    let endTime;

    try {
      const stored = sessionStorage.getItem(activeQuizKey);
      const parsed = stored ? JSON.parse(stored) : {};

      endTime = Number(parsed?.endTime);

      if (!Number.isFinite(endTime) || endTime <= 0) {
        endTime =
          Date.now() + Number(test.durationMinutes || 60) * 60 * 1000;
      }

      const updateState = () => {
        const remaining = Math.max(
          0,
          Math.ceil((endTime - Date.now()) / 1000)
        );

        setTimeRemaining(remaining);

        try {
          const current = sessionStorage.getItem(activeQuizKey);
          const currentParsed = current ? JSON.parse(current) : {};

          sessionStorage.setItem(
            activeQuizKey,
            JSON.stringify({
              ...currentParsed,
              version: 1,
              test,
              questions,
              endTime,
              remainingTime: remaining,
              activeState: {
                currentQuestionIndex,
                answers,
                markedForReview,
                questionStatuses,
              },
              savedAt: Date.now(),
            })
          );
        } catch (persistError) {
          console.warn("Unable to save active quiz state:", persistError);
        }

        if (remaining <= 0) {
          if (!autoSubmitTriggeredRef.current) {
            autoSubmitTriggeredRef.current = true;
            setTimeout(() => {
              handleSubmitTest(0);
            }, 0);
          }

          return true;
        }

        return false;
      };

      if (updateState()) {
        return undefined;
      }

      const timer = setInterval(() => {
        if (updateState()) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    } catch (timerError) {
      console.error("Failed to initialize quiz timer:", timerError);
    }

    return undefined;
  }, [
    test,
    questions,
    quizHydrated,
    examSessionReady,
    activeQuizKey,
    currentQuestionIndex,
    answers,
    markedForReview,
    questionStatuses,
  ]);

    /* =========================================================
     BROWSER BACK / EXIT PROTECTION
  ========================================================= */

  useEffect(() => {
    if (!test || !questions.length || !quizHydrated) {
      return undefined;
    }

    /*
       Add exactly one duplicate history entry while this quiz is active.
       The duplicate keeps the browser on the quiz URL when Back is pressed.
    */
    if (!quizHistoryGuardAddedRef.current) {
      window.history.pushState(
        {
          ...(window.history.state || {}),
          examQuizHubQuizGuard: true,
        },
        "",
        window.location.href
      );

      quizHistoryGuardAddedRef.current = true;
    }

    const handlePopState = () => {
      if (allowQuizExitRef.current) {
        return;
      }

      /*
         Restore the protected entry immediately so the quiz route remains
         active. Then show the confirmation modal.
      */
      window.history.pushState(
        {
          ...(window.history.state || {}),
          examQuizHubQuizGuard: true,
        },
        "",
        window.location.href
      );

      setShowExitModal(true);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [test, questions.length, quizHydrated]);

  const handleStayInQuiz = useCallback(() => {
    setShowExitModal(false);
  }, []);

  const handleLeaveQuiz = useCallback(async () => {
    allowQuizExitRef.current = true;
    setShowExitModal(false);

    /*
       Release the server-side active exam lock before leaving.
    */
    await endExamSession();

    /*
       Delete the active in-progress snapshot so the quiz cannot resume
       from the old state after the user explicitly leaves.
    */
    try {
      sessionStorage.removeItem(activeQuizKey);
    } catch (clearError) {
      console.warn("Unable to clear active quiz state:", clearError);
    }

    navigate(quizReturnPath, { replace: true });
  }, [
    activeQuizKey,
    endExamSession,
    navigate,
    quizReturnPath,
  ]);

  /* =========================================================
     CURRENT QUESTION
  ========================================================= */

  const currentQuestion =
    questions[currentQuestionIndex];


  const selectedAnswer =
    currentQuestion
      ? answers[currentQuestion.id]
      : undefined;


  /* =========================================================
     MARK QUESTION AS VISITED
  ========================================================= */

  const markQuestionVisited =
    useCallback(
      (index) => {

        if (
          index < 0 ||
          index >= questions.length
        ) {
          return;
        }


        setQuestionStatuses(
          (previous) => {

            /*
              Do not overwrite an existing status.
            */

            if (previous[index]) {
              return previous;
            }


            return {
              ...previous,

              [index]:
                "notAnswered",
            };

          }
        );

      },
      [questions.length]
    );


  /* =========================================================
     ANSWER SELECTION
  ========================================================= */

  const handleAnswerSelect =
    useCallback(
      (answer) => {

        if (!currentQuestion) {
          return;
        }


        /*
          Store selected answer.
        */

        setAnswers(
          (previous) => ({
            ...previous,

            [currentQuestion.id]:
              answer,
          })
        );


        /*
          Update question status.
        */

        setQuestionStatuses(
          (previous) => {

            const isMarked =
              markedForReview[
              currentQuestionIndex
              ];


            return {
              ...previous,

              [currentQuestionIndex]:
                isMarked
                  ? "answeredAndMarked"
                  : "answered",
            };

          }
        );

      },
      [
        currentQuestion,
        currentQuestionIndex,
        markedForReview,
      ]
    );


  /* =========================================================
     PREVIOUS QUESTION
  ========================================================= */

  const handlePrevious = () => {

    if (currentQuestionIndex <= 0) {
      return;
    }


    const nextIndex =
      currentQuestionIndex - 1;


    markQuestionVisited(nextIndex);


    setCurrentQuestionIndex(
      nextIndex
    );

  };


  /* =========================================================
     CLEAR RESPONSE
  ========================================================= */

  const handleClearResponse = () => {

    if (!currentQuestion) {
      return;
    }


    /*
      Remove selected answer.
    */

    setAnswers(
      (previous) => {

        const updated = {
          ...previous,
        };


        delete updated[
          currentQuestion.id
        ];


        return updated;

      }
    );


    /*
      Preserve review status.
    */

    const isMarked =
      markedForReview[
      currentQuestionIndex
      ];


    setQuestionStatuses(
      (previous) => ({

        ...previous,

        [currentQuestionIndex]:
          isMarked
            ? "markedForReview"
            : "notAnswered",

      })
    );

  };


  /* =========================================================
     MARK FOR REVIEW
  ========================================================= */

  const handleMarkForReview = () => {

    if (!currentQuestion) {
      return;
    }


    const currentlyMarked =
      markedForReview[
      currentQuestionIndex
      ];


    /*
      Toggle marked state.
    */

    setMarkedForReview(
      (previous) => ({

        ...previous,

        [currentQuestionIndex]:
          !currentlyMarked,

      })
    );


    /*
      Determine whether this question
      already has an answer.
    */

    const hasAnswer =
      answers[
      currentQuestion.id
      ] !== undefined;


    /*
      Update palette status.
    */

    setQuestionStatuses(
      (previous) => ({

        ...previous,

        [currentQuestionIndex]:

          currentlyMarked

            ? hasAnswer
              ? "answered"
              : "notAnswered"

            : hasAnswer
              ? "answeredAndMarked"
              : "markedForReview",

      })
    );

  };


  /* =========================================================
     SAVE & NEXT
  ========================================================= */

  const handleSaveAndNext = () => {

    /*
      Last question → open submit modal.
    */

    if (
      currentQuestionIndex >=
      questions.length - 1
    ) {

      setShowSubmitModal(true);

      return;
    }


    const nextIndex =
      currentQuestionIndex + 1;


    /*
      Mark next question as visited.
    */

    markQuestionVisited(nextIndex);


    /*
      Move to next question.
    */

    setCurrentQuestionIndex(
      nextIndex
    );

  };


  /* =========================================================
     DIRECT QUESTION NAVIGATION
  ========================================================= */

  const handleQuestionSelect =
    (index) => {

      if (
        index < 0 ||
        index >= questions.length
      ) {
        return;
      }


      /*
        Mark selected question as visited.
      */

      markQuestionVisited(index);


      /*
        Navigate to selected question.
      */

      setCurrentQuestionIndex(
        index
      );


      /*
        Close mobile palette automatically.
      */

      setShowMobilePalette(false);

    };


  /* =========================================================
     QUESTION COUNTS
  ========================================================= */

  const answeredCount =
    Object.values(
      questionStatuses
    ).filter(
      (status) =>
        status === "answered" ||
        status === "answeredAndMarked"
    ).length;


  const unansweredCount =
    questions.length -
    answeredCount;


  const markedCount =
    Object.values(
      markedForReview
    ).filter(Boolean).length;


  /* =========================================================
     SUBMIT TEST
  ========================================================= */

  const handleSubmitTest = async (forcedTimeRemaining = null) => {

    if (!test || savingAttempt) {
      return;
    }

    /*
      A quiz attempt belongs to a logged-in user.
    */
    if (authLoading) {
      return;
    }

    if (!user) {
      setShowSubmitModal(false);

      navigate("/login", {
        state: {
          from: window.location.pathname,
        },
      });

      return;
    }

    setSavingAttempt(true);

    const submittedAt = new Date().toISOString();

    try {

      /*
        Calculate final statistics from the shuffled UI state.
      */
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let score = 0;

      const maximumScore = questions.reduce(
        (total, question) =>
          total + Number(question.marks ?? 1),
        0
      );

      questions.forEach((question) => {
        const selectedIndex = answers[question.id];

        if (
          !Number.isInteger(selectedIndex) ||
          selectedIndex < 0 ||
          selectedIndex >= question.options.length
        ) {
          return;
        }

        if (selectedIndex === question.correctAnswer) {
          correctAnswers += 1;
          score += Number(question.marks ?? 1);
        } else {
          wrongAnswers += 1;
          score -= Number(question.negativeMarks ?? 0);
        }
      });

      const unattemptedQuestions =
        questions.length -
        correctAnswers -
        wrongAnswers;

      const effectiveTimeRemaining =
        forcedTimeRemaining !== null
          ? Number(forcedTimeRemaining)
          : Number(timeRemaining || 0);

      const timeTakenSeconds = Math.max(
        0,
        Number(test.durationMinutes || 0) * 60 -
        effectiveTimeRemaining
      );

      /*
        1. Create the parent attempt row.
      */
      const { data: attemptRow, error: attemptError } =
        await supabase
          .from("test_attempts")
          .insert({
            user_id: user.id,
            test_id: test.id,
            submitted_at: submittedAt,
            time_taken_seconds: timeTakenSeconds,
            total_questions: questions.length,
            answered_questions: answeredCount,
            correct_answers: correctAnswers,
            wrong_answers: wrongAnswers,
            unanswered_questions: unattemptedQuestions,
            marked_questions: markedCount,
            score,
            maximum_score: maximumScore,
          })
          .select("id")
          .single();

      if (attemptError) {
        throw attemptError;
      }

      /*
        2. Save one answer row for every question.

        selected_answer is stored using the ORIGINAL database
        option index, not the shuffled UI index.
      */
      const attemptAnswers = questions.map(
        (question, index) => {
          const selectedIndex = answers[question.id];

          const isAnswered =
            Number.isInteger(selectedIndex) &&
            selectedIndex >= 0 &&
            selectedIndex < question.options.length;

          const originalSelectedAnswer = isAnswered
            ? question.originalOptionIndexes?.[selectedIndex] ??
            selectedIndex
            : null;

          const isCorrect = isAnswered
            ? selectedIndex === question.correctAnswer
            : null;

          return {
            attempt_id: attemptRow.id,
            question_id: question.id,
            selected_answer: originalSelectedAnswer,
            is_correct: isCorrect,
            marked_for_review: !!markedForReview[index],
            answered_at: isAnswered
              ? submittedAt
              : null,
          };
        }
      );

      const { error: answersError } =
        await supabase
          .from("attempt_answers")
          .insert(attemptAnswers);

      if (answersError) {
        throw answersError;
      }

      /*
        Keep the client snapshot for ResultPage.
        This preserves the shuffled option order and correct
        answer index used during this particular attempt.
      */
      const attempt = {
        attemptId: attemptRow.id,
        userId: user.id,
        testId: test.id,
        answers,
        questionStatuses,
        markedForReview,
        timeRemaining:
          forcedTimeRemaining !== null
            ? Number(forcedTimeRemaining)
            : timeRemaining,
        submittedAt,
        correctAnswers,
        wrongAnswers,
        unansweredQuestions: unattemptedQuestions,
        answeredQuestions: answeredCount,
        markedQuestions: markedCount,
        score,
        maximumScore,
        questionSnapshots: questions.map((question) => ({
          id: question.id,
          testId: question.testId,
          question: question.question,
          q: question.q,
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
          originalOptionIndexes:
            question.originalOptionIndexes,
          originalCorrectAnswer:
            question.originalCorrectAnswer,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          displayOrder: question.displayOrder,
        })),
      };

      sessionStorage.setItem(
        `quiz-attempt-${test.id}`,
        JSON.stringify(attempt)
      );

      setShowSubmitModal(false);

      try {
        sessionStorage.removeItem(activeQuizKey);
      } catch (clearError) {
        console.warn("Unable to clear completed quiz state:", clearError);
      }

      /*
        Release the server-side active exam lock only after the
        attempt and all answer rows have been saved successfully.
      */
      const examSessionEnded = await endExamSession();

      if (!examSessionEnded) {
        throw new Error(
          "Your test was saved, but the active exam session could not be closed. Please refresh and try again."
        );
      }

      navigate(
        isMockTest
          ? `/exam/${examId}/${trackId}/mock-result/${mockId}?attemptId=${encodeURIComponent(attemptRow.id)}`
          : `/exam/${examId}/${trackId}/result/${subjectId}/${setId}?attemptId=${encodeURIComponent(attemptRow.id)}`
      );

    } catch (error) {

      console.error(
        "Failed to save quiz attempt:",
        error
      );

      alert(
        error?.message ||
        "Unable to save your quiz attempt. Please try again."
      );

    } finally {
      setSavingAttempt(false);
    }
  };


  /* =========================================================
     AUTHENTICATION GUARD
  ========================================================= */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 dark:bg-[#07111F]">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-[#243A55] dark:bg-[#0D1B2E]">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#009FE3]/20 border-t-[#009FE3]" />
          <h1 className="mt-5 text-lg font-black text-[#001F4F] dark:text-white">
            Checking your account
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#A8B4C5]">
            Please wait while we verify your login.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /* =========================================================
     LOADING QUIZ
  ========================================================= */

  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#F6F1E7] px-4">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#087A55]/20 border-t-[#087A55]" />

          <h1 className="mt-5 text-xl font-black text-[#10233F]">
            Loading Quiz
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Loading the test and questions...
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

      <div className="flex min-h-screen items-center justify-center bg-[#F6F1E7] px-4">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">

          <h1 className="text-xl font-black text-[#10233F]">
            Unable to Load Quiz
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 rounded-lg bg-[#087A55] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#006B4F]"
          >
            Go Back
          </button>

        </div>

      </div>

    );

  }


  /* =========================================================
     SECURE EXAM SESSION
  ========================================================= */

  if (test && questions.length > 0 && !examSessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F1E7] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          {examSessionError ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <X size={24} />
              </div>

              <h1 className="mt-5 text-xl font-black text-[#10233F]">
                Unable to Start Test
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {examSessionError}
              </p>

              <button
                type="button"
                onClick={() => navigate(quizReturnPath, { replace: true })}
                className="mt-6 rounded-lg bg-[#087A55] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#006B4F]"
              >
                Go Back
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#087A55]/20 border-t-[#087A55]" />

              <h1 className="mt-5 text-xl font-black text-[#10233F]">
                Securing Your Test
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Checking your active exam session...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }


  /* =========================================================
     INVALID TEST
  ========================================================= */

  if (!test) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#F6F1E7] px-4">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">

          <h1 className="text-xl font-black text-[#10233F]">
            Test Not Found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            The quiz you are trying to
            access does not exist or is
            no longer available.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="mt-6 rounded-lg bg-[#087A55] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#006B4F]"
          >
            Go Back
          </button>

        </div>

      </div>

    );

  }


  /* =========================================================
     NO QUESTIONS
  ========================================================= */

  if (questions.length === 0) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#F6F1E7] px-4">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">

          <h1 className="text-xl font-black text-[#10233F]">
            No Questions Available
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            This test has not been
            connected to a question set
            yet.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="mt-6 rounded-lg bg-[#087A55] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#006B4F]"
          >
            Go Back
          </button>

        </div>

      </div>

    );

  }


  /* =========================================================
     QUIZ UI
  ========================================================= */

  return (

    <div className="flex h-screen flex-col overflow-hidden bg-[#F6F1E7]">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="shrink-0">

        <QuizHeader
          test={test}
          timeRemaining={timeRemaining}
          user={user}
        />

      </div>


      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="shrink-0">

        <QuizToolbar

          currentQuestion={
            currentQuestionIndex + 1
          }

          totalQuestions={
            questions.length
          }

          questionType={

            currentQuestion?.type ===
              "multiple"

              ? "MCQ Multiple"

              : currentQuestion?.type ===
                "numerical"

                ? "Numerical"

                : "MCQ Single"

          }

          marks={
            currentQuestion?.marks ??
            test.marksPerQuestion ??
            1
          }

          negativeMarks={
            currentQuestion?.negativeMarks ??
            test.negativeMarks ??
            0
          }

          fontSize={
            fontSize
          }

          onFontSizeChange={
            setFontSize
          }

        />

      </div>


      {/* =====================================================
          MOBILE QUESTION PALETTE BUTTON
      ===================================================== */}

      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 lg:hidden">

        <button
          type="button"
          onClick={() =>
            setShowMobilePalette(true)
          }
          aria-label="Open question palette"
          aria-expanded={
            showMobilePalette
          }
          className="flex w-full items-center justify-between rounded-xl border border-[#10233F]/10 bg-[#FCFBF7] px-3 py-2.5 text-left transition active:scale-[0.99] hover:border-[#087A55]/30"
        >

          {/* LEFT */}

          <div className="flex items-center gap-3">

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#087A55] text-sm font-black text-white">
              {currentQuestionIndex + 1}
            </span>

            <div>

              <p className="text-xs font-black text-[#10233F]">
                Questions
              </p>

              <p className="text-[10px] font-semibold text-slate-500">
                Navigate between questions
              </p>

            </div>

          </div>


          {/* RIGHT */}

          <div className="flex items-center gap-2">

            <span className="rounded-lg bg-[#F6F1E7] px-2.5 py-1.5 text-xs font-black text-[#10233F]">
              {currentQuestionIndex + 1}/
              {questions.length}
            </span>

            <span className="text-lg font-black text-[#087A55]">
              →
            </span>

          </div>

        </button>

      </div>


      {/* =====================================================
          MAIN CBT AREA
      ===================================================== */}

      <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden">


        {/* ===================================================
            QUESTION AREA
        =================================================== */}

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">

          <QuestionPanel

            question={
              currentQuestion
            }

            questionNumber={
              currentQuestionIndex + 1
            }

            selectedAnswer={
              selectedAnswer
            }

            onAnswerSelect={
              handleAnswerSelect
            }

            fontSize={
              fontSize
            }

          />

        </div>


        {/* ===================================================
            DESKTOP QUESTION PALETTE
        =================================================== */}

        <div className="hidden h-full min-h-0 shrink-0 overflow-hidden lg:flex">

          <QuestionPalette

            totalQuestions={
              questions.length
            }

            currentQuestionIndex={
              currentQuestionIndex
            }

            questionStatuses={
              questionStatuses
            }

            onQuestionSelect={
              handleQuestionSelect
            }

          />

        </div>

      </main>


      {/* =====================================================
          MOBILE QUESTION PALETTE DRAWER
      ===================================================== */}

      {showMobilePalette && typeof document !== "undefined" &&
        createPortal(
          <MobileQuestionPalette
            totalQuestions={questions.length}
            currentQuestionIndex={currentQuestionIndex}
            questionStatuses={questionStatuses}
            onQuestionSelect={handleQuestionSelect}
            onClose={() =>
              setShowMobilePalette(false)
            }
          />,
          document.body
        )}


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="shrink-0">

        <QuizFooter

          currentQuestionIndex={
            currentQuestionIndex
          }

          totalQuestions={
            questions.length
          }

          hasAnswer={

            selectedAnswer !==
            undefined &&

            selectedAnswer !==
            null &&

            selectedAnswer !==
            ""

          }

          isMarkedForReview={Boolean(
            markedForReview[
            currentQuestionIndex
            ]
          )}

          onPrevious={
            handlePrevious
          }

          onClearResponse={
            handleClearResponse
          }

          onMarkForReview={
            handleMarkForReview
          }

          onSaveAndNext={
            handleSaveAndNext
          }

        />

      </div>


      {/* =====================================================
          SUBMIT MODAL
      ===================================================== */}

      <SubmitModal

        isOpen={
          showSubmitModal
        }

        totalQuestions={
          questions.length
        }

        answeredCount={
          answeredCount
        }

        unansweredCount={
          unansweredCount
        }

        markedCount={
          markedCount
        }

        onCancel={() =>
          setShowSubmitModal(false)
        }

        onConfirm={
          handleSubmitTest
        }

      />

      <ExitQuizModal
        isOpen={showExitModal}
        onStay={handleStayInQuiz}
        onLeave={handleLeaveQuiz}
      />

    </div>

  );

}


/* =========================================================
   MOBILE QUESTION PALETTE

   Kept separate from the desktop palette so the mobile
   drawer has its own responsive layout and does not depend
   on the desktop aside sizing.
========================================================= */

function MobileQuestionPalette({
  totalQuestions,
  currentQuestionIndex,
  questionStatuses = {},
  onQuestionSelect,
  onClose,
}) {
  const getStatus = (index) =>
    questionStatuses[index] || "notVisited";

  const getButtonClass = (status, isCurrent) => {
    const base =
      "relative flex h-11 w-full items-center justify-center rounded-xl border text-xs font-black transition-all duration-150 active:scale-95";

    if (isCurrent) {
      return `${base} border-2 border-[#10233F] bg-white text-[#10233F] ring-2 ring-[#D99A2B]/40`;
    }

    switch (status) {
      case "answered":
        return `${base} border-[#087A55] bg-[#087A55] text-white`;

      case "notAnswered":
        return `${base} border-[#D28725] bg-[#FFF8E8] text-[#946116]`;

      case "markedForReview":
      case "answeredAndMarked":
        return `${base} border-purple-500 bg-purple-500 text-white`;

      case "notVisited":
      default:
        return `${base} border-slate-200 bg-slate-50 text-slate-500`;
    }
  };

  const statusCounts = {
    answered: 0,
    notAnswered: 0,
    marked: 0,
    notVisited: 0,
  };

  for (let index = 0; index < totalQuestions; index += 1) {
    const status = getStatus(index);

    if (
      status === "answered" ||
      status === "answeredAndMarked"
    ) {
      statusCounts.answered += 1;
    } else if (status === "notAnswered") {
      statusCounts.notAnswered += 1;
    } else if (
      status === "markedForReview"
    ) {
      statusCounts.marked += 1;
    } else {
      statusCounts.notVisited += 1;
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Question Palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#10233F]/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <section
        className="absolute inset-x-0 bottom-0 flex h-[min(88dvh,720px)] flex-col overflow-hidden rounded-t-[24px] border-t border-white/60 bg-white shadow-[0_-18px_55px_rgba(16,35,63,0.22)]"
        style={{
          paddingBottom:
            "env(safe-area-inset-bottom)",
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#10233F]">
                Question Palette
              </h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                Tap a number to jump to that question
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close question palette"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#FCFBF7] text-slate-600 active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status summary */}
        <div className="shrink-0 border-b border-slate-200 bg-[#FCFBF7] px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <MobilePaletteStat
              value={statusCounts.answered}
              label="Answered"
              className="bg-[#EEF7F1] text-[#087A55]"
            />
            <MobilePaletteStat
              value={statusCounts.notAnswered}
              label="Pending"
              className="bg-[#FFF8E8] text-[#946116]"
            />
            <MobilePaletteStat
              value={statusCounts.marked}
              label="Marked"
              className="bg-purple-50 text-purple-600"
            />
            <MobilePaletteStat
              value={statusCounts.notVisited}
              label="Unvisited"
              className="bg-slate-100 text-slate-500"
            />
          </div>
        </div>

        {/* Questions */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              All Questions
            </p>
            <span className="rounded-lg bg-[#F6F1E7] px-2.5 py-1 text-[10px] font-black text-[#10233F]">
              {currentQuestionIndex + 1}/{totalQuestions}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {Array.from(
              { length: totalQuestions },
              (_, index) => {
                const status = getStatus(index);
                const isCurrent =
                  index === currentQuestionIndex;

                const isMarked =
                  status === "markedForReview" ||
                  status === "answeredAndMarked";

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      onQuestionSelect(index)
                    }
                    aria-label={`Question ${index + 1}`}
                    aria-current={
                      isCurrent ? "step" : undefined
                    }
                    className={getButtonClass(
                      status,
                      isCurrent
                    )}
                  >
                    {index + 1}

                    {isMarked && (
                      <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#D99A2B] text-[8px] font-black text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Bottom hint */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] leading-4 text-slate-400">
              Question {currentQuestionIndex + 1} is currently selected.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg bg-[#087A55] px-4 py-2 text-xs font-black text-white active:scale-95"
            >
              Back to Question
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


function MobilePaletteStat({
  value,
  label,
  className,
}) {
  return (
    <div
      className={`rounded-xl px-2 py-2 text-center ${className}`}
    >
      <p className="text-sm font-black">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-wide opacity-80">
        {label}
      </p>
    </div>
  );
}


export default QuizPage;