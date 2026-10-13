import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Crown,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

const purchaseSteps = [
  {
    number: "01",
    title: "Sign In to Your Account",
    description:
      "Create your Exam Quiz Hub account or log in to continue.",
    icon: UserRound,
    color:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  {
    number: "02",
    title: "Choose Your Premium Plan",
    description:
      "Select the monthly plan or the 3-month plan that suits your preparation.",
    icon: CreditCard,
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  {
    number: "03",
    title: "Complete Your Payment",
    description:
      "Pay through the displayed UPI instructions and submit your transaction reference and payment proof.",
    icon: Wallet,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    number: "04",
    title: "Get Verified & Start Practising",
    description:
      "Once the admin approves your payment, your Premium access becomes available.",
    icon: ShieldCheck,
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
];

function HowToBuyPremium() {
  return (
    <section
      id="buy-premium"
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">
            <Crown size={15} />
            Premium Membership
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Your Next Step Towards{" "}
            <span className="text-blue-600 dark:text-sky-400">
              Success
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            Unlock Premium practice sets in four simple steps
            and prepare for your competitive exams with confidence.
          </p>
        </div>

        {/* Purchase steps */}
        <div className="relative mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {purchaseSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500/50 dark:hover:shadow-black/20"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.color}`}
                  >
                    <Icon size={23} strokeWidth={2.2} />
                  </div>

                  <span className="text-3xl font-black text-slate-100 transition-colors group-hover:text-blue-100 dark:text-slate-800 dark:group-hover:text-slate-700">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-extrabold text-slate-900 dark:text-white">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>

                <div className="mt-5 h-1 w-12 rounded-full bg-blue-500 transition-all duration-300 group-hover:w-20 dark:bg-sky-400" />
              </article>
            );
          })}
        </div>

        {/* Plans */}
        <div className="mt-16">
          <div className="text-center">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Choose Your Premium Plan
            </h3>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Choose a plan and take your preparation further.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Monthly plan */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-sky-300">
                  <CreditCard size={22} />
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white">
                    Monthly Premium
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    One month of access
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  ₹99
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  / month
                </span>
              </div>

              <div className="mt-5 flex-1 space-y-3">
                <PlanFeature text="Premium practice sets" />
                <PlanFeature text="Access for one month" />
              </div>

              <Link
                to="/dashboard/subscription"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 px-5 py-3 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50 dark:border-slate-600 dark:text-sky-300 dark:hover:bg-white/5"
              >
                Choose Monthly
                <ArrowRight size={17} />
              </Link>
            </div>

            {/* Three-month plan */}
            <div className="relative flex flex-col rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-xl shadow-blue-900/10 dark:border-sky-400 dark:bg-slate-900 dark:shadow-black/20 sm:p-7">
              <span className="absolute -top-3 right-5 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white dark:bg-sky-400 dark:text-slate-950">
                Best Value
              </span>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                  <Crown size={22} />
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white">
                    3-Month Premium
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Longer preparation access
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  ₹249
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  / 3 months
                </span>
              </div>

              <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Save ₹48 compared with three monthly payments
              </p>

              <div className="mt-5 flex-1 space-y-3">
                <PlanFeature text="Premium practice sets" />
                <PlanFeature text="Study materials included" />
                <PlanFeature text="Access for three months" />
              </div>

              <Link
                to="/dashboard/subscription"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Get 3-Month Premium
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>

        {/* Payment information */}
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60 sm:p-5">
          <CheckCircle2
            size={21}
            className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          />

          <p className="text-xs leading-6 text-slate-600 dark:text-slate-400 sm:text-sm">
            <span className="font-extrabold text-slate-900 dark:text-white">
              Payment verification:
            </span>{" "}
            Premium access is activated after your payment
            submission has been reviewed and approved by the admin.
            Submit the correct transaction reference and payment proof.
          </p>
        </div>

        {/* Final CTA */}
        <div className="mt-10 text-center">
          <Link
            to="/dashboard/subscription"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
          >
            Get Premium Access
            <ArrowRight size={18} />
          </Link>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Already a Premium member? Manage your subscription from your dashboard.
          </p>
        </div>
      </div>
    </section>
  );
}

function PlanFeature({ text }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle2
        size={17}
        className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
      />
      <span className="text-sm text-slate-700 dark:text-slate-300">
        {text}
      </span>
    </div>
  );
}

export default HowToBuyPremium;