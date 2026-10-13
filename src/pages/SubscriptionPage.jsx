import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    CheckCircle2,
    Clock3,
    Copy,
    CreditCard,
    Crown,
    FileImage,
    GraduationCap,
    LoaderCircle,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
    Upload,
    XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import upiQrImage from "../assets/exam-quiz-upi-qr.jpeg";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

// Replace with your real UPI ID before accepting payments.
const UPI_ID = "6379849464@upi";
const BUCKET = "subscription-payment-proofs";

// Add your genuine UPI QR image at:
// public/images/exam-quiz-upi-qr.png


const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
];
const MAX_PROOF_SIZE = 5 * 1024 * 1024;

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function StatusBadge({ status }) {
    const normalized = String(status || "pending").toLowerCase();

    const styles = {
        pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
        approved: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
        active: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
        rejected: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
        expired: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };

    const icons = {
        pending: <Clock3 size={14} />,
        approved: <CheckCircle2 size={14} />,
        active: <CheckCircle2 size={14} />,
        rejected: <XCircle size={14} />,
        expired: <Clock3 size={14} />,
    };

    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold ${styles[normalized] || styles.pending
                }`}
        >
            {icons[normalized] || <Clock3 size={14} />}
            {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
        </span>
    );
}

function SectionHeading({ eyebrow, title, description }) {
    return (
        <div className="mb-5">
            {eyebrow && (
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#007CB5] dark:text-sky-300">
                    {eyebrow}
                </p>
            )}
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#10233F] dark:text-white sm:text-3xl">
                {title}
            </h2>
            {description && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            )}
        </div>
    );
}

export default function SubscriptionPage() {
    const { user } = useAuth();

    const [plans, setPlans] = useState([]);
    const [requests, setRequests] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [upiReference, setUpiReference] = useState("");
    const [proofFile, setProofFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [copied, setCopied] = useState(false);

    const loadData = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const [
                { data: planData, error: planError },
                { data: requestData, error: requestError },
                { data: subscriptionData, error: subscriptionError },
            ] = await Promise.all([
                supabase
                    .from("subscription_plans")
                    .select("id, name, price_inr, duration_months")
                    .eq("is_active", true)
                    .order("duration_months", { ascending: false }),
                supabase
                    .from("subscription_requests")
                    .select(
                        "id, plan_id, amount_inr, upi_reference, payment_proof_path, status, admin_note, created_at, reviewed_at"
                    )
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("user_subscriptions")
                    .select("id, request_id, starts_at, expires_at, status, created_at")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false }),
            ]);

            if (planError) throw planError;
            if (requestError) throw requestError;
            if (subscriptionError) throw subscriptionError;

            const availablePlans = planData || [];
            setPlans(availablePlans);
            setRequests(requestData || []);
            setSubscriptions(subscriptionData || []);

            setSelectedPlanId((current) => {
                if (current && availablePlans.some((plan) => plan.id === current)) {
                    return current;
                }
                return availablePlans[0]?.id || "";
            });
        } catch (err) {
            console.error("Subscription page loading failed:", err);
            setError(err?.message || "Unable to load subscription details.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const displayPlans = useMemo(
        () =>
            [...plans].sort(
                (a, b) => Number(b.duration_months) - Number(a.duration_months)
            ),
        [plans]
    );

    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

    const activeSubscription = subscriptions.find(
        (subscription) =>
            String(subscription.status).toLowerCase() === "active" &&
            subscription.expires_at &&
            new Date(subscription.expires_at).getTime() > Date.now()
    );

    async function copyUpiId() {
        if (!UPI_ID || UPI_ID === "YOUR_UPI_ID") {
            setError("Please configure your real UPI ID before accepting payments.");
            return;
        }

        try {
            await navigator.clipboard.writeText(UPI_ID);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setError("Could not copy the UPI ID. Please copy it manually.");
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!user?.id) {
            setError("Please sign in to continue.");
            return;
        }

        if (!selectedPlan) {
            setError("Please select an active subscription plan.");
            return;
        }


        if (!UPI_ID || UPI_ID === "YOUR_UPI_ID") {
            setError("The payment UPI ID has not been configured yet.");
            return;
        }


        if (!upiReference.trim()) {
            setError("Enter your UPI transaction reference.");
            return;
        }

        if (!proofFile) {
            setError("Please attach your payment screenshot or receipt.");
            return;
        }

        if (!ALLOWED_TYPES.includes(proofFile.type)) {
            setError("Upload a JPG, PNG, WebP, or PDF file.");
            return;
        }

        if (proofFile.size > MAX_PROOF_SIZE) {
            setError("The payment proof must be 5 MB or smaller.");
            return;
        }

        setSubmitting(true);
        let uploadedPath = null;

        try {
            const safeName = proofFile.name
                .toLowerCase()
                .replace(/[^a-z0-9._-]/g, "-")
                .slice(-100);

            uploadedPath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(uploadedPath, proofFile, {
                    contentType: proofFile.type,
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data, error: requestError } = await supabase.rpc(
                "submit_subscription_request",
                {
                    p_plan_id: selectedPlan.id,
                    p_upi_reference: upiReference.trim(),
                    p_payment_proof_path: uploadedPath,
                }
            );

            if (requestError) throw requestError;
            if (!data?.success) {
                throw new Error("The payment request could not be submitted.");
            }

            setSuccess(
                "Payment request submitted. Your Premium access will be activated after admin verification."
            );
            setUpiReference("");
            setProofFile(null);

            const fileInput = document.getElementById("payment-proof");
            if (fileInput) fileInput.value = "";

            await loadData();
        } catch (err) {
            console.error("Subscription request submission failed:", err);

            if (uploadedPath) {
                await supabase.storage
                    .from(BUCKET)
                    .remove([uploadedPath])
                    .catch(() => { });
            }

            setError(
                err?.message ||
                "Unable to submit your request. Please check your payment details and try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-[#F7F9FC] text-[#009FE3] dark:bg-[#07111F]">
                <LoaderCircle className="animate-spin" size={30} />
                <span className="ml-3 text-sm font-bold text-slate-500">
                    Loading subscription details...
                </span>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#F7F9FC] px-4 py-6 dark:bg-[#07111F] sm:px-6 sm:py-9 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#007CB5] transition hover:text-[#003B82] dark:text-sky-300 dark:hover:text-sky-200"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>

                {/* Premium hero */}
                <header className="relative mt-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#061735] via-[#003B82] to-[#009FE3] text-white shadow-2xl shadow-blue-950/15">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[36px] border-white/[0.06]" />
                    <div className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="relative grid items-center gap-8 p-6 sm:p-9 lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-black uppercase tracking-[0.13em] text-[#F6D85A] backdrop-blur">
                                <Crown size={15} />
                                Exam Quiz Hub Premium
                            </span>
                            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                                Your next milestone
                                <span className="block text-[#F6D85A]">
                                    starts with practice.
                                </span>
                            </h1>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
                                Unlock premium test sets, practise with confidence, and build
                                a more consistent exam-preparation routine.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <a
                                    href="#subscription-plans"
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#F6C400] px-5 py-3 text-sm font-black text-[#071D49] shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-300"
                                >
                                    Explore plans
                                    <ArrowRight size={17} />
                                </a>
                                <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white">
                                    <ShieldCheck size={17} />
                                    Admin-verified access
                                </span>
                            </div>
                        </div>

                        <div className="relative mx-auto w-full max-w-sm">
                            <div className="absolute -inset-4 rounded-[32px] bg-cyan-300/10 blur-2xl" />
                            <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-md sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C400] text-[#071D49]">
                                        <GraduationCap size={27} />
                                    </div>
                                    <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                                        Learn • Practise • Improve
                                    </span>
                                </div>
                                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                                    Recommended plan
                                </p>
                                <div className="mt-2 flex items-end gap-2">
                                    <span className="text-5xl font-black tracking-tight">
                                        ₹249
                                    </span>
                                    <span className="pb-2 text-sm font-semibold text-blue-100">
                                        / 3 months
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-blue-100">
                                    Just ₹83 per month for three months of Premium access.
                                </p>
                                <div className="mt-5 h-px bg-white/15" />
                                <div className="mt-4 flex items-center gap-3 text-sm font-semibold">
                                    <CheckCircle2 className="shrink-0 text-[#F6D85A]" size={19} />
                                    Premium test sets
                                </div>
                                <div className="mt-3 flex items-center gap-3 text-sm font-semibold">
                                    <CheckCircle2 className="shrink-0 text-[#F6D85A]" size={19} />
                                    Easy UPI payment
                                </div>
                                <div className="mt-3 flex items-center gap-3 text-sm font-semibold">
                                    <CheckCircle2 className="shrink-0 text-[#F6D85A]" size={19} />
                                    Access after approval
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {activeSubscription && (
                    <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                    <CheckCircle2 size={23} />
                                </div>
                                <div>
                                    <p className="font-black text-emerald-900 dark:text-emerald-200">
                                        Your Premium subscription is active
                                    </p>
                                    <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                                        Your access expires on{" "}
                                        <strong>{formatDate(activeSubscription.expires_at)}</strong>.
                                    </p>
                                </div>
                            </div>
                            <StatusBadge status="active" />
                        </div>
                    </section>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                    >
                        <XCircle size={19} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                    >
                        <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Benefits */}
                <section className="mt-10">
                    <SectionHeading
                        eyebrow="Why choose Premium"
                        title="More focus for your exam preparation"
                        description="Everything shown here should reflect the features currently available in your Exam Quiz Hub account."
                    />
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                icon: <Crown size={23} />,
                                title: "Premium Test Sets",
                                description:
                                    "Unlock paid test sets beyond the free Set 1, where supported by your subscription.",
                            },
                            {
                                icon: <BookOpen size={23} />,
                                title: "Practice Questions",
                                description:
                                    "Prepare with the question bank and tests available on the platform.",
                            },
                            {
                                icon: <GraduationCap size={23} />,
                                title: "Exam Preparation",
                                description:
                                    "Build a consistent practice routine for your competitive exams.",
                            },
                            {
                                icon: <ShieldCheck size={23} />,
                                title: "Verified Activation",
                                description:
                                    "Your paid access begins after an administrator verifies your payment.",
                            },
                        ].map((feature) => (
                            <article
                                key={feature.title}
                                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg dark:border-slate-700 dark:bg-[#0D1B2E] dark:hover:border-sky-900"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7FF] text-[#003B82] transition group-hover:bg-[#003B82] group-hover:text-white dark:bg-[#102B43] dark:text-sky-300">
                                    {feature.icon}
                                </div>
                                <h3 className="font-black text-[#10233F] dark:text-white">
                                    {feature.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {feature.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Plans */}
                <section id="subscription-plans" className="mt-12 scroll-mt-8">
                    <SectionHeading
                        eyebrow="Choose your plan"
                        title="Invest in your preparation"
                        description="Choose the duration that works for you. The three-month plan is highlighted for learners who want longer access at a lower monthly cost."
                    />

                    {displayPlans.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-[#0D1B2E] dark:text-slate-300">
                            No active subscription plans are available right now.
                        </div>
                    ) : (
                        <div className="grid items-stretch gap-5 md:grid-cols-2">
                            {displayPlans.map((plan) => {
                                const selected = selectedPlanId === plan.id;
                                const isBestValue = Number(plan.duration_months) === 3;
                                const monthlyCost =
                                    Number(plan.duration_months) > 0
                                        ? Math.round(
                                            Number(plan.price_inr) / Number(plan.duration_months)
                                        )
                                        : Number(plan.price_inr);

                                return (
                                    <button
                                        type="button"
                                        key={plan.id}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        aria-pressed={selected}
                                        className={`relative flex h-full flex-col overflow-hidden rounded-[28px] border-2 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7 ${isBestValue
                                            ? "border-[#F6C400] bg-gradient-to-br from-[#071D49] via-[#003B82] to-[#005EAA] text-white shadow-xl shadow-blue-950/15"
                                            : selected
                                                ? "border-[#009FE3] bg-[#EAF7FF] text-[#10233F] ring-2 ring-[#009FE3]/20 dark:bg-[#102B43] dark:text-white"
                                                : "border-slate-200 bg-white text-[#10233F] dark:border-slate-700 dark:bg-[#0D1B2E] dark:text-white"
                                            }`}
                                    >
                                        {isBestValue && (
                                            <span className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F6C400] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#071D49]">
                                                <Crown size={14} />
                                                Best Value
                                            </span>
                                        )}

                                        {selected && (
                                            <span
                                                className={`absolute right-5 top-5 ${isBestValue ? "text-[#F6D85A]" : "text-[#009FE3]"
                                                    }`}
                                            >
                                                <CheckCircle2 size={23} />
                                            </span>
                                        )}

                                        {!isBestValue && (
                                            <span className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                <Clock3 size={14} />
                                                Flexible access
                                            </span>
                                        )}

                                        <p
                                            className={`text-sm font-bold ${isBestValue
                                                ? "text-blue-100"
                                                : "text-slate-500 dark:text-slate-400"
                                                }`}
                                        >
                                            {plan.name}
                                        </p>

                                        <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
                                            <span className="text-4xl font-black tracking-tight sm:text-5xl">
                                                {formatCurrency(plan.price_inr)}
                                            </span>
                                        </div>

                                        <p
                                            className={`mt-2 text-sm font-semibold ${isBestValue
                                                ? "text-blue-100"
                                                : "text-slate-500 dark:text-slate-400"
                                                }`}
                                        >
                                            {plan.duration_months}{" "}
                                            {Number(plan.duration_months) === 1 ? "month" : "months"}{" "}
                                            of Premium access
                                        </p>

                                        {isBestValue && (
                                            <p className="mt-2 text-sm font-black text-[#F6D85A]">
                                                Just ₹{monthlyCost} per month
                                            </p>
                                        )}

                                        <div
                                            className={`my-6 h-px ${isBestValue
                                                ? "bg-white/15"
                                                : "bg-slate-200 dark:bg-slate-700"
                                                }`}
                                        />

                                        <div className="space-y-3">
                                            {[
                                                "Premium test access after approval",
                                                "Secure payment proof submission",
                                                "Subscription status tracking",
                                            ].map((benefit) => (
                                                <div
                                                    key={benefit}
                                                    className="flex items-start gap-2.5 text-sm font-semibold"
                                                >
                                                    <Check
                                                        size={17}
                                                        className={`mt-0.5 shrink-0 ${isBestValue
                                                            ? "text-[#F6D85A]"
                                                            : "text-emerald-600 dark:text-emerald-400"
                                                            }`}
                                                    />
                                                    <span>{benefit}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className={`mt-7 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-black ${isBestValue
                                                ? "bg-white/10 text-white"
                                                : "bg-[#EAF7FF] text-[#003B82] dark:bg-[#071D31] dark:text-sky-300"
                                                }`}
                                        >
                                            <span>{selected ? "Selected plan" : "Choose this plan"}</span>
                                            {selected ? (
                                                <CheckCircle2 size={18} />
                                            ) : (
                                                <ArrowRight size={18} />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Payment and submission */}
                <section className="mt-12">
                    <SectionHeading
                        eyebrow="Simple and secure"
                        title="Pay using UPI"
                        description="Pay the exact amount for your selected plan, then submit your transaction reference and payment proof for verification."
                    />

                    <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0D1B2E]">
                            <div className="bg-gradient-to-r from-[#071D49] to-[#005EAA] p-5 text-white sm:p-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black">UPI payment</h3>
                                        <p className="mt-1 text-sm text-blue-100">
                                            Scan the genuine QR code to pay
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#07111F]">
                                    <div className="mb-3 text-center">
                                        <p className="text-sm font-black text-[#10233F] dark:text-white">
                                            Scan & Pay
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {selectedPlan?.name || "Select a plan first"}
                                        </p>
                                    </div>

                                    <div className="mx-auto flex aspect-square w-full max-w-[230px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700">
                                        <img
                                            src={upiQrImage}
                                            alt="Exam Quiz Hub UPI payment QR code"
                                            className="h-full w-full object-contain"
                                            onError={(event) => {
                                                event.currentTarget.style.display = "none";
                                                const fallback = event.currentTarget.nextElementSibling;
                                                if (fallback) fallback.classList.remove("hidden");
                                            }}
                                        />
                                        <div className="hidden flex-col items-center justify-center text-center text-slate-400">
                                            <CreditCard size={42} />
                                            <p className="mt-3 text-xs font-bold">
                                                Add your genuine UPI QR image
                                            </p>
                                            <p className="mt-1 max-w-[180px] text-[11px] leading-4">
                                                public/images/exam-quiz-upi-qr.png
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl bg-[#EAF7FF] p-4 text-center dark:bg-[#102B43]">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Amount to pay
                                        </p>
                                        <p className="mt-1 text-3xl font-black text-[#003B82] dark:text-white">
                                            {formatCurrency(selectedPlan?.price_inr)}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-[#007CB5] dark:text-sky-300">
                                            {selectedPlan
                                                ? `${selectedPlan.duration_months} ${Number(selectedPlan.duration_months) === 1
                                                    ? "month"
                                                    : "months"
                                                } of access`
                                                : "Choose a plan above"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        UPI ID
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#07111F]">
                                        <span className="min-w-0 flex-1 break-all text-sm font-black text-[#003B82] dark:text-sky-300">
                                            {UPI_ID}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={copyUpiId}
                                            disabled={UPI_ID === "YOUR_UPI_ID"}
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#EAF7FF] px-3 py-2 text-xs font-black text-[#003B82] transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#102B43] dark:text-sky-300"
                                            aria-label="Copy UPI ID"
                                        >
                                            {copied ? <Check size={15} /> : <Copy size={15} />}
                                            {copied ? "Copied" : "Copy"}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4">
                                    {[
                                        "Select a plan and pay the exact amount through your UPI app.",
                                        "Keep the UPI transaction reference number.",
                                        "Upload your payment receipt or screenshot in the form.",
                                        "Submit the request and wait for admin verification.",
                                    ].map((step, index) => (
                                        <div key={step} className="flex items-start gap-3">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF7FF] text-xs font-black text-[#003B82] dark:bg-[#102B43] dark:text-sky-300">
                                                {index + 1}
                                            </span>
                                            <p className="pt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                                    <LockKeyhole
                                        size={18}
                                        className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"
                                    />
                                    <p className="text-xs leading-5 text-amber-900 dark:text-amber-200">
                                        Payment is not verified automatically. Premium access is
                                        activated only after an administrator approves your
                                        request.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#0D1B2E] sm:p-7"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7FF] text-[#003B82] dark:bg-[#102B43] dark:text-sky-300">
                                    <Upload size={23} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-[#10233F] dark:text-white">
                                        Submit payment details
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        Fill in your completed transaction details below.
                                    </p>
                                </div>
                            </div>

                            <label
                                htmlFor="upi-reference"
                                className="mt-7 block text-sm font-bold text-slate-700 dark:text-slate-200"
                            >
                                UPI transaction reference <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="upi-reference"
                                value={upiReference}
                                onChange={(event) => setUpiReference(event.target.value)}
                                maxLength={150}
                                required
                                placeholder="Enter transaction ID / UTR"
                                autoComplete="off"
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-slate-600 dark:bg-[#07111F] dark:text-white"
                            />

                            <label
                                htmlFor="payment-proof"
                                className="mt-6 block text-sm font-bold text-slate-700 dark:text-slate-200"
                            >
                                Payment screenshot or receipt{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-4 transition hover:border-[#009FE3] dark:border-slate-600 dark:bg-[#07111F]">
                                <input
                                    id="payment-proof"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    required
                                    onChange={(event) =>
                                        setProofFile(event.target.files?.[0] || null)
                                    }
                                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#EAF7FF] file:px-3 file:py-2 file:text-xs file:font-black file:text-[#007CB5] hover:file:bg-sky-100 dark:text-slate-300 dark:file:bg-[#102B43] dark:file:text-sky-300"
                                />
                                <p className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <FileImage size={15} />
                                    JPG, PNG, WebP or PDF · Maximum 5 MB
                                </p>
                                {proofFile && (
                                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-white p-3 dark:bg-[#0D1B2E]">
                                        <FileImage
                                            size={17}
                                            className="mt-0.5 shrink-0 text-[#007CB5]"
                                        />
                                        <p className="break-all text-xs font-bold text-[#007CB5] dark:text-sky-300">
                                            Selected: {proofFile.name}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-[#07111F]">
                                <ShieldCheck
                                    size={18}
                                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                                />
                                <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                                    Your proof is stored in private storage. Submit only a
                                    transaction you have actually completed.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || plans.length === 0}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-5 py-4 text-sm font-black text-white shadow-lg shadow-sky-900/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                            >
                                {submitting ? (
                                    <>
                                        <LoaderCircle size={18} className="animate-spin" />
                                        Submitting request...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Submit for verification
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>

                            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                                Your subscription starts after approval, not when this form is
                                submitted.
                            </p>
                        </form>
                    </div>
                </section>

                {/* Payment request history */}
                <section className="mt-12">
                    <SectionHeading
                        eyebrow="Payment tracking"
                        title="My payment requests"
                        description="Check the verification status of each payment request you have submitted."
                    />

                    {requests.length === 0 ? (
                        <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#0D1B2E]">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                <Clock3 size={27} />
                            </div>
                            <p className="mt-4 font-black text-[#10233F] dark:text-white">
                                No payment requests yet
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Your submitted payment requests will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((request) => {
                                const plan = plans.find((item) => item.id === request.plan_id);

                                return (
                                    <article
                                        key={request.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md dark:border-slate-700 dark:bg-[#0D1B2E]"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF7FF] text-[#003B82] dark:bg-[#102B43] dark:text-sky-300">
                                                    <CreditCard size={21} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-[#10233F] dark:text-white">
                                                        {plan?.name || "Subscription plan"}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                        {formatCurrency(request.amount_inr)} · Submitted{" "}
                                                        {formatDate(request.created_at)}
                                                    </p>
                                                    <p className="mt-2 break-all text-xs text-slate-500 dark:text-slate-400">
                                                        Reference: {request.upi_reference}
                                                    </p>
                                                    {request.reviewed_at && (
                                                        <p className="mt-1 text-xs text-slate-400">
                                                            Reviewed on {formatDate(request.reviewed_at)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <StatusBadge status={request.status} />
                                        </div>

                                        {request.admin_note && (
                                            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:bg-[#07111F] dark:text-slate-300">
                                                <strong>Admin note:</strong> {request.admin_note}
                                            </p>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Subscription history */}
                <section className="mt-12">
                    <SectionHeading
                        eyebrow="Your access"
                        title="My subscriptions"
                        description="Review the start date, expiry date, and status of your activated subscriptions."
                    />

                    {subscriptions.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-[#0D1B2E] dark:text-slate-400">
                            No subscriptions have been activated yet.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {subscriptions.map((subscription) => {
                                const isActive =
                                    String(subscription.status).toLowerCase() === "active" &&
                                    subscription.expires_at &&
                                    new Date(subscription.expires_at).getTime() > Date.now();

                                return (
                                    <article
                                        key={subscription.id}
                                        className={`rounded-2xl border bg-white p-5 dark:bg-[#0D1B2E] ${isActive
                                            ? "border-emerald-200 dark:border-emerald-900"
                                            : "border-slate-200 dark:border-slate-700"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF7FF] text-[#003B82] dark:bg-[#102B43] dark:text-sky-300">
                                                    <Crown size={21} />
                                                </div>
                                                <p className="font-black text-[#10233F] dark:text-white">
                                                    Premium access
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={isActive ? "active" : subscription.status}
                                            />
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                            <div className="rounded-xl bg-slate-50 p-3 dark:bg-[#07111F]">
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    Starts
                                                </p>
                                                <p className="mt-1 text-sm font-black text-[#10233F] dark:text-white">
                                                    {formatDate(subscription.starts_at)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 p-3 dark:bg-[#07111F]">
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    Expires
                                                </p>
                                                <p className="mt-1 text-sm font-black text-[#10233F] dark:text-white">
                                                    {formatDate(subscription.expires_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <footer className="mt-12 border-t border-slate-200 py-6 dark:border-slate-800">
                    <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                            Exam Quiz Hub Premium · Payment approval is handled by an
                            administrator.
                        </p>
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 text-sm font-bold text-[#007CB5] hover:text-[#003B82] dark:text-sky-300"
                        >
                            <ArrowLeft size={15} />
                            Back to Dashboard
                        </Link>
                    </div>
                </footer>
            </div>
        </main>
    );
}
