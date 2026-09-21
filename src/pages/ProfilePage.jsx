import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#E2E8F0] py-4 last:border-b-0 dark:border-[#243A55]">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#009FE3]/10 text-[#009FE3] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-[#8190A5]">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-black text-[#10233F] dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}) {
  return (
    <div>
      <label className="text-xs font-black text-[#10233F] dark:text-white">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 pr-12 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white dark:placeholder:text-[#718096] dark:focus:border-[#19B8F2] dark:focus:ring-[#19B8F2]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#009FE3] dark:hover:bg-[#12243B] dark:hover:text-[#19B8F2]"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [signingOut, setSigningOut] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-white">
        <Header />

        <main className="grid min-h-[calc(100vh-78px)] place-items-center px-6">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#009FE3]/20 border-t-[#009FE3] dark:border-[#19B8F2]/20 dark:border-t-[#19B8F2]" />
            <p className="mt-4 text-sm font-bold text-slate-500 dark:text-[#A8B4C5]">
              Loading your profile...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Student";

  const createdAt = user.created_at;

  async function handlePasswordChange(event) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!newPassword || !confirmPassword) {
      setPasswordError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage("Your password has been updated successfully.");
    } catch (error) {
      console.error("Password update failed:", error);

      setPasswordError(
        error?.message ||
          "Unable to update your password. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;

    try {
      setSigningOut(true);

      await signOut();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Sign out failed:", error);

      setPasswordError(error?.message || "Unable to sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-white">
      <Header />

      <main>
        {/* =========================================================
            PROFILE HERO
        ========================================================== */}
        <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-gradient-to-br from-[#EEF7FF] via-white to-[#FFF9E8] dark:border-[#243A55] dark:from-[#0D1B2E] dark:via-[#07111F] dark:to-[#10243B]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#009FE3]/10 blur-3xl dark:bg-[#19B8F2]/8" />
          <div className="pointer-events-none absolute -right-24 -top-16 h-80 w-80 rounded-full bg-[#F6C400]/12 blur-3xl dark:bg-[#FFD23F]/7" />

          <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#009FE3]/20 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#145AA8] shadow-sm dark:border-[#19B8F2]/20 dark:bg-[#0D1B2E] dark:text-[#19B8F2]">
                  <ShieldCheck size={14} />
                  Account & Security
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] text-[#10233F] sm:text-4xl lg:text-5xl dark:text-white">
                  Profile &{" "}
                  <span className="bg-gradient-to-r from-[#003B82] to-[#009FE3] bg-clip-text text-transparent dark:from-[#19B8F2] dark:to-[#66D5FF]">
                    Account
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-[#A8B4C5]">
                  Manage your account details, protect your access and keep
                  your Exam Quiz Hub profile secure.
                </p>
              </div>

              <Link
                to="/dashboard"
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-black text-[#10233F] shadow-sm transition hover:-translate-y-0.5 hover:border-[#009FE3]/40 hover:text-[#003B82] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:text-white dark:hover:border-[#19B8F2]/40 dark:hover:text-[#19B8F2]"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            CONTENT
        ========================================================== */}
        <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12 lg:py-9">
          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            {/* ACCOUNT INFORMATION */}
            <section className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_35px_rgba(16,35,63,0.05)] sm:p-7 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_16px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#003B82] to-[#009FE3] text-white shadow-lg shadow-[#009FE3]/15">
                  <UserRound size={24} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F0A000] dark:text-[#FFD23F]">
                    Profile
                  </p>

                  <h2 className="mt-1 truncate text-xl font-black text-[#10233F] dark:text-white">
                    {displayName}
                  </h2>
                </div>
              </div>

              <div className="mt-5">
                <InfoRow
                  icon={<UserRound size={18} />}
                  label="Name"
                  value={displayName}
                />

                <InfoRow
                  icon={<Mail size={18} />}
                  label="Email"
                  value={user.email || "—"}
                />

                <InfoRow
                  icon={<CheckCircle2 size={18} />}
                  label="Account Status"
                  value="Active"
                />

                <InfoRow
                  icon={<ShieldCheck size={18} />}
                  label="Member Since"
                  value={formatDate(createdAt)}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-[#009FE3]/10 bg-[#EEF8FF] p-4 dark:border-[#19B8F2]/10 dark:bg-[#10243B]">
                <div className="flex gap-3">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-[#009FE3] dark:text-[#19B8F2]"
                  />

                  <div>
                    <p className="text-sm font-black text-[#10233F] dark:text-white">
                      Your account is protected
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-[#A8B4C5]">
                      Your authentication is securely managed through Supabase
                      Auth.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHANGE PASSWORD */}
            <section className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_35px_rgba(16,35,63,0.05)] sm:p-7 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_16px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#003B82] text-white shadow-lg shadow-[#003B82]/15 dark:bg-[#145AA8]">
                  <LockKeyhole size={21} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F0A000] dark:text-[#FFD23F]">
                    Security
                  </p>

                  <h2 className="mt-1 text-xl font-black text-[#10233F] dark:text-white">
                    Change Password
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
                Choose a strong password that you do not use on other websites.
              </p>

              <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
                <PasswordInput
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Enter new password"
                  show={showNewPassword}
                  onToggle={() =>
                    setShowNewPassword((value) => !value)
                  }
                />

                <PasswordInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm new password"
                  show={showConfirmPassword}
                  onToggle={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                />

                {passwordError ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                  >
                    {passwordError}
                  </div>
                ) : null}

                {passwordMessage ? (
                  <div
                    role="status"
                    className="flex items-center gap-2 rounded-xl border border-[#009FE3]/20 bg-[#009FE3]/5 px-4 py-3 text-xs font-semibold text-[#0068C9] dark:border-[#19B8F2]/20 dark:bg-[#19B8F2]/5 dark:text-[#19B8F2]"
                  >
                    <CheckCircle2 size={17} />
                    {passwordMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,96,180,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,96,180,0.25)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <KeyRound size={17} />

                  {passwordLoading
                    ? "Updating Password..."
                    : "Update Password"}
                </button>
              </form>
            </section>
          </div>

          {/* ACCOUNT ACTIONS */}
          <section className="mt-6 rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_35px_rgba(16,35,63,0.05)] sm:p-7 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_16px_45px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F0A000] dark:text-[#FFD23F]">
                  Account Actions
                </p>

                <h2 className="mt-2 text-xl font-black text-[#10233F] dark:text-white">
                  Manage your session
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-[#A8B4C5]">
                  Sign out from this device when you are finished.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-[#0D1B2E] dark:hover:bg-red-950/30"
              >
                <LogOut size={17} />

                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;
