import {
  BookOpen,
  ChevronDown,
  History,
  LayoutDashboard,
  LogIn,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
  X,
  GraduationCap,
  ClipboardCheck,
  House,
  BarChart3,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import logo from "../assets/exam-quiz-hub-logo.png";
import darkLogo from "../assets/exam-quiz-hub-logo-dark.png";
import { useAuth } from "../context/AuthContext";
import {
  getExams,
  getTracks,
  getSubjects,
  getTests,
} from "../services/examService";

function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [availableExams, setAvailableExams] = useState([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("exam-quiz-hub-theme") === "dark";
    } catch {
      return false;
    }
  });

  const [signingOut, setSigningOut] = useState(false);

  // Use the dedicated high-contrast logo in dark mode.
  const activeLogo = darkMode ? darkLogo : logo;

  const examRef = useRef(null);
  const accountRef = useRef(null);
  const searchInputRef = useRef(null);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Student";

  const firstName = displayName.split(" ")[0];
  const userInitial = firstName?.charAt(0)?.toUpperCase() || "S";

  /* =========================================================
     LOAD AVAILABLE EXAMS
     Supabase is the source of truth for the Exams dropdown.
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadAvailableExams() {
      try {
        const exams = (await getExams()) || [];

        if (!cancelled) {
          setAvailableExams(exams);
        }
      } catch (error) {
        console.error("Unable to load exams for header:", error);

        if (!cancelled) {
          setAvailableExams([]);
        }
      }
    }

    loadAvailableExams();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     THEME
  ========================================================= */

  useEffect(() => {
    let shouldUseDark = false;

    try {
      const savedTheme = localStorage.getItem("exam-quiz-hub-theme");

      if (savedTheme === "dark") {
        shouldUseDark = true;
      } else if (savedTheme === "light") {
        shouldUseDark = false;
      } else {
        shouldUseDark = window.matchMedia?.(
          "(prefers-color-scheme: dark)"
        ).matches ?? false;
      }
    } catch {
      shouldUseDark = false;
    }

    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  function toggleTheme() {
    const nextDark = !darkMode;

    setDarkMode(nextDark);

    try {
      localStorage.setItem(
        "exam-quiz-hub-theme",
        nextDark ? "dark" : "light"
      );
    } catch {
      // Ignore localStorage errors.
    }

    document.documentElement.classList.toggle("dark", nextDark);
  }

  /* =========================================================
     OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    function handleOutsideClick(event) {
      if (examRef.current && !examRef.current.contains(event.target)) {
        setExamOpen(false);
      }

      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* =========================================================
     CLOSE MENUS WHEN ROUTE CHANGES
  ========================================================= */

  useEffect(() => {
    setMobileOpen(false);
    setExamOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
    setSearchResults([]);
  }, [location.pathname]);

  /* =========================================================
     SEARCH FOCUS
  ========================================================= */

  useEffect(() => {
    if (!searchOpen) return;

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [searchOpen]);

  /* =========================================================
     BODY SCROLL LOCK
  ========================================================= */

  useEffect(() => {
    if (!mobileOpen && !searchOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, searchOpen]);

  /* =========================================================
     SEARCH
  ========================================================= */

  async function performSearch(query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);

      /*
       * IMPORTANT:
       * getTracks() requires an examId and getSubjects() requires a trackId.
       * The previous version called them without IDs, so global subject/set
       * search could return "No results found".
       *
       * Build the complete hierarchy:
       * Exams → Tracks → Subjects → Sets
       */
      const exams = (await getExams()) || [];

      const trackGroups = await Promise.all(
        exams.map(async (exam) => {
          try {
            return {
              examId: exam.id,
              tracks: (await getTracks(exam.id)) || [],
            };
          } catch (error) {
            console.error(
              `Failed to load tracks for exam ${exam.id}:`,
              error
            );
            return {
              examId: exam.id,
              tracks: [],
            };
          }
        })
      );

      const tracks = trackGroups.flatMap((group) => group.tracks);

      const subjectGroups = await Promise.all(
        tracks.map(async (track) => {
          try {
            return {
              trackId: track.id,
              subjects: (await getSubjects(track.id)) || [],
            };
          } catch (error) {
            console.error(
              `Failed to load subjects for track ${track.id}:`,
              error
            );
            return {
              trackId: track.id,
              subjects: [],
            };
          }
        })
      );

      const subjects = subjectGroups.flatMap(
        (group) => group.subjects
      );

      const results = [];
      const matchedSubjectIds = new Set();

      // EXAMS
      exams.forEach((exam) => {
        const text = `
          ${exam.name || ""}
          ${exam.full_name || ""}
          ${exam.description || ""}
        `.toLowerCase();

        if (text.includes(normalizedQuery)) {
          results.push({
            type: "exam",
            id: exam.id,
            title: exam.name,
            description: exam.full_name || exam.description || "Exam",
            path: `/exam/${exam.id}`,
          });
        }
      });

      // TRACKS
      tracks.forEach((track) => {
        const exam = exams.find((item) => item.id === track.exam_id);

        const text = `
          ${track.name || ""}
          ${track.description || ""}
          ${exam?.name || ""}
          ${exam?.full_name || ""}
        `.toLowerCase();

        if (text.includes(normalizedQuery)) {
          results.push({
            type: "track",
            id: track.id,
            title: track.name,
            description: `${exam?.name || "Exam"} preparation`,
            path: `/exam/${track.exam_id}/${track.id}`,
          });
        }
      });

      // SUBJECTS
      subjects.forEach((subject) => {
        const track = tracks.find((item) => item.id === subject.track_id);
        const exam = exams.find((item) => item.id === track?.exam_id);

        const text = `
          ${subject.name || ""}
          ${subject.description || ""}
          ${track?.name || ""}
          ${exam?.name || ""}
          ${exam?.full_name || ""}
        `.toLowerCase();

        if (text.includes(normalizedQuery)) {
          matchedSubjectIds.add(subject.id);

          results.push({
            type: "subject",
            id: subject.id,
            subjectId: subject.id,
            title: subject.name,
            description: [track?.name, exam?.name].filter(Boolean).join(" • "),
            path: `/exam/${exam?.id}/${track?.id}/subject/${subject.id}`,
          });
        }
      });

      // INDIVIDUAL PRACTICE / EXAM SETS
      // Uses the existing getTests(subjectId) service. No backend changes.
      const testGroups = await Promise.all(
        subjects.map(async (subject) => {
          try {
            return {
              subject,
              tests: (await getTests(subject.id)) || [],
            };
          } catch (error) {
            console.error(`Failed to load tests for subject ${subject.id}:`, error);
            return { subject, tests: [] };
          }
        })
      );

      testGroups.forEach(({ subject, tests }) => {
        const track = tracks.find((item) => item.id === subject.track_id);
        const exam = exams.find((item) => item.id === track?.exam_id);

        tests.forEach((test) => {
          const setLabel =
            test.set_number !== undefined && test.set_number !== null
              ? `Set ${test.set_number}`
              : "";

          const text = `
            ${test.title || ""}
            ${setLabel}
            ${subject.name || ""}
            ${subject.description || ""}
            ${track?.name || ""}
            ${exam?.name || ""}
            ${exam?.full_name || ""}
          `.toLowerCase();

          // If the subject itself matched, show its sets immediately
          // below the subject even when the individual set title does not
          // contain the search text. If the subject did not match, the set
          // must match normally.
          const setMatches =
            text.includes(normalizedQuery) ||
            matchedSubjectIds.has(subject.id);

          if (!setMatches) return;

          results.push({
            type: "set",
            id: test.id,
            subjectId: subject.id,
            title: test.title || `${subject.name || "Practice"} ${setLabel}`.trim(),
            description: [
              exam?.name,
              track?.name,
              subject.name,
              setLabel,
            ].filter(Boolean).join(" • "),
            path: `/exam/${exam?.id}/${track?.id}/quiz/${subject.id}/set-${test.set_number}`,
          });
        });
      });

      // Remove duplicates and prioritize individual sets/subjects.
      const priority = { subject: 0, set: 1, track: 2, exam: 3 };
      const seen = new Set();

      const uniqueResults = results
        .sort((a, b) => {
          const aSubject =
            a.type === "subject"
              ? a.id
              : a.type === "set"
                ? a.subjectId
                : null;

          const bSubject =
            b.type === "subject"
              ? b.id
              : b.type === "set"
                ? b.subjectId
                : null;

          // Keep a matched subject directly before its sets.
          if (aSubject && bSubject && aSubject === bSubject) {
            if (a.type === "subject" && b.type === "set") return -1;
            if (a.type === "set" && b.type === "subject") return 1;
          }

          const p = (priority[a.type] ?? 9) - (priority[b.type] ?? 9);
          if (p !== 0) return p;

          return String(a.title || "").localeCompare(String(b.title || ""));
        })
        .filter((result) => {
          const key = `${result.type}-${result.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      setSearchResults(uniqueResults.slice(0, 20));
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  useEffect(() => {
    if (!searchOpen) return;

    const query = searchValue.trim();

    if (!query) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchValue, searchOpen]);

  function openSearch() {
    setSearchOpen(true);
    setSearchValue("");
    setSearchResults([]);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchValue("");
    setSearchResults([]);
  }

  function openSearchResult(result) {
    setSearchOpen(false);
    setSearchValue("");
    setSearchResults([]);
    navigate(result.path);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const query = searchValue.trim();

    if (!query) return;

    if (searchResults.length > 0) {
      openSearchResult(searchResults[0]);
      return;
    }

    navigate(`/?q=${encodeURIComponent(query)}`);

    setSearchOpen(false);
    setSearchValue("");
    setSearchResults([]);
  }

  /* =========================================================
     ACCOUNT
  ========================================================= */

  async function handleSignOut() {
    if (signingOut) return;

    try {
      setSigningOut(true);
      setAccountOpen(false);
      setMobileOpen(false);

      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setSigningOut(false);
    }
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function isActive(path) {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  }

  const navItems = [
    {
      label: "Practice",
      to: "/",
      hash: "#practice",
      icon: ClipboardCheck,
    },
    {
      label: "Mock Tests",
      to: "/",
      hash: "#mock-tests",
      icon: BarChart3,
    },
  ];

  function navigateHash(hash) {
    setMobileOpen(false);

    if (location.pathname === "/") {
      window.history.replaceState(null, "", `/${hash}`);
      window.dispatchEvent(new Event("hashchange"));

      requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });

      return;
    }

    navigate(`/${hash}`);
  }

  return (
    <>
      {/* =====================================================
          MAIN HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 px-2 pt-2 sm:px-3 lg:px-4">
        <div className="mx-auto max-w-7xl overflow-visible rounded-[22px] border border-slate-200/80 bg-white/95 shadow-[0_12px_40px_rgba(0,31,79,0.10)] backdrop-blur-xl transition-all duration-300 dark:border-[#23466F] dark:bg-[#0D1B2E]/95 dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          <div className="flex h-[72px] items-center justify-between px-3 sm:px-5 lg:h-[78px] lg:px-6">
            {/* BRAND */}
            <Link
              to="/"
              className="group flex min-w-0 items-center"
              aria-label="Exam Quiz Hub Home"
            >
              <img
                src={activeLogo}
                alt="Exam Quiz Hub Logo"
                className="h-[58px] w-auto max-w-[205px] object-contain transition duration-300 group-hover:scale-[1.02] sm:h-[62px] lg:h-[66px] lg:max-w-[225px]"
              />
            </Link>

            {/* DESKTOP NAVIGATION */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              <Link
                to="/"
                className={`group relative flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-extrabold tracking-[-0.01em] transition-all duration-200 ${
                  isActive("/")
                    ? "text-[#003B82] dark:text-[#19B8F2]"
                    : "text-[#10233F] hover:bg-[#F2F7FD] hover:text-[#003B82] dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-[#19B8F2]"
                }`}
              >
                <House size={18} strokeWidth={2.3} />
                <span>Home</span>
                {isActive("/") ? (
                  <span className="absolute bottom-1.5 left-4 right-4 h-[3px] rounded-full bg-[#F6C400] shadow-[0_0_10px_rgba(246,196,0,0.35)]" />
                ) : null}
              </Link>

              {/* EXAMS */}
              <div ref={examRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setExamOpen((value) => !value);
                    setAccountOpen(false);
                  }}
                  className={`group flex items-center gap-1.5 rounded-xl px-4 py-3 text-[13px] font-extrabold tracking-[-0.01em] transition-all duration-200 ${
                    examOpen
                      ? "bg-[#F2F7FD] text-[#003B82] dark:bg-white/5 dark:text-[#19B8F2]"
                      : "text-[#10233F] hover:bg-[#F2F7FD] hover:text-[#003B82] dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-[#19B8F2]"
                  }`}
                  aria-expanded={examOpen}
                >
                  <GraduationCap size={18} strokeWidth={2.2} />
                  <span>Exams</span>
                  <ChevronDown
                    size={14}
                    strokeWidth={2.5}
                    className={`transition-transform duration-200 ${examOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {examOpen ? (
                  <div className="absolute left-1/2 top-[calc(100%+12px)] w-[330px] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-[0_24px_60px_rgba(0,31,79,0.16)] dark:border-[#24496F] dark:bg-[#0D1B2E] dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                    <div className="px-3 pb-2.5 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F6C400]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#003B82] dark:text-[#19B8F2]">
                          Choose your exam
                        </p>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        Explore available preparation tracks.
                      </p>
                    </div>

                    {availableExams.length > 0 ? (
                      availableExams.map((exam, index) => (
                        <Link
                          key={exam.id}
                          to={`/exam/${exam.id}`}
                          onClick={() => setExamOpen(false)}
                          className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-[#F2F7FD] dark:hover:bg-white/5"
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                              index % 2 === 0
                                ? "bg-[#EAF4FF] text-[#003B82] dark:bg-[#145AA8]/20 dark:text-[#19B8F2]"
                                : "bg-[#FFF6D9] text-[#D98F00] dark:bg-[#F6C400]/15 dark:text-[#FFD23F]"
                            }`}
                          >
                            {index % 2 === 0 ? (
                              <BookOpen size={19} />
                            ) : (
                              <GraduationCap size={19} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-[#10233F] dark:text-white">
                              {exam.name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {exam.full_name || "Competitive exam preparation"}
                            </p>
                          </div>

                          <ArrowIcon />
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                        No exams available.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigateHash(item.hash)}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-extrabold tracking-[-0.01em] text-[#10233F] transition-all duration-200 hover:bg-[#F2F7FD] hover:text-[#003B82] dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-[#19B8F2]"
                >
                  <item.icon size={18} strokeWidth={2.25} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* ACTIONS */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* SEARCH */}
              <button
                type="button"
                onClick={openSearch}
                aria-label="Search"
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#10233F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#009FE3]/35 hover:bg-[#F2F7FD] hover:text-[#003B82] sm:h-11 sm:w-11 dark:border-[#24496F] dark:bg-[#12243B] dark:text-slate-100 dark:hover:border-[#19B8F2]/40 dark:hover:bg-[#16345C] dark:hover:text-[#19B8F2]"
              >
                <Search size={19} strokeWidth={2.3} className="transition-transform duration-200 group-hover:scale-105" />
              </button>

              {/* THEME */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#10233F] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F6C400]/50 hover:bg-[#FFF9E8] hover:text-[#C88700] sm:h-11 sm:w-11 dark:border-[#24496F] dark:bg-[#12243B] dark:text-slate-100 dark:hover:border-[#FFD23F]/45 dark:hover:bg-[#16345C] dark:hover:text-[#FFD23F]"
              >
                {darkMode ? <Sun size={19} strokeWidth={2.2} /> : <Moon size={19} strokeWidth={2.2} />}
              </button>

              {/* ACCOUNT / LOGIN */}
              {user ? (
                <div ref={accountRef} className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen((value) => !value);
                      setExamOpen(false);
                    }}
                    className="group flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-3.5 text-white shadow-[0_8px_22px_rgba(0,96,180,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,96,180,0.30)] sm:h-11"
                    aria-expanded={accountOpen}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-[11px] font-black ring-1 ring-white/15">
                      {userInitial}
                    </span>
                    <span className="max-w-[82px] truncate text-xs font-black">{firstName}</span>
                    <ChevronDown size={13} className={`transition-transform ${accountOpen ? "rotate-180" : ""}`} />
                  </button>

                  {accountOpen ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(0,31,79,0.16)] dark:border-[#24496F] dark:bg-[#0D1B2E] dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                      <div className="rounded-xl bg-[#F2F7FD] p-3 dark:bg-[#12243B]">
                        <p className="truncate text-sm font-black text-[#10233F] dark:text-white">{displayName}</p>
                        <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                      <div className="mt-2">
                        <AccountLink to="/dashboard" icon={<LayoutDashboard size={17} />} label="Dashboard" onClick={() => setAccountOpen(false)} />
                        <AccountLink to="/dashboard/attempts" icon={<History size={17} />} label="Attempted History" onClick={() => setAccountOpen(false)} />
                        <AccountLink to="/dashboard/profile" icon={<UserRound size={17} />} label="Profile & Account" onClick={() => setAccountOpen(false)} />
                      </div>
                      <div className="my-2 border-t border-slate-100 dark:border-white/10" />
                      <button type="button" onClick={handleSignOut} disabled={signingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10">
                        <LogIn size={17} className="rotate-180" />
                        {signingOut ? "Signing out..." : "Sign Out"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-4 text-xs font-black text-white shadow-[0_8px_22px_rgba(0,96,180,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,96,180,0.30)] sm:flex sm:h-11"
                >
                  <LogIn size={16} strokeWidth={2.4} />
                  <span>Login</span>
                  <span className="hidden lg:block h-1 w-1 rounded-full bg-[#FFD23F]" />
                </Link>
              )}

              {/* MOBILE MENU */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#10233F] transition-all duration-200 hover:border-[#009FE3]/35 hover:bg-[#F2F7FD] hover:text-[#003B82] sm:h-11 sm:w-11 lg:hidden dark:border-[#24496F] dark:bg-[#12243B] dark:text-white dark:hover:border-[#19B8F2]/40 dark:hover:bg-[#16345C] dark:hover:text-[#19B8F2]"
              >
                <Menu size={21} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          SEARCH OVERLAY
      ====================================================== */}

      {searchOpen ? (
        <div
          className="fixed inset-0 z-[70] bg-[#10233F]/35 px-4 pt-20 backdrop-blur-sm sm:pt-28"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSearch();
            }
          }}
        >
          <div
            className="mx-auto w-full max-w-2xl overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(16,35,63,0.22)] dark:border-white/10 dark:bg-[#10233F]"
            role="dialog"
            aria-modal="true"
            aria-label="Search Exam Quiz Hub"
          >
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
                <Search
                  size={21}
                  className="shrink-0 text-[#003B82]"
                />

                <input
                  ref={searchInputRef}
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(event.target.value)
                  }
                  placeholder="Search exams, subjects, sets..."
                  className="min-w-0 flex-1 bg-transparent text-base font-bold text-[#10233F] outline-none placeholder:text-slate-400 dark:text-white"
                  autoComplete="off"
                  aria-label="Search"
                />

                <button
                  type="button"
                  onClick={closeSearch}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#10233F] dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5">

                {!searchValue.trim() ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C88700]">
                      Quick search
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        "RRB NTPC",
                        "TNPSC Group 4",
                        "History",
                        "Agriculture",
                        "Polity",
                        "Economics",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() =>
                            setSearchValue(suggestion)
                          }
                          className="rounded-full border border-slate-200 bg-[#FCFBF7] px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[#003B82]/20 hover:bg-[#EAF4FF] hover:text-[#003B82] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>

                    <p className="mt-5 text-xs text-slate-400">
                      Search exams, subjects, tracks and individual practice sets.
                    </p>
                  </>
                ) : searchLoading ? (
                  <div className="flex items-center gap-3 py-8 text-sm font-bold text-slate-500 dark:text-slate-300">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#003B82]/20 border-t-[#003B82]" />
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C88700]">
                        Search Results
                      </p>

                      <span className="text-[10px] font-bold text-slate-400">
                        {searchResults.length} found
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          type="button"
                          onClick={() =>
                            openSearchResult(result)
                          }
                          className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-[#EAF4FF] dark:hover:bg-white/5"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF4FF] text-[#003B82] dark:bg-[#145AA8]/20">
                            {result.type === "set" ? (
                              <ClipboardCheck size={18} />
                            ) : result.type === "subject" ? (
                              <BookOpen size={18} />
                            ) : (
                              <GraduationCap size={18} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-[#10233F] dark:text-white">
                              {result.title}
                            </p>

                            <p className="mt-0.5 truncate text-[11px] text-slate-400">
                              <span className="font-black uppercase tracking-wide text-[#003B82]/70 dark:text-[#19B8F2]/70">
                                {result.type === "set" ? "Set" : result.type}
                              </span>
                              <span className="mx-1">•</span>
                              {result.description}
                            </p>
                          </div>

                          <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#003B82]">
                            →
                          </span>
                        </button>
                      ))}
                    </div>

                    <p className="mt-4 text-xs text-slate-400">
                      Press Enter to open the first result.
                    </p>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5">
                      <Search size={21} />
                    </div>

                    <p className="mt-3 text-sm font-black text-[#10233F] dark:text-white">
                      No results found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try an exam, subject, topic or set name.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* =====================================================
          MOBILE DRAWER
      ====================================================== */}

      {mobileOpen ? (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-[#10233F]/35 backdrop-blur-sm"
            aria-label="Close menu"
          />

          <aside className="absolute right-0 top-0 flex h-full w-[min(88vw,390px)] flex-col bg-white shadow-[-20px_0_50px_rgba(16,35,63,0.15)] dark:bg-[#0B1728]">

            <div className="flex h-[74px] items-center justify-between border-b border-slate-100 px-5 dark:border-white/10">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="h-11 w-12 overflow-hidden">
                  <img
                    src={activeLogo}
                    alt="Exam Quiz Hub Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="text-sm font-black text-[#10233F] dark:text-white">
                  Exam Quiz{" "}
                  <span className="text-[#003B82]">
                    Hub
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">

              {user ? (
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#EAF4FF] p-4 dark:bg-white/5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#003B82] text-base font-black text-white">
                    {userInitial}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#10233F] dark:text-white">
                      {displayName}
                    </p>

                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>
                </div>
              ) : null}

              <p className="px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#C88700]">
                Navigation
              </p>

              <div className="mt-2 space-y-1">

                <MobileLink
                  to="/"
                  icon={<BookOpen size={18} />}
                  label="Home"
                  active={isActive("/")}
                  onClick={() => setMobileOpen(false)}
                />

                <button
                  type="button"
                  onClick={() =>
                    setExamOpen((value) => !value)
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black text-[#10233F] transition hover:bg-[#EAF4FF] dark:text-white dark:hover:bg-white/5"
                >
                  <GraduationCap
                    size={18}
                    className="text-[#003B82]"
                  />

                  <span className="flex-1">
                    Exams
                  </span>

                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      examOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {examOpen ? (
                  <div className="ml-10 space-y-1 border-l border-slate-200 pl-3 dark:border-white/10">
                    {availableExams.length > 0 ? (
                      availableExams.map((exam) => (
                        <Link
                          key={exam.id}
                          to={`/exam/${exam.id}`}
                          onClick={() => setMobileOpen(false)}
                          className="block rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-[#EAF4FF] hover:text-[#003B82] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-[#19B8F2]"
                        >
                          {exam.name}
                        </Link>
                      ))
                    ) : (
                      <p className="px-3 py-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                        No exams available.
                      </p>
                    )}
                  </div>
                ) : null}

                {navItems.slice(1).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => navigateHash(item.hash)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black text-[#10233F] transition hover:bg-[#EAF4FF] hover:text-[#003B82] dark:text-white dark:hover:bg-white/5"
                  >
                    {item.icon ? (
                      <item.icon
                        size={18}
                        className="text-[#003B82]"
                      />
                    ) : null}

                    {item.label}
                  </button>
                ))}
              </div>

              <p className="mt-7 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#C88700]">
                Account
              </p>

              <div className="mt-2 space-y-1">

                {user ? (
                  <>
                    <MobileLink
                      to="/dashboard"
                      icon={<LayoutDashboard size={18} />}
                      label="Dashboard"
                      onClick={() => setMobileOpen(false)}
                    />

                    <MobileLink
                      to="/dashboard/attempts"
                      icon={<History size={18} />}
                      label="Attempted History"
                      onClick={() => setMobileOpen(false)}
                    />

                    <MobileLink
                      to="/dashboard/profile"
                      icon={<UserRound size={18} />}
                      label="Profile & Account"
                      onClick={() => setMobileOpen(false)}
                    />
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#003B82] px-4 py-3.5 text-sm font-black text-white shadow-sm"
                  >
                    <LogIn size={17} />
                    Login
                  </Link>
                )}

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black text-[#10233F] transition hover:bg-[#FFF9E8] hover:text-[#C88700] dark:text-white dark:hover:bg-white/5"
                >
                  {darkMode ? (
                    <Sun size={18} />
                  ) : (
                    <Moon size={18} />
                  )}

                  {darkMode
                    ? "Light Mode"
                    : "Dark Mode"}
                </button>

                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <LogIn
                      size={18}
                      className="rotate-180"
                    />

                    {signingOut
                      ? "Signing out..."
                      : "Sign Out"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-[#FCFBF7] p-5 dark:border-white/10 dark:bg-[#10233F]">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Prepare · Practice · Succeed
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function ArrowIcon() {
  return (
    <span className="ml-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#003B82]">
      <ArrowRightSmall />
    </span>
  );
}

function ArrowRightSmall() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8H13M9 4L13 8L9 12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccountLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black text-slate-600 transition hover:bg-[#EAF4FF] hover:text-[#003B82] dark:text-slate-300 dark:hover:bg-white/5"
    >
      <span className="text-[#003B82]">
        {icon}
      </span>

      {label}
    </Link>
  );
}

function MobileLink({
  to,
  icon,
  label,
  active = false,
  onClick,
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black transition ${
        active
          ? "bg-[#EAF4FF] text-[#003B82] dark:bg-white/5"
          : "text-[#10233F] hover:bg-[#EAF4FF] hover:text-[#003B82] dark:text-white dark:hover:bg-white/5"
      }`}
    >
      <span
        className={
          active
            ? "text-[#003B82]"
            : "text-slate-400"
        }
      >
        {icon}
      </span>

      {label}
    </Link>
  );
}

export default Header;
