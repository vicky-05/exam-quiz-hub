
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileImage,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "../../services/supabase";

const PROOF_BUCKET = "subscription-payment-proofs";

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getErrorMessage = (error) =>
  error?.message || "Something went wrong. Please try again.";

const statusClasses = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  expired: "bg-gray-100 text-gray-600 ring-gray-200",
};

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ring-inset ${
        statusClasses[normalized] ||
        "bg-gray-100 text-gray-600 ring-gray-200"
      }`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function AdminSubscriptions() {
  const [requests, setRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [activeTab, setActiveTab] = useState("requests");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const [proofLoading, setProofLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofError, setProofError] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");
    setNotice("");

    try {
      const [
        requestsResult,
        subscriptionsResult,
        plansResult,
      ] = await Promise.all([
        supabase
          .from("subscription_requests")
          .select(
            "id, user_id, plan_id, amount_inr, upi_reference, payment_proof_path, status, reviewed_by, reviewed_at, admin_note, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("user_subscriptions")
          .select(
            "id, user_id, request_id, starts_at, expires_at, status, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("subscription_plans")
          .select("id, name, price_inr, duration_months, is_active")
          .order("duration_months", { ascending: false }),
      ]);

      if (requestsResult.error) throw requestsResult.error;
      if (subscriptionsResult.error) throw subscriptionsResult.error;
      if (plansResult.error) throw plansResult.error;

      const requestRows = requestsResult.data || [];
      const subscriptionRows = subscriptionsResult.data || [];
      const planRows = plansResult.data || [];

      const userIds = [
        ...new Set([
          ...requestRows.map((item) => item.user_id),
          ...subscriptionRows.map((item) => item.user_id),
        ]),
      ].filter(Boolean);

      let profileRows = [];

      if (userIds.length > 0) {
        const profilesResult = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profilesResult.error) throw profilesResult.error;

        profileRows = profilesResult.data || [];
      }

      setRequests(requestRows);
      setSubscriptions(subscriptionRows);
      setPlans(planRows);
      setProfiles(profileRows);
    } catch (err) {
      console.error("Admin subscription loading error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const planById = useMemo(
    () => new Map(plans.map((plan) => [plan.id, plan])),
    [plans]
  );

  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles]
  );

  const requestById = useMemo(
    () => new Map(requests.map((request) => [request.id, request])),
    [requests]
  );

  const enrichedRequests = useMemo(
    () =>
      requests.map((request) => ({
        ...request,
        plan: planById.get(request.plan_id),
        profile: profileById.get(request.user_id),
      })),
    [requests, planById, profileById]
  );

  const enrichedSubscriptions = useMemo(
    () =>
      subscriptions.map((subscription) => ({
        ...subscription,
        plan: planById.get(
          requestById.get(subscription.request_id)?.plan_id
        ),
        profile: profileById.get(subscription.user_id),
      })),
    [subscriptions, planById, profileById, requestById]
  );

  const pendingCount = requests.filter(
    (item) => item.status === "pending"
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === "approved"
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === "rejected"
  ).length;

  const activeCount = subscriptions.filter(
    (item) =>
      item.status === "active" &&
      new Date(item.expires_at).getTime() > Date.now()
  ).length;

  const filteredRequests = enrichedRequests.filter((request) => {
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;

    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      [
        request.profile?.full_name,
        request.profile?.email,
        request.upi_reference,
        request.plan?.name,
        request.user_id,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

    return matchesStatus && matchesSearch;
  });

  const filteredSubscriptions = enrichedSubscriptions.filter(
    (subscription) => {
      const query = search.trim().toLowerCase();

      return (
        !query ||
        [
          subscription.profile?.full_name,
          subscription.profile?.email,
          subscription.plan?.name,
          subscription.user_id,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        )
      );
    }
  );

  const openReview = (request, nextDecision) => {
    setSelectedRequest(request);
    setDecision(nextDecision);
    setAdminNote("");
    setProofUrl("");
    setProofError("");
    setNotice("");
  };

  const closeReview = () => {
    if (reviewing || proofLoading) return;

    setSelectedRequest(null);
    setDecision("");
    setAdminNote("");
    setProofUrl("");
    setProofError("");
  };

  const openPaymentProof = async () => {
    const path = selectedRequest?.payment_proof_path;

    if (!path) {
      setProofError("No payment proof was uploaded for this request.");
      return;
    }

    setProofLoading(true);
    setProofError("");
    setProofUrl("");

    try {
      const { data, error: storageError } = await supabase.storage
        .from(PROOF_BUCKET)
        .createSignedUrl(path, 60 * 5);

      if (storageError) throw storageError;

      if (!data?.signedUrl) {
        throw new Error("Could not create a temporary payment-proof link.");
      }

      setProofUrl(data.signedUrl);
    } catch (err) {
      console.error("Payment proof loading error:", err);
      setProofError(
        `${getErrorMessage(err)} Check that your admin Storage policy permits reading payment proofs.`
      );
    } finally {
      setProofLoading(false);
    }
  };

  const submitReview = async () => {
    if (!selectedRequest || !decision) return;

    if (selectedRequest.status !== "pending") {
      setError("This request is no longer pending. Refresh the page.");
      closeReview();
      return;
    }

    if (decision === "rejected" && !adminNote.trim()) {
      setProofError("Please enter a reason for rejecting this payment.");
      return;
    }

    setReviewing(true);
    setError("");
    setProofError("");
    setNotice("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "admin_review_subscription_request",
        {
          p_request_id: selectedRequest.id,
          p_decision: decision,
          p_admin_note: adminNote.trim() || null,
        }
      );

      if (rpcError) throw rpcError;

      if (!data?.success) {
        throw new Error(
          data?.message || "The review could not be completed."
        );
      }

      setNotice(
        decision === "approved"
          ? "Payment approved. The subscription has been activated."
          : "Payment request rejected."
      );

      setSelectedRequest(null);
      setDecision("");
      setAdminNote("");
      setProofUrl("");

      await loadData(true);
    } catch (err) {
      console.error("Subscription review error:", err);
      setError(getErrorMessage(err));
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#007EB8]">
            <ShieldCheck size={17} />
            ADMIN CONTROL CENTER
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#10233F] sm:text-3xl">
            Subscription Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Verify UPI payments, manage subscription requests, and review
            premium access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 size={19} />
          <span>{notice}</span>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={loading ? "—" : pendingCount}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Approved Payments"
          value={loading ? "—" : approvedCount}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Rejected Payments"
          value={loading ? "—" : rejectedCount}
          icon={XCircle}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="Currently Active"
          value={loading ? "—" : activeCount}
          icon={CreditCard}
          color="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Plans */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-extrabold text-[#10233F]">
          Available Subscription Plans
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <div>
                <p className="font-bold text-gray-800">{plan.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {plan.duration_months} month
                  {plan.duration_months === 1 ? "" : "s"} ·{" "}
                  {plan.is_active ? "Available" : "Inactive"}
                </p>
              </div>

              <p className="text-lg font-black text-[#003B82]">
                {formatCurrency(plan.price_inr)}
              </p>
            </div>
          ))}

          {!loading && plans.length === 0 && (
            <p className="text-sm text-gray-500">
              No subscription plans found.
            </p>
          )}
        </div>
      </section>

      {/* Tabs and search */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                activeTab === "requests"
                  ? "bg-[#003B82] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Payment Requests
              {pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs text-gray-900">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("subscriptions")}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                activeTab === "subscriptions"
                  ? "bg-[#003B82] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Subscription History
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, UPI reference..."
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />
            </div>

            {activeTab === "requests" && (
              <div className="relative sm:w-52">
                <Filter
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-[#009FE3]"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 px-5 py-16 text-sm text-gray-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading subscription data...
          </div>
        ) : activeTab === "requests" ? (
          filteredRequests.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <CreditCard
                size={35}
                className="mx-auto text-gray-300"
              />
              <p className="mt-3 font-bold text-gray-700">
                No payment requests found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try changing the status filter or search.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRequests.map((request) => (
                <article key={request.id} className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-[#10233F]">
                          {request.profile?.full_name ||
                            "User name unavailable"}
                        </h3>
                        <StatusBadge status={request.status} />
                      </div>

                      <p className="mt-1 break-all text-sm text-gray-500">
                        {request.profile?.email || request.user_id}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <p className="text-xs text-gray-400">Plan</p>
                          <p className="mt-1 text-sm font-bold text-gray-800">
                            {request.plan?.name || "Unknown plan"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            Payment amount
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-[#003B82]">
                            {formatCurrency(request.amount_inr)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            UPI reference
                          </p>
                          <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                            {request.upi_reference}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            Submitted
                          </p>
                          <p className="mt-1 text-sm text-gray-700">
                            {formatDate(request.created_at)}
                          </p>
                        </div>

                        {request.reviewed_at && (
                          <div>
                            <p className="text-xs text-gray-400">
                              Reviewed
                            </p>
                            <p className="mt-1 text-sm text-gray-700">
                              {formatDate(request.reviewed_at)}
                            </p>
                          </div>
                        )}
                      </div>

                      {request.admin_note && (
                        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                          <span className="font-bold">Admin note: </span>
                          {request.admin_note}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
                      {request.payment_proof_path ? (
                        <button
                          type="button"
                          onClick={() =>
                            openReview(request, "view")
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                        >
                          <FileImage size={17} />
                          View proof
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5 text-xs font-semibold text-gray-500">
                          <AlertCircle size={15} />
                          No proof uploaded
                        </span>
                      )}

                      {request.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              openReview(request, "approved")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openReview(request, "rejected")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : filteredSubscriptions.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <CreditCard size={35} className="mx-auto text-gray-300" />
            <p className="mt-3 font-bold text-gray-700">
              No subscriptions found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSubscriptions.map((subscription) => {
              const isExpired =
                new Date(subscription.expires_at).getTime() <=
                Date.now();

              const displayStatus =
                subscription.status === "active" && isExpired
                  ? "expired"
                  : subscription.status;

              return (
                <article
                  key={subscription.id}
                  className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[#10233F]">
                        {subscription.profile?.full_name ||
                          "User name unavailable"}
                      </h3>
                      <StatusBadge status={displayStatus} />
                    </div>

                    <p className="mt-1 break-all text-sm text-gray-500">
                      {subscription.profile?.email ||
                        subscription.user_id}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-gray-700">
                      {subscription.plan?.name || "Unknown plan"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Starts: {formatDate(subscription.starts_at)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Expires: {formatDate(subscription.expires_at)}
                    </p>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Created {formatDate(subscription.created_at)}</p>
                    <p className="mt-1 break-all text-xs">
                      Request: {subscription.request_id}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Review modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#06152D]/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReview();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-review-title"
            className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <div>
                <h2
                  id="subscription-review-title"
                  className="text-lg font-black text-[#10233F]"
                >
                  {decision === "view"
                    ? "Payment proof"
                    : decision === "approved"
                    ? "Approve payment"
                    : "Reject payment"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedRequest.profile?.full_name ||
                    selectedRequest.profile?.email ||
                    selectedRequest.user_id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReview}
                disabled={reviewing || proofLoading}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="text-xs text-gray-500">Plan</p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {selectedRequest.plan?.name || "Unknown plan"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="mt-1 text-sm font-extrabold text-[#003B82]">
                    {formatCurrency(selectedRequest.amount_inr)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">UPI reference</p>
                  <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                    {selectedRequest.upi_reference}
                  </p>
                </div>
              </div>

              {selectedRequest.payment_proof_path && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={openPaymentProof}
                    disabled={proofLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {proofLoading ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <FileImage size={17} />
                    )}
                    {proofLoading
                      ? "Opening proof..."
                      : proofUrl
                      ? "Refresh proof link"
                      : "Open payment proof"}
                  </button>

                  {proofUrl && (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-500">
                          Temporary secure link · expires in 5 minutes
                        </p>
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#007EB8]"
                        >
                          Open <ExternalLink size={13} />
                        </a>
                      </div>

                      <iframe
                        title="Payment proof preview"
                        src={proofUrl}
                        className="h-[420px] w-full bg-gray-100"
                      />
                    </div>
                  )}

                  {proofError && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {proofError}
                    </p>
                  )}
                </div>
              )}

              {decision !== "view" && (
                <>
                  <div>
                    <label
                      htmlFor="admin-note"
                      className="mb-2 block text-sm font-bold text-gray-700"
                    >
                      Admin note{" "}
                      {decision === "rejected" ? "(required)" : "(optional)"}
                    </label>

                    <textarea
                      id="admin-note"
                      value={adminNote}
                      onChange={(event) => setAdminNote(event.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder={
                        decision === "rejected"
                          ? "Explain why the payment was rejected..."
                          : "Add an internal review note..."
                      }
                      disabled={reviewing}
                      className="w-full resize-y rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10 disabled:bg-gray-50"
                    />
                  </div>

                  <div
                    className={`rounded-xl p-3 text-sm ${
                      decision === "approved"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {decision === "approved"
                      ? "Approval activates the subscription immediately using the plan duration configured in your database. Verify the payment before proceeding."
                      : "Rejection will mark this request as rejected. The user will not receive a subscription from this request."}
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeReview}
                      disabled={reviewing}
                      className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={
                        reviewing ||
                        selectedRequest.status !== "pending" ||
                        (decision === "rejected" && !adminNote.trim())
                      }
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                        decision === "approved"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {reviewing ? (
                        <>
                          <LoaderCircle
                            size={17}
                            className="animate-spin"
                          />
                          Processing...
                        </>
                      ) : decision === "approved" ? (
                        <>
                          <CheckCircle2 size={17} />
                          Confirm approval
                        </>
                      ) : (
                        <>
                          <XCircle size={17} />
                          Confirm rejection
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
