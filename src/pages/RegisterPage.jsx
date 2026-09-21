import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";
import { supabase } from "../services/supabase";
import logo from "../assets/exam-quiz-hub-logo.png";
import darkLogo from "../assets/exam-quiz-hub-logo-dark.png";
import studyScene from "../assets/login-study-scene.png";
import rightBooks from "../assets/login-right-books.png";

function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.user && data?.session) {
        navigate("/", { replace: true });
        return;
      }

      setSuccess(
        "Account created. Please check your email to confirm your account before signing in."
      );
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  const benefits = [
    {
      icon: Target,
      title: "Practice Anytime",
      text: "Build confidence with focused exam practice.",
    },
    {
      icon: BarChart3,
      title: "Track Your Progress",
      text: "Keep your performance connected to your profile.",
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
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        {/* =========================================================
            LEFT HERO
        ========================================================== */}
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
            <Link to="/" className="w-fit transition hover:opacity-90">
              <img
                src={darkLogo}
                alt="Exam Quiz Hub"
                className="h-14 w-auto object-contain"
              />
            </Link>

            <div className="my-auto max-w-[570px] pb-12 pt-8">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD23F]">
                <span className="h-1 w-8 rounded-full bg-[#FFD23F]" />
                Start Your Journey
              </div>

              <h1 className="mt-5 text-[50px] font-black leading-[0.98] tracking-[-0.05em] text-white xl:text-[60px]">
                Build Your
                <br />
                <span className="bg-gradient-to-r from-[#19B8F2] to-[#66D5FF] bg-clip-text text-transparent">
                  Success
                </span>
              </h1>

              <p className="mt-6 max-w-[510px] text-sm leading-6 text-white/70 xl:text-base xl:leading-7">
                Create your account and bring your practice, results and exam
                preparation together in one place.
              </p>

              <div className="mt-8 grid max-w-[530px] gap-3">
                {benefits.map(({ icon: Icon, title, text }, index) => (
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
                      <p className="text-xs font-black text-white">{title}</p>
                      <p className="mt-0.5 text-[10px] leading-4 text-white/50">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex items-center gap-2 text-[10px] font-bold text-white/55">
                <CheckCircle2 size={14} className="text-[#FFD23F]" />
                Better Exams · Brighter Future
              </div>
            </div>

            <p className="text-[10px] font-medium text-white/35">
              © 2026 Exam Quiz Hub · Learn · Practice · Achieve
            </p>
          </div>
        </section>

        {/* =========================================================
            RIGHT REGISTER SIDE
        ========================================================== */}
        <section className="relative flex min-h-screen items-start justify-center overflow-hidden bg-[#F7F9FC] px-5 py-5 sm:px-8 lg:py-4 dark:bg-[#07111F]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_18%,rgba(0,159,227,0.10),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(246,196,0,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_100%_18%,rgba(25,184,242,0.08),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(255,210,63,0.06),transparent_30%)]" />

          <img
            src={rightBooks}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 z-0 hidden h-[43%] w-auto object-contain object-bottom opacity-90 xl:block"
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

            <div className="mb-3 hidden justify-end lg:flex">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#003B82] dark:text-[#A8B4C5] dark:hover:text-[#19B8F2]"
              >
                <ArrowLeft size={14} />
                Back to Home
              </Link>
            </div>

            <div className="rounded-[25px] border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_55px_rgba(16,35,63,0.08)] sm:p-8 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
              <div className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF6FF] text-[#009FE3] dark:bg-[#123554] dark:text-[#19B8F2]">
                  <BookOpen size={22} />
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#145AA8] dark:text-[#19B8F2]">
                  New Account
                </p>

                <h2 className="mt-2 text-[29px] font-black tracking-[-0.04em] text-[#10233F] dark:text-white">
                  Create your account
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-[#A8B4C5]">
                  Start your preparation and keep your progress moving forward.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="register-email"
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
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3.5 pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white dark:placeholder:text-[#718096] dark:focus:border-[#19B8F2] dark:focus:ring-[#19B8F2]/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-password"
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
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3.5 pl-11 pr-12 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white dark:placeholder:text-[#718096] dark:focus:border-[#19B8F2] dark:focus:ring-[#19B8F2]/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
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

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-xs font-black text-[#10233F] dark:text-white"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Re-enter your password"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3.5 pl-11 pr-12 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white dark:placeholder:text-[#718096] dark:focus:border-[#19B8F2] dark:focus:ring-[#19B8F2]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#003B82] dark:hover:bg-[#12243B] dark:hover:text-[#19B8F2]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,96,180,0.20)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,96,180,0.28)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-[#E2E8F0] pt-5 dark:border-[#243A55]">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 dark:text-[#8190A5]">
                  <ShieldCheck
                    size={14}
                    className="text-[#009FE3] dark:text-[#19B8F2]"
                  />
                  Your account information is securely protected
                </div>

                <p className="mt-4 text-center text-xs font-medium text-slate-500 dark:text-[#A8B4C5]">
                  Already have an account?
                </p>

                <Link
                  to="/login"
                  className="mt-1 block text-center text-sm font-black text-[#003B82] transition hover:text-[#009FE3] dark:text-[#19B8F2] dark:hover:text-[#66D5FF]"
                >
                  Sign In
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
  );
}

export default RegisterPage;
