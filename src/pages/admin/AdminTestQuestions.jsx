import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CircleOff,
  FileText,
  Loader2,
  MoveRight,
  Pencil,
  Power,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const PAGE_SIZE = 20;
const SEARCH_PAGE_SIZE = 10;

function AdminTestQuestions() {
  const navigate = useNavigate();
  const { testId } = useParams();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [totalQuestions, setTotalQuestions] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState(0);
  const [inactiveQuestions, setInactiveQuestions] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveSearch, setMoveSearch] = useState("");
  const [availableQuestions, setAvailableQuestions] =
    useState([]);
  const [availableTotal, setAvailableTotal] =
    useState(0);
  const [availablePage, setAvailablePage] = useState(1);
  const [availableLoading, setAvailableLoading] =
    useState(false);
  const [movingQuestionId, setMovingQuestionId] =
    useState(null);

  const [error, setError] = useState("");

  const totalPages = Math.max(
    1,
    Math.ceil(totalQuestions / PAGE_SIZE)
  );

  const availableTotalPages = Math.max(
    1,
    Math.ceil(availableTotal / SEARCH_PAGE_SIZE)
  );

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const availableFrom =
    (availablePage - 1) * SEARCH_PAGE_SIZE;

  const availableTo =
    availableFrom + SEARCH_PAGE_SIZE - 1;

  async function loadTest() {
    try {
      setTestLoading(true);

      const { data, error: testError } = await supabase
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
            active,
            test_type,
            subject_id,
            track_id
          `
        )
        .eq("id", testId)
        .single();

      if (testError) throw testError;

      setTest(data);
    } catch (err) {
      console.error("Error loading test:", err);
      setError(err.message || "Failed to load test.");
    } finally {
      setTestLoading(false);
    }
  }

  async function loadQuestions() {
    try {
      setLoading(true);
      setError("");

      let query = supabase
        .from("questions")
        .select(
          `
            id,
            test_id,
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
            active,
            created_at
          `,
          { count: "exact" }
        )
        .eq("test_id", testId)
        .order("display_order", {
          ascending: true,
        })
        .range(from, to);

      if (search.trim()) {
        const searchText = search
          .trim()
          .replace(/,/g, " ");

        query = query.or(
          `id.ilike.%${searchText}%,question_text.ilike.%${searchText}%`
        );
      }

      if (statusFilter === "active") {
        query = query.eq("active", true);
      }

      if (statusFilter === "inactive") {
        query = query.eq("active", false);
      }

      const {
        data,
        error: questionError,
        count,
      } = await query;

      if (questionError) throw questionError;

      setQuestions(data || []);
      setTotalQuestions(count || 0);

      await loadQuestionStats();
    } catch (err) {
      console.error(
        "Error loading test questions:",
        err
      );
      setError(
        err.message || "Failed to load test questions."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestionStats() {
    const [
      { count: activeCount, error: activeError },
      { count: inactiveCount, error: inactiveError },
    ] = await Promise.all([
      supabase
        .from("questions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("test_id", testId)
        .eq("active", true),

      supabase
        .from("questions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("test_id", testId)
        .eq("active", false),
    ]);

    if (activeError) throw activeError;
    if (inactiveError) throw inactiveError;

    setActiveQuestions(activeCount || 0);
    setInactiveQuestions(inactiveCount || 0);
  }

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!testId) return;

    loadQuestions();
  }, [
    testId,
    page,
    search,
    statusFilter,
  ]);

  async function toggleQuestion(question) {
    const action = question.active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this question?`
    );

    if (!confirmed) return;

    try {
      const { error: updateError } = await supabase
        .from("questions")
        .update({
          active: !question.active,
        })
        .eq("id", question.id);

      if (updateError) throw updateError;

      await loadQuestions();
    } catch (err) {
      console.error(
        "Error updating question:",
        err
      );

      setError(
        err.message || "Failed to update question."
      );
    }
  }

  function openMoveModal() {
    setMoveSearch("");
    setAvailablePage(1);
    setAvailableQuestions([]);
    setAvailableTotal(0);
    setError("");
    setShowMoveModal(true);
  }

  function closeMoveModal() {
    if (movingQuestionId) return;

    setShowMoveModal(false);
    setMoveSearch("");
    setAvailableQuestions([]);
    setAvailableTotal(0);
  }

  async function loadAvailableQuestions() {
    try {
      setAvailableLoading(true);
      setError("");

      let query = supabase
        .from("questions")
        .select(
          `
            id,
            test_id,
            question_text,
            display_order,
            active
          `,
          { count: "exact" }
        )
        .neq("test_id", testId)
        .order("created_at", {
          ascending: false,
        })
        .range(availableFrom, availableTo);

      if (moveSearch.trim()) {
        const searchText = moveSearch
          .trim()
          .replace(/,/g, " ");

        query = query.or(
          `id.ilike.%${searchText}%,question_text.ilike.%${searchText}%`
        );
      }

      const {
        data,
        error: searchError,
        count,
      } = await query;

      if (searchError) throw searchError;

      setAvailableQuestions(data || []);
      setAvailableTotal(count || 0);
    } catch (err) {
      console.error(
        "Error searching questions:",
        err
      );

      setError(
        err.message ||
          "Failed to search available questions."
      );
    } finally {
      setAvailableLoading(false);
    }
  }

  useEffect(() => {
    if (!showMoveModal) return;

    loadAvailableQuestions();
  }, [
    showMoveModal,
    availablePage,
    moveSearch,
    testId,
  ]);

  useEffect(() => {
    setAvailablePage(1);
  }, [moveSearch]);

  async function moveQuestion(question) {
    const confirmed = window.confirm(
      `Move question "${question.id}" to "${test?.title}"?`
    );

    if (!confirmed) return;

    try {
      setMovingQuestionId(question.id);
      setError("");

      const { error: updateError } = await supabase
        .from("questions")
        .update({
          test_id: testId,
        })
        .eq("id", question.id);

      if (updateError) throw updateError;

      await loadQuestions();
      await loadAvailableQuestions();
    } catch (err) {
      console.error(
        "Error moving question:",
        err
      );

      setError(
        err.message || "Failed to move question."
      );
    } finally {
      setMovingQuestionId(null);
    }
  }

  function editQuestion(question) {
    navigate(
      `/admin/questions/${question.id}/edit`
    );
  }

  function answerLabel(index) {
    const labels = ["A", "B", "C", "D"];

    return labels[index] || "—";
  }

  const displayedQuestionRange = useMemo(() => {
    if (totalQuestions === 0) {
      return "0 questions";
    }

    const start = from + 1;
    const end = Math.min(
      from + questions.length,
      totalQuestions
    );

    return `${start}–${end} of ${totalQuestions}`;
  }, [
    from,
    questions.length,
    totalQuestions,
  ]);

  if (testLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#667085",
        }}
      >
        <Loader2
          size={25}
          style={{
            animation:
              "testQuestionsSpin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!test) {
    return (
      <div
        style={{
          padding: "40px",
          background: "#F7F9FC",
          minHeight: "100vh",
        }}
      >
        <div style={errorBox}>
          Test not found.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "28px",
        background: "#F7F9FC",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <button
            onClick={() => navigate("/admin/tests")}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              color: "#003B82",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            <ArrowLeft size={16} />
            Back to Tests
          </button>

          <h1
            style={{
              margin: 0,
              color: "#10233F",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Test Questions
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#667085",
              fontSize: "14px",
            }}
          >
            {test.title}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={loadQuestions}
            disabled={loading}
            style={secondaryButton}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={openMoveModal}
            style={primaryButton}
          >
            <MoveRight size={17} />
            Add Existing Question
          </button>
        </div>
      </div>

      {error && !showMoveModal && (
        <div style={errorBox}>
          {error}
        </div>
      )}

      {/* Test information */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E7EC",
          borderRadius: "10px",
          padding: "16px 18px",
          marginBottom: "18px",
          display: "flex",
          gap: "25px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <InfoItem
          label="Type"
          value={
            test.test_type === "mock"
              ? "Mock"
              : "Practice"
          }
        />

        <InfoItem
          label="Set"
          value={test.set_number}
        />

        <InfoItem
          label="Configured Questions"
          value={test.total_questions}
        />

        <InfoItem
          label="Duration"
          value={`${test.duration_minutes} min`}
        />

        <InfoItem
          label="Marks"
          value={test.marks_per_question}
        />

        <InfoItem
          label="Negative"
          value={`-${test.negative_marks}`}
        />
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          icon={<FileText size={22} />}
          title="Total Questions"
          value={totalQuestions}
        />

        <StatCard
          icon={<CheckCircle2 size={22} />}
          title="Active"
          value={activeQuestions}
        />

        <StatCard
          icon={<CircleOff size={22} />}
          title="Inactive"
          value={inactiveQuestions}
        />
      </div>

      {/* Filters */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E7EC",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(250px, 1fr) 180px",
            gap: "10px",
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
            <Search
              size={17}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                color: "#98A2B3",
              }}
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search question ID or text..."
              style={{
                ...inputStyle,
                paddingLeft: "38px",
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            style={inputStyle}
          >
            <option value="all">
              All Status
            </option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* Question table */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E7EC",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "60px",
              display: "flex",
              justifyContent: "center",
              color: "#667085",
            }}
          >
            <Loader2
              size={25}
              style={{
                animation:
                  "testQuestionsSpin 1s linear infinite",
              }}
            />
          </div>
        ) : questions.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#667085",
            }}
          >
            No questions found for this test.
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: "1050px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#F9FAFB",
                      borderBottom:
                        "1px solid #E4E7EC",
                    }}
                  >
                    <th style={thStyle}>
                      Order
                    </th>

                    <th style={thStyle}>
                      Question
                    </th>

                    <th style={thStyle}>
                      Type
                    </th>

                    <th style={thStyle}>
                      Answer
                    </th>

                    <th style={thStyle}>
                      Marks
                    </th>

                    <th style={thStyle}>
                      Status
                    </th>

                    <th
                      style={{
                        ...thStyle,
                        textAlign:
                          "right",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {questions.map(
                    (question) => (
                      <tr
                        key={
                          question.id
                        }
                        style={{
                          borderBottom:
                            "1px solid #EAECF0",
                        }}
                      >
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 600,
                          }}
                        >
                          {
                            question.display_order
                          }
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            maxWidth:
                              "600px",
                          }}
                        >
                          <div
                            style={{
                              fontFamily:
                                "monospace",
                              fontSize:
                                "12px",
                              color:
                                "#667085",
                              marginBottom:
                                "5px",
                            }}
                          >
                            {question.id}
                          </div>

                          <div
                            style={{
                              color:
                                "#10233F",
                              fontWeight:
                                500,
                              lineHeight:
                                1.5,
                            }}
                          >
                            {
                              question.question_text
                            }
                          </div>
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {
                            question.question_type ||
                            "single"
                          }
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          <span
                            style={{
                              display:
                                "inline-flex",
                              width:
                                "30px",
                              height:
                                "30px",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              borderRadius:
                                "7px",
                              background:
                                "#EAF4FF",
                              color:
                                "#003B82",
                              fontWeight:
                                700,
                            }}
                          >
                            {answerLabel(
                              question.correct_answer
                            )}
                          </span>
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {question.marks}
                          <div
                            style={{
                              fontSize:
                                "11px",
                              color:
                                "#98A2B3",
                            }}
                          >
                            -
                            {
                              question.negative_marks
                            }
                          </div>
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          <span
                            style={{
                              display:
                                "inline-flex",
                              padding:
                                "5px 9px",
                              borderRadius:
                                "999px",
                              background:
                                question.active
                                  ? "#ECFDF3"
                                  : "#F2F4F7",
                              color:
                                question.active
                                  ? "#027A48"
                                  : "#667085",
                              fontSize:
                                "12px",
                              fontWeight:
                                600,
                            }}
                          >
                            {question.active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign:
                              "right",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "flex-end",
                              gap: "7px",
                            }}
                          >
                            <button
                              onClick={() =>
                                editQuestion(
                                  question
                                )
                              }
                              title="Edit Question"
                              style={
                                iconButtonStyle
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              onClick={() =>
                                toggleQuestion(
                                  question
                                )
                              }
                              title={
                                question.active
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              style={
                                iconButtonStyle
                              }
                            >
                              <Power
                                size={16}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              style={{
                padding:
                  "13px 16px",
                borderTop:
                  "1px solid #EAECF0",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap:
                  "wrap",
              }}
            >
              <span
                style={{
                  color:
                    "#667085",
                  fontSize:
                    "13px",
                }}
              >
                {displayedQuestionRange}
              </span>

              <Pagination
                page={page}
                totalPages={
                  totalPages
                }
                onPageChange={
                  setPage
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Move Existing Question Modal */}
      {showMoveModal && (
        <div
          style={modalOverlay}
        >
          <div
            style={{
              width: "100%",
              maxWidth:
                "850px",
              maxHeight:
                "90vh",
              overflowY:
                "auto",
              background:
                "#FFFFFF",
              borderRadius:
                "12px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                padding:
                  "18px 20px",
                borderBottom:
                  "1px solid #EAECF0",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color:
                      "#10233F",
                    fontSize:
                      "20px",
                  }}
                >
                  Add Existing Question
                </h2>

                <p
                  style={{
                    margin:
                      "4px 0 0",
                    color:
                      "#667085",
                    fontSize:
                      "13px",
                  }}
                >
                  Search for a question and move it
                  to this test.
                </p>
              </div>

              <button
                onClick={
                  closeMoveModal
                }
                disabled={
                  !!movingQuestionId
                }
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  cursor:
                    "pointer",
                  color:
                    "#667085",
                }}
              >
                <X size={21} />
              </button>
            </div>

            <div
              style={{
                padding:
                  "18px 20px",
              }}
            >
              {error && (
                <div
                  style={{
                    ...errorBox,
                    marginBottom:
                      "16px",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  position:
                    "relative",
                  marginBottom:
                    "16px",
                }}
              >
                <Search
                  size={17}
                  style={{
                    position:
                      "absolute",
                    left: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color:
                      "#98A2B3",
                  }}
                />

                <input
                  value={
                    moveSearch
                  }
                  onChange={(
                    e
                  ) =>
                    setMoveSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search by question ID or question text..."
                  style={{
                    ...inputStyle,
                    paddingLeft:
                      "38px",
                  }}
                />
              </div>

              {availableLoading ? (
                <div
                  style={{
                    padding:
                      "45px",
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    color:
                      "#667085",
                  }}
                >
                  <Loader2
                    size={24}
                    style={{
                      animation:
                        "testQuestionsSpin 1s linear infinite",
                    }}
                  />
                </div>
              ) : availableQuestions.length ===
                0 ? (
                <div
                  style={{
                    padding:
                      "45px",
                    textAlign:
                      "center",
                    color:
                      "#667085",
                  }}
                >
                  No questions found.
                </div>
              ) : (
                <>
                  <div
                    style={{
                      border:
                        "1px solid #E4E7EC",
                      borderRadius:
                        "9px",
                      overflow:
                        "hidden",
                    }}
                  >
                    {availableQuestions.map(
                      (
                        question
                      ) => (
                        <div
                          key={
                            question.id
                          }
                          style={{
                            padding:
                              "13px 15px",
                            borderBottom:
                              "1px solid #EAECF0",
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap:
                              "15px",
                          }}
                        >
                          <div
                            style={{
                              minWidth:
                                0,
                            }}
                          >
                            <div
                              style={{
                                fontFamily:
                                  "monospace",
                                fontSize:
                                  "11px",
                                color:
                                  "#667085",
                                marginBottom:
                                  "4px",
                              }}
                            >
                              {
                                question.id
                              }
                            </div>

                            <div
                              style={{
                                color:
                                  "#10233F",
                                fontSize:
                                  "14px",
                                lineHeight:
                                  1.45,
                                display:
                                  "-webkit-box",
                                WebkitLineClamp:
                                  2,
                                WebkitBoxOrient:
                                  "vertical",
                                overflow:
                                  "hidden",
                              }}
                            >
                              {
                                question.question_text
                              }
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              moveQuestion(
                                question
                              )
                            }
                            disabled={
                              !!movingQuestionId
                            }
                            style={{
                              ...primaryButton,
                              flexShrink:
                                0,
                            }}
                          >
                            {movingQuestionId ===
                            question.id ? (
                              <Loader2
                                size={16}
                                style={{
                                  animation:
                                    "testQuestionsSpin 1s linear infinite",
                                }}
                              />
                            ) : (
                              <MoveRight
                                size={
                                  16
                                }
                              />
                            )}
                            Move Here
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <div
                    style={{
                      marginTop:
                        "14px",
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "13px",
                        color:
                          "#667085",
                      }}
                    >
                      {availableTotal}{" "}
                      available
                      questions
                    </span>

                    <Pagination
                      page={
                        availablePage
                      }
                      totalPages={
                        availableTotalPages
                      }
                      onPageChange={
                        setAvailablePage
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                padding:
                  "14px 20px",
                borderTop:
                  "1px solid #EAECF0",
                display:
                  "flex",
                justifyContent:
                  "flex-end",
              }}
            >
              <button
                onClick={
                  closeMoveModal
                }
                disabled={
                  !!movingQuestionId
                }
                style={
                  cancelButton
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes testQuestionsSpin {
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

function Pagination({
  page,
  totalPages,
  onPageChange,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <button
        disabled={page <= 1}
        onClick={() =>
          onPageChange(
            Math.max(1, page - 1)
          )
        }
        style={{
          ...paginationButton,
          opacity:
            page <= 1 ? 0.5 : 1,
        }}
      >
        Previous
      </button>

      <span
        style={{
          minWidth: "75px",
          textAlign: "center",
          color: "#344054",
          fontSize: "13px",
        }}
      >
        {page} / {totalPages}
      </span>

      <button
        disabled={page >= totalPages}
        onClick={() =>
          onPageChange(
            Math.min(
              totalPages,
              page + 1
            )
          )
        }
        style={{
          ...paginationButton,
          opacity:
            page >= totalPages
              ? 0.5
              : 1,
        }}
      >
        Next
      </button>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
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
        padding: "18px",
        display:
          "flex",
        alignItems:
          "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius:
            "9px",
          background:
            "#EAF4FF",
          color:
            "#003B82",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color:
              "#667085",
            fontSize:
              "13px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop:
              "3px",
            color:
              "#10233F",
            fontSize:
              "24px",
            fontWeight:
              700,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}) {
  return (
    <div>
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
          marginTop:
            "3px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing:
    "border-box",
  height: "42px",
  border:
    "1px solid #D0D5DD",
  borderRadius:
    "8px",
  padding:
    "0 12px",
  background:
    "#FFFFFF",
  color:
    "#10233F",
  outline:
    "none",
  fontSize:
    "14px",
};

const thStyle = {
  padding:
    "12px 16px",
  textAlign:
    "left",
  color:
    "#667085",
  fontSize:
    "12px",
  fontWeight:
    600,
  textTransform:
    "uppercase",
  letterSpacing:
    "0.03em",
  whiteSpace:
    "nowrap",
};

const tdStyle = {
  padding:
    "14px 16px",
  color:
    "#344054",
  fontSize:
    "14px",
  verticalAlign:
    "middle",
};

const primaryButton = {
  border:
    "none",
  background:
    "#003B82",
  color:
    "#FFFFFF",
  padding:
    "10px 16px",
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
};

const cancelButton = {
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#344054",
  padding:
    "10px 16px",
  borderRadius:
    "8px",
  cursor:
    "pointer",
};

const paginationButton = {
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#344054",
  padding:
    "7px 11px",
  borderRadius:
    "7px",
  cursor:
    "pointer",
  fontSize:
    "12px",
};

const iconButtonStyle = {
  width: "34px",
  height: "34px",
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#475467",
  borderRadius:
    "7px",
  cursor:
    "pointer",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
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
  marginBottom:
    "18px",
};

const modalOverlay = {
  position:
    "fixed",
  inset: 0,
  background:
    "rgba(16, 35, 63, 0.45)",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  padding:
    "20px",
  zIndex: 1000,
};

export default AdminTestQuestions;