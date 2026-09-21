import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { supabase } from "../../services/supabase";

function AdminAttemptDetails() {
  const navigate = useNavigate();
  const { attemptId } = useParams();

  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttemptDetails() {
    try {
      setLoading(true);
      setError("");

      // --------------------------------------------
      // 1. Load attempt
      // --------------------------------------------

      const {
        data: attemptData,
        error: attemptError,
      } = await supabase
        .from("test_attempts")
        .select(
          `
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
          `
        )
        .eq("id", attemptId)
        .single();

      if (attemptError) {
        throw attemptError;
      }

      setAttempt(attemptData);

      // --------------------------------------------
      // 2. Load test
      // --------------------------------------------

      const {
        data: testData,
        error: testError,
      } = await supabase
        .from("tests")
        .select(
          `
            id,
            title,
            set_number,
            total_questions,
            duration_minutes,
            marks_per_question,
            negative_marks,
            test_type
          `
        )
        .eq(
          "id",
          attemptData.test_id
        )
        .single();

      if (testError) {
        throw testError;
      }

      setTest(testData);

      // --------------------------------------------
      // 3. Load attempt answers
      // --------------------------------------------

      const {
        data: answerData,
        error: answerError,
      } = await supabase
        .from("attempt_answers")
        .select(
          `
            id,
            attempt_id,
            question_id,
            selected_answer,
            is_correct,
            marked_for_review,
            answered_at
          `
        )
        .eq(
          "attempt_id",
          attemptId
        );

      if (answerError) {
        throw answerError;
      }

      const rawAnswers =
        answerData || [];

      // --------------------------------------------
      // 4. Load corresponding questions
      // --------------------------------------------

      const questionIds =
        rawAnswers
          .map(
            (answer) =>
              answer.question_id
          )
          .filter(Boolean);

      let questionData = [];

      if (questionIds.length > 0) {
        const {
          data,
          error: questionError,
        } = await supabase
          .from("questions")
          .select(
            `
              id,
              question_text,
              option_a,
              option_b,
              option_c,
              option_d,
              correct_answer,
              question_type,
              marks,
              negative_marks,
              display_order,
              active
            `
          )
          .in(
            "id",
            questionIds
          );

        if (questionError) {
          throw questionError;
        }

        questionData =
          data || [];
      }

      const questionMap =
        Object.fromEntries(
          questionData.map(
            (question) => [
              question.id,
              question,
            ]
          )
        );

      // --------------------------------------------
      // 5. Combine answer + question
      // --------------------------------------------

      const combinedAnswers =
        rawAnswers
          .map((answer) => ({
            ...answer,
            question:
              questionMap[
                answer.question_id
              ] || null,
          }))
          .sort(
            (a, b) =>
              Number(
                a.question
                  ?.display_order ??
                  999999
              ) -
              Number(
                b.question
                  ?.display_order ??
                  999999
              )
          );

      setAnswers(
        combinedAnswers
      );
    } catch (err) {
      console.error(
        "Error loading attempt details:",
        err
      );

      setError(
        err.message ||
          "Failed to load attempt details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (attemptId) {
      loadAttemptDetails();
    }
  }, [attemptId]);

  // --------------------------------------------
  // ACCURACY
  // --------------------------------------------

  const accuracy = useMemo(() => {
    if (!attempt) {
      return 0;
    }

    const answered =
      Number(
        attempt.answered_questions ||
          0
      );

    const correct =
      Number(
        attempt.correct_answers ||
          0
      );

    if (answered <= 0) {
      return 0;
    }

    return Math.round(
      (correct / answered) * 100
    );
  }, [attempt]);

  // --------------------------------------------
  // DATE FORMAT
  // --------------------------------------------

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  // --------------------------------------------
  // DURATION
  // --------------------------------------------

  function formatDuration(
    seconds
  ) {
    if (
      seconds === null ||
      seconds === undefined
    ) {
      return "—";
    }

    const totalSeconds =
      Number(seconds);

    if (
      !Number.isFinite(
        totalSeconds
      )
    ) {
      return "—";
    }

    const minutes =
      Math.floor(
        totalSeconds / 60
      );

    const remaining =
      totalSeconds % 60;

    if (minutes === 0) {
      return `${remaining}s`;
    }

    return `${minutes}m ${remaining}s`;
  }

  // --------------------------------------------
  // ANSWER LABEL
  // --------------------------------------------

  function answerLabel(index) {
    const labels = [
      "A",
      "B",
      "C",
      "D",
    ];

    if (
      index === null ||
      index === undefined
    ) {
      return "Not Answered";
    }

    return (
      labels[index] ||
      "—"
    );
  }

  // --------------------------------------------
  // ANSWER TEXT
  // --------------------------------------------

  function answerText(
    question,
    index
  ) {
    if (
      !question ||
      index === null ||
      index === undefined
    ) {
      return "Not Answered";
    }

    const options = [
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
    ];

    return (
      options[index] ||
      "—"
    );
  }

  // --------------------------------------------
  // SCORE FORMAT
  // --------------------------------------------

  function formatScore(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "0";
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return "0";
    }

    if (
      Number.isInteger(
        number
      )
    ) {
      return String(number);
    }

    return number.toFixed(2);
  }

  // --------------------------------------------
  // LOADING
  // --------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          background:
            "#F7F9FC",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          color:
            "#667085",
        }}
      >
        <Loader2
          size={26}
          style={{
            animation:
              "adminAttemptDetailsSpin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  // --------------------------------------------
  // ERROR
  // --------------------------------------------

  if (error) {
    return (
      <div
        style={{
          padding:
            "28px",
          background:
            "#F7F9FC",
          minHeight:
            "100vh",
        }}
      >
        <button
          onClick={() =>
            navigate(
              "/admin/attempts"
            )
          }
          style={
            backButton
          }
        >
          <ArrowLeft
            size={16}
          />
          Back to Attempts
        </button>

        <div
          style={{
            ...errorBox,
            marginTop:
              "20px",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!attempt) {
    return null;
  }

  return (
    <div
      style={{
        padding:
          "28px",
        background:
          "#F7F9FC",
        minHeight:
          "100vh",
      }}
    >
      {/* ======================================== */}
      {/* HEADER */}
      {/* ======================================== */}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap:
            "16px",
          marginBottom:
            "22px",
          flexWrap:
            "wrap",
        }}
      >
        <div>
          <button
            onClick={() =>
              navigate(
                "/admin/attempts"
              )
            }
            style={
              backButton
            }
          >
            <ArrowLeft
              size={16}
            />
            Back to Attempts
          </button>

          <h1
            style={{
              margin:
                "12px 0 0",
              color:
                "#10233F",
              fontSize:
                "28px",
              fontWeight:
                700,
            }}
          >
            Attempt Result
          </h1>

          <p
            style={{
              margin:
                "6px 0 0",
              color:
                "#667085",
              fontSize:
                "14px",
            }}
          >
            {test?.title ||
              "Unknown Test"}
          </p>
        </div>

        <button
          onClick={
            loadAttemptDetails
          }
          disabled={
            loading
          }
          style={
            secondaryButton
          }
        >
          <RefreshCw
            size={16}
          />
          Refresh
        </button>
      </div>

      {/* ======================================== */}
      {/* ATTEMPT INFO */}
      {/* ======================================== */}

      <div
        style={{
          background:
            "#FFFFFF",
          border:
            "1px solid #E4E7EC",
          borderRadius:
            "10px",
          padding:
            "18px",
          marginBottom:
            "18px",
        }}
      >
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap:
              "18px",
          }}
        >
          <InfoItem
            label="Student ID"
            value={
              attempt.user_id ||
              "—"
            }
            mono
          />

          <InfoItem
            label="Test"
            value={
              test?.title ||
              "—"
            }
          />

          <InfoItem
            label="Test Type"
            value={
              test?.test_type ===
              "mock"
                ? "Mock"
                : "Practice"
            }
          />

          <InfoItem
            label="Set Number"
            value={
              test?.set_number ??
              "—"
            }
          />

          <InfoItem
            label="Started"
            value={formatDate(
              attempt.started_at
            )}
          />

          <InfoItem
            label="Submitted"
            value={formatDate(
              attempt.submitted_at
            )}
          />

          <InfoItem
            label="Time Taken"
            value={formatDuration(
              attempt.time_taken_seconds
            )}
          />

          <InfoItem
            label="Attempt ID"
            value={
              attempt.id
            }
            mono
          />
        </div>
      </div>

      {/* ======================================== */}
      {/* SCORE CARDS */}
      {/* ======================================== */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(5, minmax(0, 1fr))",
          gap:
            "14px",
          marginBottom:
            "20px",
        }}
      >
        <ScoreCard
          title="Score"
          value={`${formatScore(
            attempt.score
          )} / ${formatScore(
            attempt.maximum_score
          )}`}
          icon={
            <FileText
              size={21}
            />
          }
        />

        <ScoreCard
          title="Correct"
          value={
            attempt.correct_answers ??
            0
          }
          icon={
            <CheckCircle2
              size={21}
            />
          }
        />

        <ScoreCard
          title="Wrong"
          value={
            attempt.wrong_answers ??
            0
          }
          icon={
            <XCircle
              size={21}
            />
          }
        />

        <ScoreCard
          title="Unanswered"
          value={
            attempt.unanswered_questions ??
            0
          }
          icon={
            <Circle
              size={21}
            />
          }
        />

        <ScoreCard
          title="Accuracy"
          value={`${accuracy}%`}
          icon={
            <CheckCircle2
              size={21}
            />
          }
        />
      </div>

      {/* ======================================== */}
      {/* TEST CONFIG */}
      {/* ======================================== */}

      <div
        style={{
          background:
            "#FFFFFF",
          border:
            "1px solid #E4E7EC",
          borderRadius:
            "10px",
          padding:
            "18px",
          marginBottom:
            "20px",
        }}
      >
        <h2
          style={{
            margin:
              "0 0 15px",
            color:
              "#10233F",
            fontSize:
              "17px",
          }}
        >
          Test Configuration
        </h2>

        <div
          style={{
            display:
              "flex",
            gap:
              "30px",
            flexWrap:
              "wrap",
          }}
        >
          <InfoItem
            label="Total Questions"
            value={
              test?.total_questions ??
              attempt.total_questions ??
              0
            }
          />

          <InfoItem
            label="Duration"
            value={`${test?.duration_minutes ?? 0} min`}
          />

          <InfoItem
            label="Marks / Question"
            value={
              test?.marks_per_question ??
              0
            }
          />

          <InfoItem
            label="Negative Marks"
            value={`-${test?.negative_marks ?? 0}`}
          />

          <InfoItem
            label="Answered"
            value={
              attempt.answered_questions ??
              0
            }
          />

          <InfoItem
            label="Marked for Review"
            value={
              attempt.marked_questions ??
              0
            }
          />
        </div>
      </div>

      {/* ======================================== */}
      {/* QUESTIONS */}
      {/* ======================================== */}

      <div
        style={{
          background:
            "#FFFFFF",
          border:
            "1px solid #E4E7EC",
          borderRadius:
            "10px",
          overflow:
            "hidden",
        }}
      >
        <div
          style={{
            padding:
              "18px 20px",
            borderBottom:
              "1px solid #EAECF0",
          }}
        >
          <h2
            style={{
              margin: 0,
              color:
                "#10233F",
              fontSize:
                "18px",
            }}
          >
            Question-wise Result
          </h2>

          <p
            style={{
              margin:
                "5px 0 0",
              color:
                "#667085",
              fontSize:
                "13px",
            }}
          >
            Review every question,
            selected answer and
            correct answer.
          </p>
        </div>

        {answers.length ===
        0 ? (
          <div
            style={{
              padding:
                "50px",
              textAlign:
                "center",
              color:
                "#667085",
            }}
          >
            No answer records found
            for this attempt.
          </div>
        ) : (
          <div>
            {answers.map(
              (
                item,
                index
              ) => {
                const question =
                  item.question;

                const selected =
                  item.selected_answer;

                const correct =
                  question?.correct_answer;

                const answered =
                  selected !==
                    null &&
                  selected !==
                    undefined;

                return (
                  <div
                    key={
                      item.id ||
                      `${item.question_id}-${index}`
                    }
                    style={{
                      padding:
                        "20px",
                      borderBottom:
                        "1px solid #EAECF0",
                    }}
                  >
                    {/* Question header */}
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap:
                          "15px",
                        marginBottom:
                          "14px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "8px",
                            marginBottom:
                              "7px",
                          }}
                        >
                          <span
                            style={{
                              width:
                                "30px",
                              height:
                                "30px",
                              borderRadius:
                                "7px",
                              background:
                                "#EAF4FF",
                              color:
                                "#003B82",
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontWeight:
                                700,
                              fontSize:
                                "13px",
                            }}
                          >
                            {index +
                              1}
                          </span>

                          <span
                            style={{
                              fontFamily:
                                "monospace",
                              color:
                                "#667085",
                              fontSize:
                                "11px",
                            }}
                          >
                            {item.question_id}
                          </span>
                        </div>

                        <div
                          style={{
                            color:
                              "#10233F",
                            fontSize:
                              "15px",
                            fontWeight:
                              600,
                            lineHeight:
                              1.55,
                          }}
                        >
                          {question?.question_text ||
                            "Question text unavailable"}
                        </div>
                      </div>

                      {/* Result badge */}
                      <ResultBadge
                        isCorrect={
                          item.is_correct
                        }
                        answered={
                          answered
                        }
                      />
                    </div>

                    {/* Options */}
                    {question && (
                      <div
                        style={{
                          display:
                            "grid",
                          gap:
                            "8px",
                        }}
                      >
                        {[
                          {
                            index: 0,
                            label: "A",
                            text:
                              question.option_a,
                          },
                          {
                            index: 1,
                            label: "B",
                            text:
                              question.option_b,
                          },
                          {
                            index: 2,
                            label: "C",
                            text:
                              question.option_c,
                          },
                          {
                            index: 3,
                            label: "D",
                            text:
                              question.option_d,
                          },
                        ].map(
                          (
                            option
                          ) => {
                            const isSelected =
                              selected ===
                              option.index;

                            const isCorrect =
                              correct ===
                              option.index;

                            let background =
                              "#FFFFFF";

                            let border =
                              "1px solid #E4E7EC";

                            let textColor =
                              "#344054";

                            if (
                              isCorrect
                            ) {
                              background =
                                "#ECFDF3";
                              border =
                                "1px solid #ABEFC6";
                              textColor =
                                "#027A48";
                            }

                            if (
                              isSelected &&
                              !isCorrect
                            ) {
                              background =
                                "#FFF1F2";
                              border =
                                "1px solid #FECDD3";
                              textColor =
                                "#BE123C";
                            }

                            return (
                              <div
                                key={
                                  option.index
                                }
                                style={{
                                  padding:
                                    "11px 13px",
                                  border,
                                  background,
                                  borderRadius:
                                    "8px",
                                  display:
                                    "flex",
                                  alignItems:
                                    "flex-start",
                                  gap:
                                    "10px",
                                }}
                              >
                                <span
                                  style={{
                                    width:
                                      "27px",
                                    height:
                                      "27px",
                                    flexShrink:
                                      0,
                                    borderRadius:
                                      "6px",
                                    display:
                                      "inline-flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    background:
                                      isCorrect
                                        ? "#D1FADF"
                                        : isSelected
                                        ? "#FFE4E6"
                                        : "#F2F4F7",
                                    color:
                                      isCorrect
                                        ? "#027A48"
                                        : isSelected
                                        ? "#BE123C"
                                        : "#667085",
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {
                                    option.label
                                  }
                                </span>

                                <div
                                  style={{
                                    flex:
                                      1,
                                    color:
                                      textColor,
                                    fontSize:
                                      "13px",
                                    lineHeight:
                                      1.5,
                                  }}
                                >
                                  {
                                    option.text
                                  }
                                </div>

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    gap:
                                      "5px",
                                    flexShrink:
                                      0,
                                    flexWrap:
                                      "wrap",
                                    justifyContent:
                                      "flex-end",
                                  }}
                                >
                                  {isSelected && (
                                    <span
                                      style={{
                                        padding:
                                          "3px 7px",
                                        borderRadius:
                                          "999px",
                                        background:
                                          "#F2F4F7",
                                        color:
                                          "#475467",
                                        fontSize:
                                          "10px",
                                        fontWeight:
                                          600,
                                      }}
                                    >
                                      Selected
                                    </span>
                                  )}

                                  {isCorrect && (
                                    <span
                                      style={{
                                        padding:
                                          "3px 7px",
                                        borderRadius:
                                          "999px",
                                        background:
                                          "#D1FADF",
                                        color:
                                          "#027A48",
                                        fontSize:
                                          "10px",
                                        fontWeight:
                                          600,
                                      }}
                                    >
                                      Correct
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                    {/* Bottom details */}
                    <div
                      style={{
                        marginTop:
                          "13px",
                        display:
                          "flex",
                        gap:
                          "18px",
                        flexWrap:
                          "wrap",
                        color:
                          "#667085",
                        fontSize:
                          "12px",
                      }}
                    >
                      <span>
                        Selected:{" "}
                        <strong
                          style={{
                            color:
                              "#344054",
                          }}
                        >
                          {answerLabel(
                            selected
                          )}
                        </strong>
                      </span>

                      <span>
                        Correct:{" "}
                        <strong
                          style={{
                            color:
                              "#027A48",
                          }}
                        >
                          {answerLabel(
                            correct
                          )}
                        </strong>
                      </span>

                      <span>
                        Marks:{" "}
                        <strong
                          style={{
                            color:
                              "#344054",
                          }}
                        >
                          {question?.marks ??
                            0}
                        </strong>
                      </span>

                      <span>
                        Negative:{" "}
                        <strong
                          style={{
                            color:
                              "#BE123C",
                          }}
                        >
                          -
                          {question?.negative_marks ??
                            0}
                        </strong>
                      </span>

                      {item.marked_for_review && (
                        <span
                          style={{
                            color:
                              "#B54708",
                            fontWeight:
                              600,
                          }}
                        >
                          Marked for Review
                        </span>
                      )}

                      {item.answered_at && (
                        <span>
                          Answered:{" "}
                          {formatDate(
                            item.answered_at
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes adminAttemptDetailsSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

// ==================================================
// SCORE CARD
// ==================================================

function ScoreCard({
  title,
  value,
  icon,
}) {
  return (
    <div
      style={{
        background:
          "#FFFFFF",
        border:
          "1px solid #E4E7EC",
        borderRadius:
          "10px",
        padding:
          "17px",
      }}
    >
      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            "10px",
          color:
            "#003B82",
          marginBottom:
            "10px",
        }}
      >
        {icon}

        <span
          style={{
            color:
              "#667085",
            fontSize:
              "12px",
            fontWeight:
              600,
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          color:
            "#10233F",
          fontSize:
            "22px",
          fontWeight:
            700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ==================================================
// INFO ITEM
// ==================================================

function InfoItem({
  label,
  value,
  mono = false,
}) {
  return (
    <div
      style={{
        minWidth:
          "130px",
      }}
    >
      <div
        style={{
          color:
            "#98A2B3",
          fontSize:
            "11px",
          textTransform:
            "uppercase",
          fontWeight:
            600,
          marginBottom:
            "4px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color:
            "#10233F",
          fontSize:
            "14px",
          fontWeight:
            600,
          fontFamily:
            mono
              ? "monospace"
              : "inherit",
          wordBreak:
            mono
              ? "break-all"
              : "normal",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ==================================================
// RESULT BADGE
// ==================================================

function ResultBadge({
  isCorrect,
  answered,
}) {
  if (!answered) {
    return (
      <span
        style={{
          display:
            "inline-flex",
          alignItems:
            "center",
          gap:
            "5px",
          padding:
            "6px 10px",
          borderRadius:
            "999px",
          background:
            "#F2F4F7",
          color:
            "#667085",
          fontSize:
            "11px",
          fontWeight:
            600,
        }}
      >
        Unanswered
      </span>
    );
  }

  if (isCorrect) {
    return (
      <span
        style={{
          display:
            "inline-flex",
          alignItems:
            "center",
          gap:
            "5px",
          padding:
            "6px 10px",
          borderRadius:
            "999px",
          background:
            "#ECFDF3",
          color:
            "#027A48",
          fontSize:
            "11px",
          fontWeight:
            600,
        }}
      >
        <CheckCircle2
          size={13}
        />
        Correct
      </span>
    );
  }

  return (
    <span
      style={{
        display:
          "inline-flex",
        alignItems:
          "center",
        gap:
          "5px",
        padding:
          "6px 10px",
        borderRadius:
          "999px",
        background:
          "#FFF1F2",
        color:
          "#BE123C",
        fontSize:
          "11px",
        fontWeight:
          600,
      }}
    >
      <XCircle
        size={13}
      />
      Wrong
    </span>
  );
}

// ==================================================
// BUTTONS
// ==================================================

const backButton = {
  border:
    "none",
  background:
    "transparent",
  color:
    "#003B82",
  padding:
    0,
  cursor:
    "pointer",
  display:
    "inline-flex",
  alignItems:
    "center",
  gap:
    "6px",
  fontSize:
    "14px",
  fontWeight:
    600,
};

const secondaryButton = {
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#10233F",
  padding:
    "10px 14px",
  borderRadius:
    "8px",
  cursor:
    "pointer",
  display:
    "flex",
  alignItems:
    "center",
  gap:
    "7px",
  fontWeight:
    600,
};

const errorBox = {
  background:
    "#FFF1F2",
  border:
    "1px solid #FECDD3",
  color:
    "#BE123C",
  padding:
    "12px 14px",
  borderRadius:
    "8px",
};

export default AdminAttemptDetails;