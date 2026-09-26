import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Clock3,
  RefreshCw,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  const { user, profile, loading: authLoading, signOut, sessionRowId, deviceId } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMessage, setNameMessage] = useState("");
  const [nameError, setNameError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [signingOut, setSigningOut] = useState(false);
  const [activeDevices, setActiveDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [deviceActionId, setDeviceActionId] = useState("");
  const [deviceError, setDeviceError] = useState("");
  const [deviceMessage, setDeviceMessage] = useState("");

  function getDeviceIcon(deviceType) {
    if (deviceType === "mobile") return <Smartphone size={19} />;
    if (deviceType === "tablet") return <Tablet size={19} />;
    return <Monitor size={19} />;
  }

  function formatDateTime(value) {
    if (!value) return "—";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function formatLastActive(value) {
    if (!value) return "—";

    const diff = Math.max(0, Date.now() - new Date(value).getTime());
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

    return formatDateTime(value);
  }

  async function loadActiveDevices() {
    if (!user) return;

    try {
      setDevicesLoading(true);
      setDeviceError("");

      const { data, error } = await supabase
        .from("user_sessions")
        .select(
          "id, session_id, device_id, device_type, browser, operating_system, device_name, last_active_at, created_at, revoked_at"
        )
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .order("last_active_at", { ascending: false });

      if (error) throw error;

      setActiveDevices(data || []);
    } catch (error) {
      console.error("Failed to load active devices:", error);
      setDeviceError("Unable to load active devices. Please try again.");
    } finally {
      setDevicesLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;

    loadActiveDevices();

    const refreshTimer = window.setInterval(() => {
      loadActiveDevices();
    }, 60000);

    return () => window.clearInterval(refreshTimer);
  }, [user?.id]);

  async function handleDeviceLogout(device) {
    if (deviceActionId) return;

    setDeviceError("");
    setDeviceMessage("");
    setDeviceActionId(device.id);

    try {
      if (device.id === sessionRowId) {
        await signOut();
        navigate("/login", { replace: true });
        return;
      }

      const { data, error } = await supabase.rpc("revoke_user_session", {
        p_session_row_id: device.id,
      });

      if (error) throw error;

      if (data === false) {
        throw new Error("Unable to revoke this device session.");
      }

      setActiveDevices((current) =>
        current.filter((item) => item.id !== device.id)
      );
      setDeviceMessage(
        `${device.device_name || "Device"} has been signed out successfully.`
      );
    } catch (error) {
      console.error("Device logout failed:", error);
      setDeviceError(
        error?.message || "Unable to sign out this device. Please try again."
      );
    } finally {
      setDeviceActionId("");
    }
  }

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

  const fallbackName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Student";

  const createdAt = user.created_at;

  useEffect(() => {
    setDisplayName(fallbackName);
  }, [fallbackName]);

  async function handleNameChange(event) {
    event.preventDefault();

    setNameMessage("");
    setNameError("");

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setNameError("Please enter your name.");
      return;
    }

    if (trimmedName.length < 2) {
      setNameError("Name must contain at least 2 characters.");
      return;
    }

    if (trimmedName.length > 80) {
      setNameError("Name must be 80 characters or less.");
      return;
    }

    try {
      setNameLoading(true);

      // Keep Supabase Auth metadata updated so Header and other auth-based
      // components immediately use the new name.
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
        },
      });

      if (authError) throw authError;

      // Update the application's profile record through a secure RPC.
      // The SQL function only permits changing the current user's name.
      const { error: profileError } = await supabase.rpc(
        "update_my_profile_name",
        {
          new_full_name: trimmedName,
        }
      );

      if (profileError) {
        console.warn(
          "Auth name updated, but profile name was not updated:",
          profileError
        );
      }

      setDisplayName(trimmedName);
      setNameMessage("Your name has been updated successfully.");
    } catch (error) {
      console.error("Name update failed:", error);
      setNameError(
        error?.message ||
          "Unable to update your name. Please try again."
      );
    } finally {
      setNameLoading(false);
    }
  }

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

              <form
                onSubmit={handleNameChange}
                className="mt-5"
              >
                <label
                  htmlFor="profile-name"
                  className="text-xs font-black text-[#10233F] dark:text-white"
                >
                  Your Name
                </label>

                <div className="mt-2 flex gap-2">
                  <input
                    id="profile-name"
                    type="text"
                    value={displayName}
                    onChange={(event) => {
                      setDisplayName(event.target.value);
                      setNameMessage("");
                      setNameError("");
                    }}
                    placeholder="Enter your name"
                    maxLength={80}
                    className="min-w-0 flex-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white dark:placeholder:text-[#718096] dark:focus:border-[#19B8F2] dark:focus:ring-[#19B8F2]/10"
                  />

                  <button
                    type="submit"
                    disabled={nameLoading}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-4 py-3 text-xs font-black text-white shadow-[0_8px_20px_rgba(0,96,180,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {nameLoading ? "Saving..." : "Save"}
                  </button>
                </div>

                <p className="mt-2 text-[10px] font-medium text-slate-400 dark:text-[#8190A5]">
                  This name will be shown in your profile and account menu.
                </p>

                {nameError ? (
                  <div
                    role="alert"
                    className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                  >
                    {nameError}
                  </div>
                ) : null}

                {nameMessage ? (
                  <div
                    role="status"
                    className="mt-3 flex items-center gap-2 rounded-xl border border-[#009FE3]/20 bg-[#009FE3]/5 px-4 py-3 text-xs font-semibold text-[#0068C9] dark:border-[#19B8F2]/20 dark:bg-[#19B8F2]/5 dark:text-[#19B8F2]"
                  >
                    <CheckCircle2 size={17} />
                    {nameMessage}
                  </div>
                ) : null}

                <div className="mt-4">
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
              </form>

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

          {/* ACTIVE DEVICES */}
          <section className="mt-6 rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_35px_rgba(16,35,63,0.05)] sm:p-7 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_16px_45px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F0A000] dark:text-[#FFD23F]">
                  Security
                </p>

                <h2 className="mt-2 text-xl font-black text-[#10233F] dark:text-white">
                  Active Devices
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
                  View where your account is currently signed in and sign out
                  devices you no longer use.
                </p>
              </div>

              <button
                type="button"
                onClick={loadActiveDevices}
                disabled={devicesLoading}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-black text-[#10233F] transition hover:border-[#009FE3]/40 hover:text-[#003B82] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white dark:hover:border-[#19B8F2]/40 dark:hover:text-[#19B8F2]"
              >
                <RefreshCw
                  size={15}
                  className={devicesLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {deviceError ? (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
              >
                {deviceError}
              </div>
            ) : null}

            {deviceMessage ? (
              <div
                role="status"
                className="mt-5 flex items-center gap-2 rounded-xl border border-[#009FE3]/20 bg-[#009FE3]/5 px-4 py-3 text-xs font-semibold text-[#0068C9] dark:border-[#19B8F2]/20 dark:bg-[#19B8F2]/5 dark:text-[#19B8F2]"
              >
                <CheckCircle2 size={17} />
                {deviceMessage}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {devicesLoading ? (
                <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-6 text-center text-sm font-semibold text-slate-500 dark:border-[#243A55] dark:bg-[#07111F] dark:text-[#A8B4C5]">
                  Loading active devices...
                </div>
              ) : activeDevices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-6 text-center text-sm font-semibold text-slate-500 dark:border-[#334A66] dark:bg-[#07111F] dark:text-[#A8B4C5]">
                  No active devices found.
                </div>
              ) : (
                activeDevices.map((device) => {
                  const isCurrentDevice =
                    device.id === sessionRowId ||
                    (deviceId && device.device_id === deviceId);

                  return (
                    <div
                      key={device.id}
                      className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#243A55] dark:bg-[#07111F]"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#009FE3]/10 text-[#009FE3] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                          {getDeviceIcon(device.device_type)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-black text-[#10233F] dark:text-white">
                              {device.device_name ||
                                device.browser ||
                                "Unknown device"}
                            </h3>

                            {isCurrentDevice ? (
                              <span className="rounded-full bg-[#009FE3]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#0068C9] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                                This device
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-[#A8B4C5]">
                            {device.device_type
                              ? device.device_type.charAt(0).toUpperCase() +
                                device.device_type.slice(1)
                              : "Device"}
                            {device.browser ? ` • ${device.browser}` : ""}
                            {device.operating_system
                              ? ` • ${device.operating_system}`
                              : ""}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-400 dark:text-[#8190A5]">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={12} />
                              Last active: {formatLastActive(device.last_active_at)}
                            </span>

                            <span>
                              Signed in: {formatDateTime(device.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeviceLogout(device)}
                        disabled={deviceActionId === device.id}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-[#0D1B2E] dark:hover:bg-red-950/30"
                      >
                        <LogOut size={15} />
                        {deviceActionId === device.id
                          ? "Signing out..."
                          : "Logout"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

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
