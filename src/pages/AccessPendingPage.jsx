import { useNavigate } from "react-router-dom";
import { Clock3, Mail, LogOut, ShieldCheck } from "lucide-react";

import { useAuth } from "../context/AuthContext";

import logo from "../assets/exam-quiz-hub-logo.png";
import darkLogo from "../assets/exam-quiz-hub-logo-dark.png";

function AccessPendingPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const isRejected = profile?.status === "rejected";

  async function handleLogout() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-white">

      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">

        <button
          type="button"
          onClick={() => navigate("/")}
          className="transition hover:opacity-90"
        >
          {/* Light mode logo */}
          <img
            src={logo}
            alt="Exam Quiz Hub"
            className="h-11 w-auto dark:hidden"
          />

          {/* Dark mode logo */}
          <img
            src={darkLogo}
            alt="Exam Quiz Hub"
            className="hidden h-11 w-auto dark:block"
          />
        </button>

        <div className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex dark:text-[#8190A5]">
          <ShieldCheck
            size={15}
            className="text-[#009FE3] dark:text-[#19B8F2]"
          />

          Secure Account
        </div>

      </header>

      {/* Main */}
      <main className="flex min-h-[calc(100vh-90px)] items-center justify-center px-5 pb-12 pt-4">

        <div className="w-full max-w-[520px]">

          {/* Main Card */}
          <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-7 shadow-[0_18px_55px_rgba(16,35,63,0.08)] sm:p-10 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]">

            {/* Icon */}
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#EAF6FF] text-[#009FE3] dark:bg-[#123554] dark:text-[#19B8F2]">
              {isRejected ? (
                <ShieldCheck size={30} />
              ) : (
                <Clock3 size={30} />
              )}
            </div>

            {/* Heading */}
            <div className="mt-6 text-center">

              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#145AA8] dark:text-[#19B8F2]">
                Account Status
              </p>

              <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em] text-[#10233F] sm:text-[34px] dark:text-white">
                {isRejected ? (
                  <>
                    Access{" "}
                    <span className="text-[#009FE3] dark:text-[#19B8F2]">
                      Not Approved
                    </span>
                  </>
                ) : (
                  <>
                    Account{" "}
                    <span className="text-[#009FE3] dark:text-[#19B8F2]">
                      Pending
                    </span>
                  </>
                )}
              </h1>

              <p className="mx-auto mt-4 max-w-[430px] text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
                {isRejected
                  ? "Your account has not been approved. Please contact the administrator for more information."
                  : "Your registration was successful. Your account is waiting for administrator approval."}
              </p>

            </div>

            {/* Email */}
            <div className="mt-7 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#243A55] dark:bg-[#07111F]">

              <div className="flex items-center gap-3">

                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EAF6FF] text-[#009FE3] dark:bg-[#123554] dark:text-[#19B8F2]">
                  <Mail size={18} />
                </div>

                <div className="min-w-0">

                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-[#8190A5]">
                    Registered Email
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-[#10233F] dark:text-white">
                    {profile?.email || "Your registered email"}
                  </p>

                </div>

              </div>

            </div>

            {/* Status Badge */}
            {!isRejected && (
              <div className="mt-5 flex justify-center">

                <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF4D6] px-5 py-2.5 text-xs font-black tracking-wide text-[#9A6800]">

                  <Clock3 size={15} />

                  PENDING APPROVAL

                </div>

              </div>
            )}

            {/* Small message */}
            {!isRejected && (
              <p className="mt-5 text-center text-xs font-medium leading-5 text-slate-400 dark:text-[#8190A5]">
                You will get access to Exam Quiz Hub once your account is approved.
              </p>
            )}

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,96,180,0.20)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,96,180,0.28)]"
            >
              <LogOut size={18} />

              Sign Out
            </button>

            {/* Footer inside card */}
            <div className="mt-7 border-t border-[#E2E8F0] pt-5 text-center dark:border-[#243A55]">

              <p className="text-xs font-semibold text-slate-400 dark:text-[#8190A5]">
                Exam Quiz Hub
              </p>

              <p className="mt-1 text-[10px] font-medium text-slate-300 dark:text-[#64748B]">
                Learn · Practice · Achieve
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default AccessPendingPage;