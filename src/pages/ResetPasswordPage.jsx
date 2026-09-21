import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    LockKeyhole,
    ShieldCheck,
} from "lucide-react";

import { supabase } from "../services/supabase";
import logo from "../assets/exam-quiz-hub-logo.png";
import darkLogo from "../assets/exam-quiz-hub-logo-dark.png";
import studyScene from "../assets/login-study-scene.png";

function ResetPasswordPage() {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleUpdatePassword(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!password || !confirmPassword) {
            setError("Please enter and confirm your new password.");
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

            /*
             * The password-reset email creates a temporary
             * recovery session. Make sure that session exists
             * before allowing the password to be changed.
             */
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            if (!session) {
                throw new Error(
                    "This password reset link is invalid or has expired. Please request a new reset link."
                );
            }

            const { error: updateError } =
                await supabase.auth.updateUser({
                    password,
                });

            if (updateError) {
                throw updateError;
            }

            setSuccess(
                "Your password has been updated successfully. Redirecting you to login..."
            );

            /*
             * End the recovery session so the user must
             * sign in with the new password.
             */
            await supabase.auth.signOut();

            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1800);
        } catch (err) {
            console.error("Password update failed:", err);

            setError(
                err.message ||
                "Unable to update your password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-white">
            <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">

                {/* LEFT SIDE */}
                <section className="relative hidden min-h-screen overflow-hidden bg-[#001F4F] lg:flex lg:flex-col">
                    <img
                        src={studyScene}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 right-0 z-0 h-full w-[58%] object-cover object-center opacity-75"
                    />

                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#001F4F] via-[#001F4F]/95 via-[48%] to-[#001F4F]/25" />

                    <div className="relative z-20 flex min-h-screen flex-col px-10 py-6 xl:px-12">
                        <Link to="/" className="w-fit">
                            <img
                                src={darkLogo}
                                alt="Exam Quiz Hub"
                                className="h-14 w-auto object-contain"
                            />
                        </Link>

                        <div className="my-auto max-w-[570px]">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD23F]">
                                <span className="h-1 w-8 rounded-full bg-[#FFD23F]" />
                                Account Security
                            </div>

                            <h1 className="mt-5 text-[50px] font-black leading-[0.98] tracking-[-0.05em] text-white xl:text-[60px]">
                                Create a
                                <br />
                                <span className="bg-gradient-to-r from-[#19B8F2] to-[#66D5FF] bg-clip-text text-transparent">
                                    New Password
                                </span>
                            </h1>

                            <p className="mt-6 max-w-[510px] text-sm leading-6 text-white/70 xl:text-base">
                                Choose a new password to secure your Exam Quiz Hub
                                account and continue your preparation.
                            </p>
                        </div>

                        <p className="text-[10px] font-medium text-white/35">
                            © 2026 Exam Quiz Hub · Learn · Practice · Achieve
                        </p>
                    </div>
                </section>

                {/* RIGHT SIDE */}
                <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F9FC] px-5 py-8 dark:bg-[#07111F] sm:px-8">

                    <div className="relative z-10 w-full max-w-[480px]">

                        {/* Mobile branding */}
                        <div className="mb-5 flex items-center justify-between lg:hidden">
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
                                to="/login"
                                className="inline-flex items-center gap-1.5 text-xs font-black text-[#003B82] dark:text-[#19B8F2]"
                            >
                                <ArrowLeft size={14} />
                                Login
                            </Link>
                        </div>

                        <div className="rounded-[25px] border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_55px_rgba(16,35,63,0.08)] sm:p-8 dark:border-[#243A55] dark:bg-[#0D1B2E]">

                            <div className="text-center">
                                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF6FF] text-[#009FE3] dark:bg-[#123554] dark:text-[#19B8F2]">
                                    <LockKeyhole size={22} />
                                </div>

                                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#145AA8] dark:text-[#19B8F2]">
                                    Account Recovery
                                </p>

                                <h2 className="mt-2 text-[29px] font-black tracking-[-0.04em] text-[#10233F] dark:text-white">
                                    Create new password
                                </h2>

                                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-[#A8B4C5]">
                                    Enter your new password below.
                                </p>
                            </div>

                            {error && (
                                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                                    <CheckCircle2
                                        size={17}
                                        className="mt-0.5 shrink-0"
                                    />
                                    <span>{success}</span>
                                </div>
                            )}

                            <form
                                onSubmit={handleUpdatePassword}
                                className="mt-6 space-y-4"
                            >

                                {/* NEW PASSWORD */}
                                <div>
                                    <label
                                        htmlFor="new-password"
                                        className="mb-2 block text-xs font-black text-[#10233F] dark:text-white"
                                    >
                                        New Password
                                    </label>

                                    <div className="relative">
                                        <LockKeyhole
                                            size={17}
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            id="new-password"
                                            type={
                                                showPassword ? "text" : "password"
                                            }
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            placeholder="At least 6 characters"
                                            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3.5 pl-11 pr-12 text-sm font-semibold text-[#10233F] outline-none focus:border-[#009FE3] dark:border-[#243A55] dark:bg-[#07111F] dark:text-white"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (current) => !current
                                                )
                                            }
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400"
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={17} />
                                            ) : (
                                                <Eye size={17} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* CONFIRM PASSWORD */}
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
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(event) =>
                                                setConfirmPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Re-enter your password"
                                            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3.5 pl-11 pr-12 text-sm font-semibold text-[#10233F] outline-none focus:border-[#009FE3] dark:border-[#243A55] dark:bg-[#07111F] dark:text-white"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (current) => !current
                                                )
                                            }
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400"
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide confirm password"
                                                    : "Show confirm password"
                                            }
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
                                    className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,96,180,0.20)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            Update Password
                                            <ArrowRight size={18} />
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

                                <Link
                                    to="/login"
                                    className="mt-4 block text-center text-sm font-black text-[#003B82] hover:text-[#009FE3] dark:text-[#19B8F2]"
                                >
                                    ← Back to Login
                                </Link>
                            </div>

                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ResetPasswordPage;