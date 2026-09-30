import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers3,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  ClipboardList,
  BarChart3,
  Lightbulb,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  UserPlus,
  FileWarning,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      name: "Exams",
      path: "/admin/exams",
      icon: GraduationCap,
    },
    {
      name: "Tracks",
      path: "/admin/tracks",
      icon: Layers3,
    },
    {
      name: "Subjects",
      path: "/admin/subjects",
      icon: BookOpen,
    },
    {
      name: "Question Bank",
      path: "/admin/questions",
      icon: HelpCircle,
    },
    {
      name: "Question Reports",
      path: "/admin/question-reports",
      icon: AlertTriangle,
    },
    {
      name: "Tests / Sets",
      path: "/admin/tests",
      icon: ClipboardList,
    },
    {
      name: "Attempts & Results",
      path: "/admin/attempts",
      icon: BarChart3,
    },
    {
      name: "Motivation",
      path: "/admin/motivation",
      icon: Lightbulb,
    },
    {
      name: "Announcements",
      path: "/admin/announcements",
      icon: Megaphone,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);

      const [
        { data: pendingUsers, error: usersError },
        { data: pendingReports, error: reportsError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, created_at")
          .eq("status", "pending")
          .neq("role", "admin")
          .order("created_at", { ascending: false })
          .limit(5),

        supabase
          .from("question_reports")
          .select(
            "id, question_id, test_id, reason, description, created_at"
          )
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (usersError) {
        console.error("Error loading pending users:", usersError);
      }

      if (reportsError) {
        console.error("Error loading pending reports:", reportsError);
      }

      const userNotifications =
        (pendingUsers || []).map((item) => ({
          id: `user-${item.id}`,
          type: "user",
          title: "New User Approval",
          message:
            item.full_name?.trim() ||
            item.email ||
            "A new user is waiting for approval.",
          subMessage: item.email || "",
          createdAt: item.created_at,
          icon: UserPlus,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          path: "/admin/users",
        })) || [];

      const reportNotifications =
        (pendingReports || []).map((item) => ({
          id: `report-${item.id}`,
          type: "report",
          title: "New Question Report",
          message: item.reason || "A question has been reported.",
          subMessage: item.description || "",
          createdAt: item.created_at,
          icon: FileWarning,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          path: "/admin/question-reports",
        })) || [];

      const combined = [
        ...userNotifications,
        ...reportNotifications,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setNotifications(combined);
    } catch (error) {
      console.error("Notification loading error:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  // =========================================================
  // REALTIME NOTIFICATIONS
  // =========================================================

  useEffect(() => {
    loadNotifications();

    // -------------------------------------------------------
    // FALLBACK: Refresh every 30 seconds
    // -------------------------------------------------------

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    // -------------------------------------------------------
    // SUPABASE REALTIME
    // -------------------------------------------------------

    const channel = supabase
      .channel("admin-notifications")

      // =====================================================
      // NEW USER REGISTERED
      // =====================================================

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          console.log("New profile:", payload);

          if (
            payload.new?.status === "pending" &&
            payload.new?.role !== "admin"
          ) {
            loadNotifications();
          }
        }
      )

      // =====================================================
      // USER STATUS CHANGED
      // =====================================================

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          console.log("Profile updated:", payload);

          if (
            payload.old?.status === "pending" ||
            payload.new?.status === "pending"
          ) {
            loadNotifications();
          }
        }
      )

      // =====================================================
      // NEW QUESTION REPORT
      // =====================================================

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "question_reports",
        },
        (payload) => {
          console.log("New question report:", payload);

          if (payload.new?.status === "pending") {
            loadNotifications();
          }
        }
      )

      // =====================================================
      // QUESTION REPORT STATUS CHANGED
      // =====================================================

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "question_reports",
        },
        (payload) => {
          console.log("Question report updated:", payload);

          if (
            payload.old?.status === "pending" ||
            payload.new?.status === "pending"
          ) {
            loadNotifications();
          }
        }
      )

      .subscribe((status) => {
        console.log(
          "Admin notification realtime status:",
          status
        );
      });

    // -------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================================================
  // NOTIFICATION CLICK
  // =========================================================

  const handleNotificationClick = (notification) => {
    setNotificationOpen(false);
    setSidebarOpen(false);

    navigate(notification.path);
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // =========================================================
  // CLOSE SIDEBAR
  // =========================================================

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatNotificationTime = (date) => {
    if (!date) return "";

    const now = new Date();
    const created = new Date(date);

    const diff = Math.floor(
      (now.getTime() - created.getTime()) / 1000
    );

    if (diff < 60) {
      return "Just now";
    }

    if (diff < 3600) {
      return `${Math.floor(diff / 60)} min ago`;
    }

    if (diff < 86400) {
      return `${Math.floor(diff / 3600)} hr ago`;
    }

    return created.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed
          top-0
          left-0
          z-50
          h-screen
          w-72
          bg-[#001F4F]
          text-white
          transition-transform
          duration-300
          lg:translate-x-0
          ${sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
          }
        `}
      >
        {/* Logo */}

        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div>
            <h1 className="text-xl font-bold">
              Exam Quiz Hub
            </h1>

            <p className="mt-1 text-xs text-blue-200">
              Admin Panel
            </p>
          </div>

          <button
            onClick={closeSidebar}
            className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Menu */}

        <nav className="h-[calc(100vh-150px)] overflow-y-auto px-4 py-5">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-medium
                    transition
                    ${isActive
                      ? "bg-[#009FE3] text-white shadow-lg"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }
                    `
                  }
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Logout */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-blue-100 transition hover:bg-red-500/20 hover:text-white"
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <div className="lg:pl-72">
        {/* ===================================================
            TOP BAR
        ==================================================== */}

        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left */}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
              >
                <Menu size={24} />
              </button>

              <div>
                <h2 className="text-lg font-bold text-[#10233F] sm:text-xl">
                  Admin Panel
                </h2>

                <p className="hidden text-xs text-gray-500 sm:block">
                  Manage your examination platform
                </p>
              </div>
            </div>

            {/* Right */}

            <div className="flex items-center gap-3">
              {/* =================================================
                  NOTIFICATION BELL
              ================================================== */}

              <div className="relative">
                <button
                  onClick={() =>
                    setNotificationOpen(
                      !notificationOpen
                    )
                  }
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-[#003B82]"
                >
                  <Bell size={21} />

                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {notifications.length > 99
                        ? "99+"
                        : notifications.length}
                    </span>
                  )}
                </button>

                {/* =================================================
                    NOTIFICATION DROPDOWN
                ================================================== */}

                {notificationOpen && (
                  <>
                    {/* Desktop invisible click area */}

                    <div
                      className="fixed inset-0 z-40"
                      onClick={() =>
                        setNotificationOpen(false)
                      }
                    />

                    <div className="absolute right-0 top-14 z-50 w-[350px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:w-[390px]">
                      {/* Header */}

                      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <div>
                          <h3 className="font-bold text-[#10233F]">
                            Notifications
                          </h3>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Pending actions that need your attention
                          </p>
                        </div>

                        {notifications.length > 0 && (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                            {notifications.length} pending
                          </span>
                        )}
                      </div>

                      {/* Body */}

                      <div className="max-h-[420px] overflow-y-auto">
                        {notificationLoading &&
                          notifications.length === 0 ? (
                          <div className="px-5 py-10 text-center text-sm text-gray-500">
                            Loading notifications...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-5 py-10 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                              <Bell
                                size={22}
                                className="text-green-600"
                              />
                            </div>

                            <p className="mt-3 font-semibold text-gray-700">
                              All caught up!
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              No pending notifications.
                            </p>
                          </div>
                        ) : (
                          notifications.map(
                            (notification) => {
                              const Icon =
                                notification.icon;

                              return (
                                <button
                                  key={notification.id}
                                  onClick={() =>
                                    handleNotificationClick(
                                      notification
                                    )
                                  }
                                  className="group flex w-full gap-3 border-b border-gray-100 px-5 py-4 text-left transition hover:bg-gray-50"
                                >
                                  {/* Icon */}

                                  <div
                                    className={`
                                      flex
                                      h-10
                                      w-10
                                      flex-shrink-0
                                      items-center
                                      justify-center
                                      rounded-xl
                                      ${notification.iconBg}
                                    `}
                                  >
                                    <Icon
                                      size={18}
                                      className={
                                        notification.iconColor
                                      }
                                    />
                                  </div>

                                  {/* Content */}

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-semibold text-[#10233F]">
                                        {
                                          notification.title
                                        }
                                      </p>

                                      <ArrowRight
                                        size={15}
                                        className="mt-0.5 flex-shrink-0 text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#009FE3]"
                                      />
                                    </div>

                                    <p className="mt-1 truncate text-sm text-gray-700">
                                      {
                                        notification.message
                                      }
                                    </p>

                                    {notification.subMessage && (
                                      <p className="mt-0.5 truncate text-xs text-gray-500">
                                        {
                                          notification.subMessage
                                        }
                                      </p>
                                    )}

                                    <p className="mt-1.5 text-[11px] text-gray-400">
                                      {formatNotificationTime(
                                        notification.createdAt
                                      )}
                                    </p>
                                  </div>
                                </button>
                              );
                            }
                          )
                        )}
                      </div>

                      {/* Footer */}

                      {notifications.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50 p-3">
                          <button
                            onClick={() => {
                              setNotificationOpen(false);
                              navigate(
                                "/admin/question-reports"
                              );
                            }}
                            className="w-full rounded-xl py-2.5 text-sm font-semibold text-[#003B82] transition hover:bg-white"
                          >
                            View Question Reports
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* =================================================
                  ADMIN USER
              ================================================== */}

              <div className="hidden items-center gap-3 border-l border-gray-200 pl-4 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#003B82] text-sm font-bold text-white">
                  {(
                    user?.user_metadata?.full_name ||
                    user?.email ||
                    "A"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-[#10233F]">
                    {user?.user_metadata?.full_name ||
                      "Administrator"}
                  </p>

                  <p className="max-w-[180px] truncate text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}

        <main className="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;