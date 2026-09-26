import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Monitor,
  Smartphone,
  Tablet,
  LogOut,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";

import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

import logo from "../assets/exam-quiz-hub-logo.png";
import darkLogo from "../assets/exam-quiz-hub-logo-dark.png";
import studyScene from "../assets/login-study-scene.png";
import rightBooks from "../assets/login-right-books.png";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    registerApplicationSession,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [deviceLimitOpen, setDeviceLimitOpen] =
    useState(false);
  const [activeDevices, setActiveDevices] =
    useState([]);
  const [deviceLogoutId, setDeviceLogoutId] =
    useState("");
  const [deviceLimitError, setDeviceLimitError] =
    useState("");

  /* =========================================================
     LOGIN
  ========================================================== */

  async function handleLogin(event) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      /* =====================================================
         1. LOGIN WITH SUPABASE AUTH
      ====================================================== */

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data?.user) {
        throw new Error(
          "Unable to sign in. Please try again."
        );
      }

      /* =====================================================
         2. LOAD PROFILE
      ====================================================== */

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("status, role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error(
          "Profile loading failed:",
          profileError
        );

        await supabase.auth.signOut();

        throw new Error(
          "Your account profile could not be loaded. Please try again."
        );
      }

      /* =====================================================
         3. PENDING / REJECTED
      ====================================================== */

      if (
        profile.status === "pending" ||
        profile.status === "rejected"
      ) {
        navigate("/access-pending", {
          replace: true,
        });

        return;
      }

      /* =====================================================
         4. APPROVED USER
      ====================================================== */

      if (profile.status === "approved") {
        /*
         * Register this browser/device as an
         * application session.
         *
         * The database enforces the maximum
         * of 2 active sessions.
         */

        try {
          await registerApplicationSession(
            data.user
          );
        } catch (sessionError) {
          console.error(
            "Application session registration failed:",
            sessionError
          );

          /*
           * Keep Supabase Auth alive for DEVICE_LIMIT_REACHED.
           * The modal needs the authenticated session so the user
           * can revoke one existing device and then claim the freed slot.
           */
          if (
            String(
              sessionError?.message || ""
            ).includes(
              "DEVICE_LIMIT_REACHED"
            )
          ) {
            setError("");
            setActiveDevices(
              Array.isArray(sessionError?.activeDevices)
                ? sessionError.activeDevices
                : []
            );
            setDeviceLimitError("");
            setDeviceLimitOpen(true);
            return;
          }

          // Sign out for all other application-session errors.
          await supabase.auth.signOut();
          throw sessionError;
        }

        /*
         * If the user originally tried to open
         * a protected page, return them there.
         */

        const from = location.state?.from;

        if (from) {
          navigate(from, {
            replace: true,
          });
        } else {
          navigate("/dashboard", {
            replace: true,
          });
        }

        return;
      }

      /* =====================================================
         5. INVALID STATUS
      ====================================================== */

      await supabase.auth.signOut();

      throw new Error(
        "Your account has an invalid approval status. Please contact the administrator."
      );
    } catch (err) {
      console.error(
        "Login failed:",
        err
      );

      /* =====================================================
         DEVICE LIMIT ERROR
      ====================================================== */

      if (
        String(err?.message || "").includes(
          "DEVICE_LIMIT_REACHED"
        )
      ) {
        setError("");

        setActiveDevices(
          Array.isArray(err?.activeDevices)
            ? err.activeDevices
            : []
        );

        setDeviceLimitError("");
        setDeviceLimitOpen(true);

        return;
      }

      setError(
        err?.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function getDeviceIcon(deviceType) {
    if (deviceType === "mobile") {
      return <Smartphone size={19} />;
    }

    if (deviceType === "tablet") {
      return <Tablet size={19} />;
    }

    return <Monitor size={19} />;
  }

  function formatLastActive(value) {
    if (!value) return "—";

    const minutes = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(value).getTime()) /
          60000
      )
    );

    if (minutes < 1) return "Just now";

    if (minutes < 60) {
      return `${minutes} minute${
        minutes === 1 ? "" : "s"
      } ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${
        hours === 1 ? "" : "s"
      } ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  async function handleLimitDeviceLogout(device) {
    if (deviceLogoutId) return;

    setDeviceLogoutId(device.id);
    setDeviceLimitError("");

    try {
      const { data, error: revokeError } =
        await supabase.rpc("revoke_user_session", {
          p_session_row_id: device.id,
        });

      if (revokeError) throw revokeError;

      if (data === false) {
        throw new Error(
          "Unable to sign out this device."
        );
      }

      setActiveDevices((current) =>
        current.filter(
          (item) => item.id !== device.id
        )
      );

      const {
        data: {
          session: currentSession,
        },
      } = await supabase.auth.getSession();

      if (!currentSession?.user) {
        throw new Error(
          "Your login session expired. Please sign in again."
        );
      }

      await registerApplicationSession(
        currentSession.user
      );

      setDeviceLimitOpen(false);
      setDeviceLimitError("");

      const from = location.state?.from;

      navigate(from || "/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Device logout from login limit failed:",
        error
      );

      setDeviceLimitError(
        error?.message ||
          "Unable to sign out this device. Please try again."
      );
    } finally {
      setDeviceLogoutId("");
    }
  }

  /* =========================================================
     LOGIN BENEFITS
  ========================================================== */

  const benefits = [
    {
      icon: Target,
      title: "Practice Anytime",
      text: "Build confidence with focused exam practice.",
    },
    {
      icon: BarChart3,
      title: "Track Your Progress",
      text: "See your performance and improve consistently.",
    },
    {
      icon: BookOpen,
      title: "Stay Exam Ready",
      text: "Prepare with structured tests and mock exams.",
    },
    {
      icon: Trophy,
      title: "Achieve Your Goals",
      text: "Turn regular practice into better results.",
    },
  ];

  return (
    <>
      {deviceLimitOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001F4F]/60 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="device-limit-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-[26px] border border-[#E2E8F0] bg-white shadow-[0_25px_80px_rgba(16,35,63,0.22)] dark:border-[#243A55] dark:bg-[#0D1B2E]">
            <div className="border-b border-[#E2E8F0] bg-gradient-to-br from-[#FFF8E6] to-white px-6 py-6 dark:border-[#243A55] dark:from-[#1C2531] dark:to-[#0D1B2E]">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFD23F]/20 text-[#B77900] dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]">
                  <ShieldCheck size={23} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="device-limit-title"
                    className="text-xl font-black text-[#10233F] dark:text-white"
                  >
                    Maximum Login Devices Reached
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#A8B4C5]">
                    Your account is already signed in on
                    2 devices. Sign out from one of the
                    devices below to continue on this device.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {deviceLimitError ? (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                >
                  {deviceLimitError}
                </div>
              ) : null}

              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F0A000] dark:text-[#FFD23F]">
                Active Devices
              </p>

              <div className="mt-3 space-y-3">
                {activeDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#243A55] dark:bg-[#07111F]"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#009FE3]/10 text-[#009FE3] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                      {getDeviceIcon(device.device_type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#10233F] dark:text-white">
                        {device.device_name ||
                          device.browser ||
                          "Unknown device"}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-[#A8B4C5]">
                        {device.device_type
                          ? device.device_type
                              .charAt(0)
                              .toUpperCase() +
                            device.device_type.slice(1)
                          : "Device"}
                        {device.browser
                          ? ` • ${device.browser}`
                          : ""}
                        {device.operating_system
                          ? ` • ${device.operating_system}`
                          : ""}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold text-slate-400 dark:text-[#8190A5]">
                        Last active:{" "}
                        {formatLastActive(
                          device.last_active_at
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleLimitDeviceLogout(device)
                      }
                      disabled={Boolean(deviceLogoutId)}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-[11px] font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-[#0D1B2E] dark:hover:bg-red-950/30"
                    >
                      <LogOut size={14} />
                      {deviceLogoutId === device.id
                        ? "Signing out..."
                        : "Logout"}
                    </button>
                  </div>
                ))}
              </div>

              {activeDevices.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-5 text-center text-xs font-semibold text-slate-500 dark:border-[#334A66] dark:bg-[#07111F] dark:text-[#A8B4C5]">
                  No active devices are available.
                  Please try signing in again.
                </div>
              ) : null}

              <p className="mt-5 text-center text-[10px] font-semibold leading-5 text-slate-400 dark:text-[#8190A5]">
                After you log out one device, this
                device will continue the login automatically.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">

        {/* =====================================================
            LEFT HERO
        ====================================================== */}

        <section className="relative hidden min-h-screen overflow-hidden bg-[#001F4F] lg:flex lg:flex-col">

          <img
            src={studyScene}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-0 h-full w-[58%] object-cover object-center opacity-75"
          />

          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#001F4F] via-[#001F4F]/95 via-[48%] to-[#001F4F]/25" />

          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#001F4F] via-transparent to-[#001F4F]/20" />

          <div className="relative z-20 flex min-h-screen flex-col px-10 py-6 xl:px-12">

            <Link
              to="/"
              className="w-fit transition hover:opacity-90"
            >
              <img
                src={darkLogo}
                alt="Exam Quiz Hub"
                className="h-14 w-auto object-contain"
              />
            </Link>

            <div className="my-auto max-w-[570px] pb-12 pt-8">

              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD23F]">
                <span className="h-1 w-8 rounded-full bg-[#FFD23F]" />

                Welcome Back
              </div>

              <h1 className="mt-5 text-[50px] font-black leading-[0.98] tracking-[-0.05em] text-white xl:text-[60px]">
                Continue
                <br />
                Your{" "}
                <span className="bg-gradient-to-r from-[#19B8F2] to-[#66D5FF] bg-clip-text text-transparent">
                  Journey
                </span>
              </h1>

              <p className="mt-6 max-w-[510px] text-sm leading-6 text-white/70 xl:text-base xl:leading-7">
                Sign in to access your practice tests,
                mock exams, track your progress and
                stay exam ready.
              </p>

              <div className="mt-8 grid max-w-[530px] gap-3">

                {benefits.map(
                  (
                    {
                      icon: Icon,
                      title,
                      text,
                    },
                    index
                  ) => (
                    <div
                      key={title}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#063A72]/55 px-4 py-3 backdrop-blur-[2px]"
                    >
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          index === 3
                            ? "bg-[#F6C400]/20 text-[#FFD23F]"
                            : "bg-[#009FE3]/20 text-[#19B8F2]"
                        }`}
                      >
                        <Icon size={19} />
                      </div>

                      <div>
                        <p className="text-xs font-black text-white">
                          {title}
                        </p>

                        <p className="mt-0.5 text-[10px] leading-4 text-white/50">
                          {text}
                        </p>
                      </div>
                    </div>
                  )
                )}

              </div>

              <div className="mt-7 flex items-center gap-2 text-[10px] font-bold text-white/55">
                <CheckCircle2
                  size={14}
                  className="text-[#FFD23F]"
                />

                Better Exams · Brighter Future
              </div>

            </div>

            <p className="text-[10px] font-medium text-white/35">
              © 2026 Exam Quiz Hub · Learn · Practice · Achieve
            </p>

          </div>
        </section>

        {/* =====================================================
            RIGHT LOGIN
        ====================================================== */}

        <section className="relative flex min-h-screen items-start justify-center overflow-hidden bg-[#F7F9FC] px-5 py-5 sm:px-8 lg:py-4 dark:bg-[#07111F]">

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_18%,rgba(0,159,227,0.10),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(246,196,0,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_100%_18%,rgba(25,184,242,0.08),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(255,210,63,0.06),transparent_30%)]" />

          <img
            src={rightBooks}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 z-0 hidden h-[46%] w-auto object-contain object-bottom opacity-90 xl:block"
          />

          <div className="relative z-10 w-full max-w-[480px]">

            {/* Mobile branding */}

            <div className="mb-4 flex items-center justify-between lg:hidden">

              <Link to="/">
                <img
                  src={logo}
                  alt="Exam Quiz Hub"
                  className="h-11 w-auto dark:hidden"
                />

                <img
                  src={darkLogo}
                  alt="Exam Quiz Hub"
                  className="hidden h-11 w-auto dark:block"
                />
              </Link>

              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#003B82] dark:text-[#19B8F2]"
              >
                <ArrowLeft size={14} />
                Home
              </Link>

            </div>

            {/* Desktop back */}

            <div className="mb-3 hidden justify-end lg:flex">

              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#003B82] dark:text-[#A8B4C5] dark:hover:text-[#19B8F2]"
              >
                <ArrowLeft size={14} />
                Back to Home
              </Link>

            </div>

            {/* LOGIN CARD */}

            <div className="rounded-[25px] border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_55px_rgba(16,35,63,0.08)] sm:p-8 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]">

              {/* Header */}

              <div className="text-center">

                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF6FF] text-[#009FE3] dark:bg-[#123554] dark:text-[#19B8F2]">
                  <LockKeyhole size={22} />
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#145AA8] dark:text-[#19B8F2]">
                  Welcome Back
                </p>

                <h2 className="mt-2 text-[29px] font-black tracking-[-0.04em] text-[#10233F] dark:text-white">
                  Sign in to your account
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-[#A8B4C5]">
                  Continue your preparation and keep
                  your progress moving forward.
                </p>

              </div>

              {/* ERROR */}

              {error && (
                <div
                  role="alert"
                  className={`mt-5 rounded-xl px-4 py-3 text-xs font-semibold leading-5 ${
                    error.includes(
                      "Maximum Login Devices Reached"
                    )
                      ? "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                      : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                  }`}
                >
                  {error}
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={handleLogin}
                className="mt-6 space-y-4"
              >

                {/* Email */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-black text-[#10233F] dark:text-white"
                  >
                    Email Address
                  </label>

                  <div className="relative">

                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3.5 pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white dark:placeholder:text-[#718096] dark:focus:border-[#19B8F2] dark:focus:ring-[#19B8F2]/10"
                    />

                  </div>
                </div>

                {/* Password */}

                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-black text-[#10233F] dark:text-white"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <LockKeyhole
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3.5 pl-11 pr-12 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white dark:placeholder:text-[#718096] dark:focus:border-[#19B8F2] dark:focus:ring-[#19B8F2]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#003B82] dark:hover:bg-[#12243B] dark:hover:text-[#19B8F2]"
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>
                </div>

                {/* Remember / Forgot */}

                <div className="flex items-center justify-between gap-4 text-xs">

                  <label className="inline-flex items-center gap-2 font-semibold text-slate-600 dark:text-[#A8B4C5]">

                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-[#009FE3]"
                    />

                    Remember me

                  </label>

                  <Link
                    to="/forgot-password"
                    className="font-black text-[#0068C9] transition hover:text-[#009FE3] dark:text-[#19B8F2]"
                  >
                    Forgot password?
                  </Link>

                </div>

                {/* Sign In */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,96,180,0.20)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,96,180,0.28)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In

                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}

                </button>

              </form>

              {/* SECURITY / REGISTER */}

              <div className="mt-6 border-t border-[#E2E8F0] pt-5 dark:border-[#243A55]">

                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 dark:text-[#8190A5]">

                  <ShieldCheck
                    size={14}
                    className="text-[#009FE3] dark:text-[#19B8F2]"
                  />

                  Your account information is securely protected

                </div>

                <p className="mt-4 text-center text-xs font-medium text-slate-500 dark:text-[#A8B4C5]">
                  Don&apos;t have an account?
                </p>

                <Link
                  to="/register"
                  className="mt-1 block text-center text-sm font-black text-[#003B82] transition hover:text-[#009FE3] dark:text-[#19B8F2] dark:hover:text-[#66D5FF]"
                >
                  Create an account
                </Link>

              </div>

            </div>

            <p className="mt-4 text-center text-[10px] font-medium text-slate-400 dark:text-[#64748B] lg:hidden">
              © 2026 Exam Quiz Hub · Learn · Practice · Achieve
            </p>

          </div>
        </section>

      </div>
    </div>
    </>
  );
}

export default LoginPage;