import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const PAGE_SIZE = 20;

function AdminAttempts() {
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [tests, setTests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [testFilter, setTestFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalAttempts, setTotalAttempts] =
    useState(0);

  const totalPages = Math.max(
    1,
    Math.ceil(totalAttempts / PAGE_SIZE)
  );

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // --------------------------------------------------
  // LOAD TESTS
  // --------------------------------------------------

  async function loadTests() {
    const { data, error: testError } =
      await supabase
        .from("tests")
        .select(
          "id, title, set_number"
        )
        .order("title", {
          ascending: true,
        });

    if (testError) {
      throw testError;
    }

    setTests(data || []);
  }

  // --------------------------------------------------
  // LOAD ATTEMPTS
  // --------------------------------------------------

  async function loadAttempts() {
    try {
      setLoading(true);
      setError("");

      let query = supabase
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
          `,
          {
            count: "exact",
          }
        )
        .order("submitted_at", {
          ascending: false,
          nullsFirst: false,
        })
        .range(from, to);

      // Test filter
      if (testFilter) {
        query = query.eq(
          "test_id",
          testFilter
        );
      }

      // Student ID search
      if (search.trim()) {
        query = query.ilike(
          "user_id",
          `%${search.trim()}%`
        );
      }

      const {
        data,
        error: attemptError,
        count,
      } = await query;

      if (attemptError) {
        throw attemptError;
      }

      setAttempts(data || []);
      setTotalAttempts(count || 0);
    } catch (err) {
      console.error(
        "Error loading attempts:",
        err
      );

      setError(
        err.message ||
          "Failed to load attempts."
      );

      setAttempts([]);
      setTotalAttempts(0);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");

        await loadTests();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Failed to load data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // --------------------------------------------------
  // RESET PAGE WHEN FILTER CHANGES
  // --------------------------------------------------

  useEffect(() => {
    setPage(1);
  }, [
    search,
    testFilter,
  ]);

  // --------------------------------------------------
  // LOAD ATTEMPTS
  // --------------------------------------------------

  useEffect(() => {
    loadAttempts();
  }, [
    page,
    search,
    testFilter,
  ]);

  // --------------------------------------------------
  // TEST MAP
  // --------------------------------------------------

  const testMap = useMemo(() => {
    return Object.fromEntries(
      tests.map((test) => [
        test.id,
        test,
      ])
    );
  }, [tests]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const statistics = useMemo(() => {
    const submitted = attempts.filter(
      (attempt) =>
        !!attempt.submitted_at
    ).length;

    const inProgress = attempts.filter(
      (attempt) =>
        !attempt.submitted_at
    ).length;

    const totalAnswered =
      attempts.reduce(
        (total, attempt) =>
          total +
          Number(
            attempt.answered_questions ||
              0
          ),
        0
      );

    const totalUnanswered =
      attempts.reduce(
        (total, attempt) =>
          total +
          Number(
            attempt.unanswered_questions ||
              0
          ),
        0
      );

    return {
      total: totalAttempts,
      submitted,
      inProgress,
      totalAnswered,
      totalUnanswered,
    };
  }, [
    attempts,
    totalAttempts,
  ]);

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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

  // --------------------------------------------------
  // FORMAT DURATION
  // --------------------------------------------------

  function formatDuration(seconds) {
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

    const minutes = Math.floor(
      totalSeconds / 60
    );

    const remainingSeconds =
      totalSeconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  }

  // --------------------------------------------------
  // FORMAT NUMBER
  // --------------------------------------------------

  function formatNumber(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "0";
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return "0";
    }

    return number.toLocaleString(
      "en-IN"
    );
  }

  // --------------------------------------------------
  // FORMAT SCORE
  // --------------------------------------------------

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
      !Number.isFinite(number)
    ) {
      return "0";
    }

    if (
      Number.isInteger(number)
    ) {
      return String(number);
    }

    return number.toFixed(2);
  }

  // --------------------------------------------------
  // CALCULATE ACCURACY
  // --------------------------------------------------

  function getAccuracy(attempt) {
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
  }

  // --------------------------------------------------
  // CLEAR FILTERS
  // --------------------------------------------------

  function clearFilters() {
    setSearch("");
    setTestFilter("");
  }

  // --------------------------------------------------
  // VIEW ATTEMPT
  // --------------------------------------------------

  function viewAttempt(attempt) {
    navigate(
      `/admin/attempts/${attempt.id}`
    );
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div
      style={{
        padding: "28px",
        background: "#F7F9FC",
        minHeight: "100vh",
      }}
    >
      {/* -------------------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------------------- */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#10233F",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Student Attempts
          </h1>

          <p
            style={{
              margin:
                "6px 0 0",
              color: "#667085",
              fontSize: "14px",
            }}
          >
            View student test attempts
            and results.
          </p>
        </div>

        <button
          onClick={loadAttempts}
          disabled={loading}
          style={{
            ...secondaryButton,
            opacity: loading
              ? 0.6
              : 1,
          }}
        >
          <RefreshCw
            size={16}
          />
          Refresh
        </button>
      </div>

      {/* -------------------------------------------- */}
      {/* ERROR */}
      {/* -------------------------------------------- */}

      {error && (
        <div style={errorBox}>
          {error}
        </div>
      )}

      {/* -------------------------------------------- */}
      {/* STATISTICS */}
      {/* -------------------------------------------- */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <StatCard
          icon={
            <FileText
              size={22}
            />
          }
          title="Total Attempts"
          value={
            statistics.total
          }
        />

        <StatCard
          icon={
            <CheckCircle2
              size={22}
            />
          }
          title="Submitted"
          value={
            statistics.submitted
          }
        />

        <StatCard
          icon={
            <Clock
              size={22}
            />
          }
          title="In Progress"
          value={
            statistics.inProgress
          }
        />

        <StatCard
          icon={
            <Users
              size={22}
            />
          }
          title="Answered"
          value={formatNumber(
            statistics.totalAnswered
          )}
        />
      </div>

      {/* -------------------------------------------- */}
      {/* FILTERS */}
      {/* -------------------------------------------- */}

      <div
        style={{
          background:
            "#FFFFFF",
          border:
            "1px solid #E4E7EC",
          borderRadius:
            "10px",
          padding: "16px",
          marginBottom:
            "18px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(250px, 1.5fr) 1fr auto",
            gap: "10px",
          }}
        >
          {/* Search */}
          <div
            style={{
              position:
                "relative",
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
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by student ID..."
              style={{
                ...inputStyle,
                paddingLeft:
                  "38px",
              }}
            />
          </div>

          {/* Test Filter */}
          <select
            value={testFilter}
            onChange={(e) =>
              setTestFilter(
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              All Tests
            </option>

            {tests.map(
              (test) => (
                <option
                  key={test.id}
                  value={test.id}
                >
                  {test.title}
                </option>
              )
            )}
          </select>

          {/* Clear */}
          <button
            onClick={
              clearFilters
            }
            style={
              clearButton
            }
          >
            Clear
          </button>
        </div>
      </div>

      {/* -------------------------------------------- */}
      {/* TABLE */}
      {/* -------------------------------------------- */}

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
        {loading ? (
          <div
            style={{
              padding:
                "60px",
              display:
                "flex",
              justifyContent:
                "center",
              alignItems:
                "center",
              color:
                "#667085",
            }}
          >
            <Loader2
              size={26}
              style={{
                animation:
                  "adminAttemptsSpin 1s linear infinite",
              }}
            />
          </div>
        ) : attempts.length ===
          0 ? (
          <div
            style={{
              padding:
                "60px",
              textAlign:
                "center",
              color:
                "#667085",
            }}
          >
            No attempts found.
          </div>
        ) : (
          <>
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={{
                  width:
                    "100%",
                  borderCollapse:
                    "collapse",
                  minWidth:
                    "1250px",
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
                    <th
                      style={
                        thStyle
                      }
                    >
                      Student
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Test
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Started
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Submitted
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Score
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Accuracy
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Answered
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Time
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Status
                    </th>

                    <th
                      style={{
                        ...thStyle,
                        textAlign:
                          "right",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {attempts.map(
                    (attempt) => {
                      const test =
                        testMap[
                          attempt.test_id
                        ];

                      const accuracy =
                        getAccuracy(
                          attempt
                        );

                      const isSubmitted =
                        !!attempt.submitted_at;

                      return (
                        <tr
                          key={
                            attempt.id
                          }
                          style={{
                            borderBottom:
                              "1px solid #EAECF0",
                          }}
                        >
                          {/* STUDENT */}
                          <td
                            style={
                              tdStyle
                            }
                          >
                            <div
                              style={{
                                fontFamily:
                                  "monospace",
                                fontSize:
                                  "12px",
                                color:
                                  "#475467",
                                maxWidth:
                                  "190px",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace:
                                  "nowrap",
                              }}
                              title={
                                attempt.user_id ||
                                ""
                              }
                            >
                              {attempt.user_id ||
                                "—"}
                            </div>
                          </td>

                          {/* TEST */}
                          <td
                            style={
                              tdStyle
                            }
                          >
                            <div
                              style={{
                                fontWeight:
                                  600,
                                color:
                                  "#10233F",
                                maxWidth:
                                  "250px",
                                lineHeight:
                                  1.4,
                              }}
                            >
                              {test?.title ||
                                "Unknown Test"}
                            </div>

                            {test && (
                              <div
                                style={{
                                  marginTop:
                                    "4px",
                                  fontSize:
                                    "12px",
                                  color:
                                    "#98A2B3",
                                }}
                              >
                                Set{" "}
                                {
                                  test.set_number
                                }
                              </div>
                            )}
                          </td>

                          {/* STARTED */}
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {formatDate(
                              attempt.started_at
                            )}
                          </td>

                          {/* SUBMITTED */}
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {formatDate(
                              attempt.submitted_at
                            )}
                          </td>

                          {/* SCORE */}
                          <td
                            style={
                              tdStyle
                            }
                          >
                            <div
                              style={{
                                fontWeight:
                                  700,
                                color:
                                  "#10233F",
                              }}
                            >
                              {formatScore(
                                attempt.score
                              )}
                              <span
                                style={{
                                  color:
                                    "#98A2B3",
                                  fontWeight:
                                    500,
                                }}
                              >
                                {" "}
                                /{" "}
                                {formatScore(
                                  attempt.maximum_score
                                )}
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "4px",
                                fontSize:
                                  "11px",
                                color:
                                  "#98A2B3",
                              }}
                            >
                              {
                                attempt.correct_answers
                              }{" "}
                              correct /{" "}
                              {
                                attempt.wrong_answers
                              }{" "}
                              wrong
                            </div>
                          </td>

                          {/* ACCURACY */}
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
                                  "#EAF4FF",
                                color:
                                  "#003B82",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {accuracy}%
                            </span>
                          </td>

                          {/* ANSWERED */}
                          <td
                            style={
                              tdStyle
                            }
                          >
                            <div
                              style={{
                                color:
                                  "#10233F",
                                fontWeight:
                                  600,
                              }}
                            >
                              {
                                attempt.answered_questions
                              }{" "}
                              /{" "}
                              {
                                attempt.total_questions
                              }
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "3px",
                                fontSize:
                                  "11px",
                                color:
                                  "#98A2B3",
                              }}
                            >
                              {
                                attempt.unanswered_questions
                              }{" "}
                              unanswered
                            </div>
                          </td>

                          {/* TIME */}
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {formatDuration(
                              attempt.time_taken_seconds
                            )}
                          </td>

                          {/* STATUS */}
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
                                  isSubmitted
                                    ? "#ECFDF3"
                                    : "#FFF7E6",
                                color:
                                  isSubmitted
                                    ? "#027A48"
                                    : "#B54708",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  600,
                              }}
                            >
                              {isSubmitted
                                ? "Submitted"
                                : "In Progress"}
                            </span>
                          </td>

                          {/* ACTION */}
                          <td
                            style={{
                              ...tdStyle,
                              textAlign:
                                "right",
                            }}
                          >
                            <button
                              onClick={() =>
                                viewAttempt(
                                  attempt
                                )
                              }
                              style={
                                primarySmallButton
                              }
                            >
                              <Eye
                                size={15}
                              />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* -------------------------------------- */}
            {/* PAGINATION */}
            {/* -------------------------------------- */}

            <div
              style={{
                padding:
                  "13px 16px",
                borderTop:
                  "1px solid #EAECF0",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap:
                  "12px",
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
                Showing{" "}
                {from + 1}–
                {Math.min(
                  from +
                    attempts.length,
                  totalAttempts
                )}{" "}
                of{" "}
                {totalAttempts}
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

      {/* -------------------------------------------- */}
      {/* ANIMATION */}
      {/* -------------------------------------------- */}

      <style>
        {`
          @keyframes adminAttemptsSpin {
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
// STAT CARD
// ==================================================

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
        padding:
          "18px",
        display:
          "flex",
        alignItems:
          "center",
        gap:
          "14px",
      }}
    >
      <div
        style={{
          width:
            "42px",
          height:
            "42px",
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

// ==================================================
// PAGINATION
// ==================================================

function Pagination({
  page,
  totalPages,
  onPageChange,
}) {
  return (
    <div
      style={{
        display:
          "flex",
        alignItems:
          "center",
        gap:
          "8px",
      }}
    >
      <button
        disabled={
          page <= 1
        }
        onClick={() =>
          onPageChange(
            Math.max(
              1,
              page - 1
            )
          )
        }
        style={{
          ...paginationButton,
          opacity:
            page <= 1
              ? 0.5
              : 1,
        }}
      >
        Previous
      </button>

      <span
        style={{
          minWidth:
            "70px",
          textAlign:
            "center",
          color:
            "#344054",
          fontSize:
            "13px",
        }}
      >
        {page} /{" "}
        {totalPages}
      </span>

      <button
        disabled={
          page >=
          totalPages
        }
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
            page >=
            totalPages
              ? 0.5
              : 1,
        }}
      >
        Next
      </button>
    </div>
  );
}

// ==================================================
// STYLES
// ==================================================

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

const primarySmallButton = {
  border:
    "none",
  background:
    "#003B82",
  color:
    "#FFFFFF",
  padding:
    "8px 12px",
  borderRadius:
    "7px",
  cursor:
    "pointer",
  display:
    "inline-flex",
  alignItems:
    "center",
  gap:
    "6px",
  fontSize:
    "13px",
  fontWeight:
    600,
};

const clearButton = {
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#344054",
  padding:
    "0 14px",
  borderRadius:
    "8px",
  cursor:
    "pointer",
  fontWeight:
    500,
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

export default AdminAttempts;