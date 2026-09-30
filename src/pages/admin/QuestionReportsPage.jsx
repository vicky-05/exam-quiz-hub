import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileQuestion,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const STATUS_TABS = [
  { key: "all", label: "All Reports" },
  { key: "pending", label: "Pending" },
  { key: "under_review", label: "Under Review" },
  { key: "resolved", label: "Resolved" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_META = {
  pending: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
    icon: Clock3,
  },

  under_review: {
    label: "Under Review",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
    icon: ShieldCheck,
  },

  resolved: {
    label: "Resolved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
    icon: CheckCircle2,
  },

  rejected: {
    label: "Rejected",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
    icon: XCircle,
  },
};

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getQuestionText(question) {
  return (
    question?.question_text ||
    question?.question ||
    question?.q ||
    question?.text ||
    "Question unavailable"
  );
}

function getOptionLabel(index) {
  return ["A", "B", "C", "D"][Number(index)] || "—";
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${meta.className}`}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function QuestionReportsPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [updatingId, setUpdatingId] = useState("");
  const [adminNote, setAdminNote] = useState("");

  /*
   * --------------------------------------------------
   * LOAD REPORTS
   * --------------------------------------------------
   */

  const loadReports = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data: reportRows, error: reportsError } = await supabase
        .from("question_reports")
        .select(
          "id, question_id, test_id, user_id, reason, description, status, admin_note, created_at, reviewed_at, reviewed_by"
        )
        .order("created_at", { ascending: false });

      if (reportsError) {
        throw reportsError;
      }

      const rows = reportRows || [];

      if (rows.length === 0) {
        setReports([]);
        return;
      }

      const questionIds = [
        ...new Set(rows.map((row) => String(row.question_id))),
      ];

      const testIds = [
        ...new Set(rows.map((row) => String(row.test_id))),
      ];

      const userIds = [
        ...new Set(
          rows.map((row) => row.user_id).filter(Boolean)
        ),
      ];

      const [
        { data: questions, error: questionsError },
        { data: tests, error: testsError },
        { data: profiles, error: profilesError },
      ] = await Promise.all([
        supabase
          .from("questions")
          .select(
            "id, question_text, option_a, option_b, option_c, option_d, correct_answer"
          )
          .in("id", questionIds),

        supabase
          .from("tests")
          .select("id, title")
          .in("id", testIds),

        userIds.length
          ? supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", userIds)
          : Promise.resolve({
              data: [],
              error: null,
            }),
      ]);

      if (questionsError) {
        throw questionsError;
      }

      if (testsError) {
        throw testsError;
      }

      if (profilesError) {
        throw profilesError;
      }

      const questionMap = new Map(
        (questions || []).map((item) => [
          String(item.id),
          item,
        ])
      );

      const testMap = new Map(
        (tests || []).map((item) => [
          String(item.id),
          item,
        ])
      );

      const profileMap = new Map(
        (profiles || []).map((item) => [
          String(item.id),
          item,
        ])
      );

      setReports(
        rows.map((report) => ({
          ...report,
          question:
            questionMap.get(String(report.question_id)) ||
            null,
          test:
            testMap.get(String(report.test_id)) ||
            null,
          reporter:
            profileMap.get(String(report.user_id)) ||
            null,
        }))
      );
    } catch (loadError) {
      console.error(
        "Failed to load question reports:",
        loadError
      );

      setError(
        loadError?.message ||
          "Unable to load question reports."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /*
   * --------------------------------------------------
   * COUNTS
   * --------------------------------------------------
   */

  const counts = useMemo(() => {
    return {
      all: reports.length,

      pending: reports.filter(
        (item) => item.status === "pending"
      ).length,

      under_review: reports.filter(
        (item) => item.status === "under_review"
      ).length,

      resolved: reports.filter(
        (item) => item.status === "resolved"
      ).length,

      rejected: reports.filter(
        (item) => item.status === "rejected"
      ).length,
    };
  }, [reports]);

  /*
   * --------------------------------------------------
   * FILTER
   * --------------------------------------------------
   */

  const filteredReports = useMemo(() => {
    const normalized = searchTerm
      .trim()
      .toLowerCase();

    return reports.filter((report) => {
      const matchesStatus =
        activeTab === "all" ||
        report.status === activeTab;

      if (!matchesStatus) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      const questionText =
        getQuestionText(report.question).toLowerCase();

      const reason = String(
        report.reason || ""
      ).toLowerCase();

      const description = String(
        report.description || ""
      ).toLowerCase();

      const email = String(
        report.reporter?.email || ""
      ).toLowerCase();

      const name = String(
        report.reporter?.full_name || ""
      ).toLowerCase();

      const testTitle = String(
        report.test?.title || ""
      ).toLowerCase();

      return (
        questionText.includes(normalized) ||
        reason.includes(normalized) ||
        description.includes(normalized) ||
        email.includes(normalized) ||
        name.includes(normalized) ||
        testTitle.includes(normalized)
      );
    });
  }, [activeTab, reports, searchTerm]);

  /*
   * --------------------------------------------------
   * OPEN REPORT
   * --------------------------------------------------
   */

  function openReport(report) {
    setSelectedReport(report);
    setAdminNote(report.admin_note || "");
  }

  /*
   * --------------------------------------------------
   * CLOSE REPORT
   * --------------------------------------------------
   */

  function closeReport() {
    if (updatingId) {
      return;
    }

    setSelectedReport(null);
    setAdminNote("");
  }

  /*
   * --------------------------------------------------
   * EDIT REPORTED QUESTION
   * --------------------------------------------------
   */

  function editReportedQuestion() {
    if (!selectedReport?.question_id) {
      setError(
        "This report is not linked to a valid question."
      );
      return;
    }

    navigate(
      `/admin/questions/${selectedReport.question_id}/edit`,
      {
        state: {
          returnTo: "/admin/question-reports",
          reportId: selectedReport.id,
        },
      }
    );
  }

  /*
   * --------------------------------------------------
   * UPDATE REPORT STATUS
   * --------------------------------------------------
   */

  async function updateStatus(status) {
    if (!selectedReport) {
      return;
    }

    try {
      setUpdatingId(selectedReport.id);
      setError("");

      const { data: userData } =
        await supabase.auth.getUser();

      const payload = {
        status,
        admin_note:
          adminNote.trim() || null,
        reviewed_at:
          new Date().toISOString(),
        reviewed_by:
          userData?.user?.id || null,
      };

      const { error: updateError } =
        await supabase
          .from("question_reports")
          .update(payload)
          .eq("id", selectedReport.id);

      if (updateError) {
        throw updateError;
      }

      setReports((current) =>
        current.map((report) =>
          report.id === selectedReport.id
            ? {
                ...report,
                ...payload,
              }
            : report
        )
      );

      setSelectedReport((current) =>
        current
          ? {
              ...current,
              ...payload,
            }
          : current
      );
    } catch (updateError) {
      console.error(
        "Failed to update question report:",
        updateError
      );

      setError(
        updateError?.message ||
          "Unable to update this report."
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#003B82] to-[#0067B8] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-100">
              <AlertTriangle size={17} />

              Question Bank Quality
            </div>

            <h1 className="text-2xl font-extrabold sm:text-3xl">
              Question Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Review questions reported by users and
              manage their report status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadReports(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>
      </section>

      {/* Error */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Status Summary */}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() =>
              setActiveTab(tab.key)
            }
            className={`rounded-2xl border p-4 text-left transition ${
              activeTab === tab.key
                ? "border-[#009FE3] bg-[#EAF6FD] shadow-sm dark:border-[#19B8F2] dark:bg-[#19B8F2]/10"
                : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E]"
            }`}
          >
            <p className="text-xs font-bold text-slate-500 dark:text-[#A8B4C5]">
              {tab.label}
            </p>

            <p className="mt-1 text-2xl font-black text-[#10233F] dark:text-white">
              {counts[tab.key]}
            </p>
          </button>
        ))}
      </section>

      {/* Reports */}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E]">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-[#243A55]">
          <div>
            <h2 className="font-extrabold text-[#10233F] dark:text-white">
              {
                STATUS_TABS.find(
                  (tab) =>
                    tab.key === activeTab
                )?.label
              }
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-[#A8B4C5]">
              {filteredReports.length} report
              {filteredReports.length === 1
                ? ""
                : "s"}{" "}
              found
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search reports..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-[#F7F9FC] pl-9 pr-3 text-xs font-semibold text-[#10233F] outline-none transition focus:border-[#009FE3] dark:border-[#29425F] dark:bg-[#12243B] dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-[#12243B]"
                />
              )
            )}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileQuestion
              size={34}
              className="mx-auto text-slate-300 dark:text-[#48617C]"
            />

            <h3 className="mt-3 font-extrabold text-[#10233F] dark:text-white">
              No reports found
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-[#A8B4C5]">
              There are no reports matching the
              current filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-wide text-slate-400 dark:border-[#243A55]">
                  <th className="px-6 py-3">
                    Question
                  </th>

                  <th className="px-4 py-3">
                    Reason
                  </th>

                  <th className="px-4 py-3">
                    Reported By
                  </th>

                  <th className="px-4 py-3">
                    Date
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map(
                  (report) => (
                    <tr
                      key={report.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-[#243A55] dark:hover:bg-[#12243B]/60"
                    >
                      <td className="max-w-[380px] px-6 py-4">
                        <p className="line-clamp-2 text-sm font-bold text-[#10233F] dark:text-white">
                          {getQuestionText(
                            report.question
                          )}
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          {report.test?.title ||
                            "Test unavailable"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-[#D8E1EC]">
                        {report.reason}
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-xs font-bold text-[#10233F] dark:text-white">
                          {report.reporter
                            ?.full_name ||
                            "User"}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {report.reporter
                            ?.email || "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500 dark:text-[#A8B4C5]">
                        {formatDate(
                          report.created_at
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          status={report.status}
                        />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openReport(report)
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-[#003B82] transition hover:border-[#009FE3]/40 hover:bg-[#EAF6FD] dark:border-[#29425F] dark:bg-[#12243B] dark:text-[#19B8F2] dark:hover:bg-[#19B8F2]/10"
                        >
                          <Eye size={14} />
                          Review
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Report Detail Modal */}

      {selectedReport && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !updatingId
            ) {
              closeReport();
            }
          }}
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#243A55] dark:bg-[#0D1B2E]">
            {/* Modal Header */}

            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-[#243A55]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#009FE3] dark:text-[#19B8F2]">
                  Report Review
                </p>

                <h2 className="mt-1 text-lg font-black text-[#10233F] dark:text-white">
                  {selectedReport.reason}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeReport}
                disabled={Boolean(
                  updatingId
                )}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-[#12243B] dark:hover:text-white"
                aria-label="Close"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Modal Body */}

            <div className="max-h-[72vh] overflow-y-auto px-5 py-5">
              {/* Reported Question */}

              <div className="rounded-2xl border border-slate-200 bg-[#F7F9FC] p-4 dark:border-[#243A55] dark:bg-[#0B1728]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#009FE3] dark:text-[#19B8F2]">
                    Reported Question
                  </p>

                  <StatusBadge
                    status={
                      selectedReport.status
                    }
                  />
                </div>

                <p className="mt-2 text-sm font-bold leading-6 text-[#10233F] dark:text-white">
                  {getQuestionText(
                    selectedReport.question
                  )}
                </p>
              </div>

              {/* Reporter + Test */}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-[#243A55] dark:bg-[#12243B]">
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                    Reported By
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#10233F] dark:text-white">
                    {selectedReport
                      .reporter
                      ?.full_name ||
                      "User"}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-[#A8B4C5]">
                    {selectedReport
                      .reporter?.email ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-[#243A55] dark:bg-[#12243B]">
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                    Test
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#10233F] dark:text-white">
                    {selectedReport.test
                      ?.title ||
                      "Test unavailable"}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-[#A8B4C5]">
                    Reported{" "}
                    {formatDate(
                      selectedReport.created_at
                    )}
                  </p>
                </div>
              </div>

              {/* User Description */}

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
                <p className="text-[9px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">
                  User Description
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900 dark:text-amber-100">
                  {selectedReport.description ||
                    "No additional description provided."}
                </p>
              </div>

              {/* Current Question */}

              {selectedReport.question && (
                <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-[#243A55]">
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                    Current Answer Options
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      selectedReport
                        .question.option_a,

                      selectedReport
                        .question.option_b,

                      selectedReport
                        .question.option_c,

                      selectedReport
                        .question.option_d,
                    ].map(
                      (
                        option,
                        index
                      ) => (
                        <div
                          key={index}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                            Number(
                              selectedReport
                                .question
                                .correct_answer
                            ) === index
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                              : "border-slate-100 bg-slate-50 text-slate-600 dark:border-[#243A55] dark:bg-[#12243B] dark:text-[#D8E1EC]"
                          }`}
                        >
                          <span className="mr-2 font-black">
                            {getOptionLabel(
                              index
                            )}
                          </span>

                          {option || "—"}
                        </div>
                      )
                    )}
                  </div>

                  <p className="mt-3 text-xs font-bold text-slate-500 dark:text-[#A8B4C5]">
                    Current correct answer:{" "}
                    <span className="font-black text-[#003B82] dark:text-[#19B8F2]">
                      {getOptionLabel(
                        selectedReport
                          .question
                          .correct_answer
                      )}
                    </span>
                  </p>
                </div>
              )}

              {/* Edit Question */}

              {selectedReport.question && (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#009FE3]/20 bg-[#EAF6FD] p-4 dark:border-[#19B8F2]/20 dark:bg-[#19B8F2]/10 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-[#003B82] dark:text-[#19B8F2]">
                      Question needs correction?
                    </p>

                    <p className="mt-1 text-[11px] font-medium leading-5 text-slate-600 dark:text-[#A8B4C5]">
                      Open the existing question editor
                      to correct the question, options,
                      answer, marks, or other details.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={editReportedQuestion}
                    disabled={Boolean(
                      updatingId
                    )}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#003B82] px-4 py-2.5 text-[10px] font-black text-white transition hover:bg-[#002F68] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#19B8F2] dark:text-[#07111F]"
                  >
                    <Pencil size={14} />
                    Edit Question
                  </button>
                </div>
              )}

              {/* Admin Note */}

              <div className="mt-4">
                <label
                  htmlFor="question-report-admin-note"
                  className="text-xs font-black text-[#10233F] dark:text-white"
                >
                  Admin Note
                </label>

                <textarea
                  id="question-report-admin-note"
                  value={adminNote}
                  onChange={(event) =>
                    setAdminNote(
                      event.target.value
                    )
                  }
                  rows={3}
                  maxLength={2000}
                  placeholder="Add your review note..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-[#10233F] outline-none focus:border-[#009FE3] dark:border-[#29425F] dark:bg-[#12243B] dark:text-white"
                />
              </div>
            </div>

            {/* Modal Footer */}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4 dark:border-[#243A55]">
              <button
                type="button"
                onClick={() =>
                  updateStatus(
                    "under_review"
                  )
                }
                disabled={
                  Boolean(updatingId) ||
                  selectedReport.status ===
                    "under_review"
                }
                className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-[10px] font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300"
              >
                {updatingId ===
                selectedReport.id
                  ? "Saving..."
                  : "Under Review"}
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateStatus("rejected")
                  }
                  disabled={Boolean(
                    updatingId
                  )}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[10px] font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  <XCircle size={14} />
                  Reject
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateStatus("resolved")
                  }
                  disabled={Boolean(
                    updatingId
                  )}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#003B82] px-4 py-2.5 text-[10px] font-black text-white transition hover:bg-[#002F68] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#19B8F2] dark:text-[#07111F]"
                >
                  <CheckCircle2 size={14} />
                  Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionReportsPage;