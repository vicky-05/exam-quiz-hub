import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  GraduationCap,
  HelpCircle,
  ClipboardList,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    totalExams: 0,
    totalQuestions: 0,
    totalTests: 0,
    totalAttempts: 0,
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      // --------------------------------------------------
      // COUNTS
      // --------------------------------------------------

      const [
        usersResult,
        pendingUsersResult,
        approvedUsersResult,
        examsResult,
        questionsResult,
        testsResult,
        attemptsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),

        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved"),

        supabase
          .from("exams")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("questions")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("tests")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("test_attempts")
          .select("id", { count: "exact", head: true }),
      ]);

      const countErrors = [
        usersResult.error,
        pendingUsersResult.error,
        approvedUsersResult.error,
        examsResult.error,
        questionsResult.error,
        testsResult.error,
        attemptsResult.error,
      ].filter(Boolean);

      if (countErrors.length > 0) {
        console.error("Dashboard count errors:", countErrors);
        throw countErrors[0];
      }

      setStats({
        totalUsers: usersResult.count || 0,
        pendingUsers: pendingUsersResult.count || 0,
        approvedUsers: approvedUsersResult.count || 0,
        totalExams: examsResult.count || 0,
        totalQuestions: questionsResult.count || 0,
        totalTests: testsResult.count || 0,
        totalAttempts: attemptsResult.count || 0,
      });

      // --------------------------------------------------
      // RECENT USERS
      // --------------------------------------------------

      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, email, status, role, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (usersError) {
        throw usersError;
      }

      setRecentUsers(users || []);

      // --------------------------------------------------
      // RECENT ATTEMPTS
      // --------------------------------------------------

      const { data: attempts, error: attemptsError } = await supabase
        .from("test_attempts")
        .select(
          `
            id,
            user_id,
            test_id,
            score,
            maximum_score,
            correct_answers,
            wrong_answers,
            unanswered_questions,
            submitted_at,
            started_at
          `
        )
        .order("started_at", { ascending: false })
        .limit(5);

      if (attemptsError) {
        throw attemptsError;
      }

      // Get user profiles for the recent attempts
      const userIds = [
        ...new Set(
          (attempts || [])
            .map((attempt) => attempt.user_id)
            .filter(Boolean)
        ),
      ];

      let attemptUsers = [];

      if (userIds.length > 0) {
        const { data: usersForAttempts, error: usersForAttemptsError } =
          await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

        if (usersForAttemptsError) {
          throw usersForAttemptsError;
        }

        attemptUsers = usersForAttempts || [];
      }

      // Get test information
      const testIds = [
        ...new Set(
          (attempts || [])
            .map((attempt) => attempt.test_id)
            .filter(Boolean)
        ),
      ];

      let testsForAttempts = [];

      if (testIds.length > 0) {
        const { data: testsData, error: testsError } = await supabase
          .from("tests")
          .select("id, title, set_number, test_type")
          .in("id", testIds);

        if (testsError) {
          throw testsError;
        }

        testsForAttempts = testsData || [];
      }

      const formattedAttempts = (attempts || []).map((attempt) => {
        const attemptUser = attemptUsers.find(
          (user) => user.id === attempt.user_id
        );

        const attemptTest = testsForAttempts.find(
          (test) => test.id === attempt.test_id
        );

        return {
          ...attempt,
          userName:
            attemptUser?.full_name ||
            attemptUser?.email ||
            "Unknown User",
          testTitle: attemptTest?.title || "Unknown Test",
          setNumber: attemptTest?.set_number,
          testType: attemptTest?.test_type,
        };
      });

      setRecentAttempts(formattedAttempts);
    } catch (err) {
      console.error("Admin dashboard loading failed:", err);

      setError(
        err?.message ||
          "Unable to load admin dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusBadge(status) {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
          <CheckCircle2 size={13} />
          Approved
        </span>
      );
    }

    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
          <Clock size={13} />
          Pending
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
          <XCircle size={13} />
          Rejected
        </span>
      );
    }

    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
        {status || "Unknown"}
      </span>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-[#003B82]",
    },
    {
      title: "Pending Users",
      value: stats.pendingUsers,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Approved Users",
      value: stats.approvedUsers,
      icon: UserCheck,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Exams",
      value: stats.totalExams,
      icon: GraduationCap,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Questions",
      value: stats.totalQuestions,
      icon: HelpCircle,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    {
      title: "Tests",
      value: stats.totalTests,
      icon: ClipboardList,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Attempts",
      value: stats.totalAttempts,
      icon: BarChart3,
      iconBg: "bg-pink-50",
      iconColor: "text-pink-600",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-white shadow-sm" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ */}
      {/* PAGE HEADER */}
      {/* ------------------------------------------------ */}

      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#003B82] to-[#0067B8] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 text-sm font-semibold text-blue-100">
              Admin Overview
            </div>

            <h1 className="text-2xl font-extrabold sm:text-3xl">
              Welcome back,{" "}
              {profile?.full_name || "Administrator"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Manage users, exams, questions, tests and
              monitor activity across Exam Quiz Hub.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 sm:self-auto"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* ERROR */}
      {/* ------------------------------------------------ */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* STAT CARDS */}
      {/* ------------------------------------------------ */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-[#10233F]">
            Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current statistics from your Exam Quiz Hub database.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {card.title}
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-[#10233F]">
                      {card.value.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
                  >
                    <Icon
                      size={21}
                      className={card.iconColor}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* RECENT USERS */}
      {/* ------------------------------------------------ */}

      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-extrabold text-[#10233F]">
              Recent Registrations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest users registered on the platform.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="hidden items-center gap-1 text-sm font-bold text-[#003B82] hover:text-[#009FE3] sm:flex"
          >
            View Users
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentUsers.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No users found.
            </div>
          ) : (
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Registered</th>
                </tr>
              </thead>

              <tbody>
                {recentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F5FF] text-sm font-bold text-[#003B82]">
                          {(user.full_name ||
                            user.email ||
                            "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="font-semibold text-[#10233F]">
                          {user.full_name || "No name"}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.email || "—"}
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* RECENT ATTEMPTS */}
      {/* ------------------------------------------------ */}

      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-extrabold text-[#10233F]">
              Recent Test Attempts
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest student test activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/attempts")}
            className="hidden items-center gap-1 text-sm font-bold text-[#003B82] hover:text-[#009FE3] sm:flex"
          >
            View Attempts
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentAttempts.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No test attempts found.
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Test</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Correct</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {recentAttempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#10233F]">
                        {attempt.userName}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#10233F]">
                        {attempt.testTitle}
                      </div>

                      {attempt.setNumber !== undefined &&
                        attempt.setNumber !== null && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            Set {attempt.setNumber}
                          </div>
                        )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-extrabold text-[#003B82]">
                        {attempt.score}
                      </span>

                      <span className="text-sm text-slate-500">
                        {" "}
                        / {attempt.maximum_score}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-green-600">
                        {attempt.correct_answers} correct
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {attempt.wrong_answers} wrong ·{" "}
                        {attempt.unanswered_questions} unanswered
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(
                        attempt.submitted_at ||
                          attempt.started_at
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;