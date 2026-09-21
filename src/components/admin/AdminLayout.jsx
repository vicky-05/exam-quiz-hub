import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers3,
  BookOpen,
  HelpCircle,
  ClipboardList,
  BarChart3,
  Lightbulb,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      label: "Exams",
      path: "/admin/exams",
      icon: GraduationCap,
    },
    {
      label: "Tracks",
      path: "/admin/tracks",
      icon: Layers3,
    },
    {
      label: "Subjects",
      path: "/admin/subjects",
      icon: BookOpen,
    },
    {
      label: "Question Bank",
      path: "/admin/questions",
      icon: HelpCircle,
    },
    {
      label: "Tests / Sets",
      path: "/admin/tests",
      icon: ClipboardList,
    },
    {
      label: "Attempts & Results",
      path: "/admin/attempts",
      icon: BarChart3,
    },
    {
      label: "Motivation",
      path: "/admin/motivation",
      icon: Lightbulb,
    },
    {
      label: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Admin sign out failed:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F]">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div>
          <div className="text-lg font-extrabold text-[#003B82]">
            Exam Quiz Hub
          </div>

          <div className="text-xs font-medium text-slate-500">
            Admin Panel
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-[#003B82] shadow-sm"
          aria-label="Open admin menu"
        >
          <Menu size={21} />
        </button>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          aria-label="Close admin menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72 flex-col
          border-r border-slate-200 bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <div className="text-xl font-extrabold tracking-tight text-[#003B82]">
              Exam Quiz Hub
            </div>

            <div className="mt-0.5 text-xs font-semibold text-[#009FE3]">
              ADMIN PANEL
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close admin menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Admin Info */}
        <div className="mx-4 mt-4 rounded-2xl bg-[#F7F9FC] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Signed in as
          </div>

          <div className="mt-1 truncate text-sm font-bold text-[#10233F]">
            {profile?.full_name || "Administrator"}
          </div>

          <div className="mt-1 truncate text-xs text-slate-500">
            {profile?.email || ""}
          </div>

          <div className="mt-3 inline-flex items-center rounded-full bg-[#E8F5FF] px-2.5 py-1 text-xs font-bold text-[#003B82]">
            Administrator
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Management
          </div>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3 rounded-xl px-3.5 py-3
                    text-sm font-semibold transition
                    ${
                      isActive
                        ? "bg-[#003B82] text-white shadow-sm"
                        : "text-slate-600 hover:bg-[#F7F9FC] hover:text-[#003B82]"
                    }
                    `
                  }
                >
                  <Icon size={19} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Sign Out */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="lg:pl-72">
        {/* Desktop Top Bar */}
        <header className="hidden h-20 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
          <div>
            <div className="text-lg font-bold text-[#10233F]">
              Admin Panel
            </div>

            <div className="text-xs text-slate-500">
              Manage Exam Quiz Hub
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold text-[#10233F]">
                {profile?.full_name || "Administrator"}
              </div>

              <div className="text-xs text-slate-500">
                Administrator
              </div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#003B82] text-sm font-bold text-white">
              {(profile?.full_name || "A")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;