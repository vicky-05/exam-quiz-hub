import { Link } from "react-router-dom";
import { ArrowLeft, MessageSquareQuote, ShieldCheck } from "lucide-react";

import Header from "../components/Header";
import ReviewForm from "../components/ReviewForm";

export default function ReviewPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#0B1728] sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-4xl">
          {/* Back navigation */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-blue-700 transition hover:text-sky-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-sky-300"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          {/* Page heading */}
          <section className="mb-8 mt-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 text-blue-700 shadow-sm dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">
              <MessageSquareQuote size={30} />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Share Your Experience
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Your feedback helps us improve Exam Quiz Hub and
              supports fellow aspirants preparing for competitive exams.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
              <ShieldCheck size={16} />
              Reviews are published after admin approval
            </div>
          </section>

          {/* Existing form component */}
          <div className="mx-auto w-full max-w-3xl">
            <ReviewForm />
          </div>

          {/* Footer note */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
            Please share honest feedback. Avoid including passwords,
            phone numbers, or other sensitive personal information.
          </p>
        </div>
      </main>
    </>
  );
}