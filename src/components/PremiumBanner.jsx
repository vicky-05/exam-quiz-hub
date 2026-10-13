
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Crown,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function PremiumBanner() {
  return (
    <section className="bg-[#F7F9FC] px-5 py-10 sm:px-8 lg:px-12 dark:bg-[#07111F]">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-gradient-to-br from-[#061735] via-[#003B82] to-[#009FE3] text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[35px] border-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative p-6 sm:p-9 lg:p-12">
          {/* Header */}
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-[#F6D85A]">
              <Sparkles size={15} />
              Exam Quiz Hub Premium
            </span>

            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              Choose the plan that
              <span className="block text-[#F6D85A]">
                takes you further.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              Both plans unlock Premium test access. Choose three months
              to get study material included and save more over time.
            </p>
          </div>

          {/* Plan comparison */}
          <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2">
            {/* Monthly plan */}
            <article className="flex flex-col rounded-[24px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-100">
                  <BookOpen size={23} />
                </div>
                <div>
                  <h3 className="font-black">Monthly Premium</h3>
                  <p className="mt-0.5 text-xs text-blue-200">
                    For short-term preparation
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-black">₹99</span>
                <span className="pb-1.5 text-sm text-blue-200">
                  / 1 month
                </span>
              </div>

              <p className="mt-2 text-sm text-blue-100">
                ₹99 per month
              </p>

              <div className="my-5 h-px bg-white/15" />

              <ul className="flex-1 space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-blue-50">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-300"
                  />
                  Premium test-set access
                </li>
                <li className="flex items-start gap-2.5 text-sm text-blue-200">
                  <XCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-300"
                  />
                  Study material not included
                </li>
              </ul>

              <Link
                to="/dashboard/subscription"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/10"
              >
                Choose Monthly
                <ArrowRight size={17} />
              </Link>
            </article>

            {/* Three-month plan */}
            <article className="relative flex flex-col overflow-hidden rounded-[24px] border-2 border-[#F6C400] bg-gradient-to-br from-white via-[#FFFDF4] to-[#FFF1BD] p-5 text-[#071D49] shadow-2xl shadow-black/15 sm:p-7">
              <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#F6C400] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#071D49]">
                Best Value
              </div>

              <div className="flex items-center gap-3 pr-20">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6C400] text-[#071D49]">
                  <Crown size={24} />
                </div>
                <div>
                  <h3 className="font-black">3-Month Premium</h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600">
                    More benefits for your preparation
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-black">₹249</span>
                <span className="pb-1.5 text-sm font-semibold text-slate-600">
                  / 3 months
                </span>
              </div>

              <p className="mt-2 text-sm font-black text-[#007CB5]">
                Just ₹83 per month
              </p>

              <div className="my-5 h-px bg-[#071D49]/10" />

              <ul className="flex-1 space-y-3">
                <li className="flex items-start gap-2.5 text-sm font-semibold">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  Premium test-set access
                </li>
                <li className="flex items-start gap-2.5 text-sm font-bold">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  Study material included
                </li>
                <li className="flex items-start gap-2.5 text-sm font-semibold">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  Three months of access
                </li>
              </ul>

              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-black text-emerald-800">
                  Save ₹48
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Pay ₹249 instead of ₹297 for three monthly subscriptions,
                  and get study material included.
                </p>
              </div>

              <Link
                to="/dashboard/subscription"
                className="group mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#071D49] px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#003B82]"
              >
                Get 3-Month Premium
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </article>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-blue-200">
            Premium access starts after admin payment verification.
            Study material is included only with the three-month plan.
          </p>
        </div>
      </div>
    </section>
  );
}
