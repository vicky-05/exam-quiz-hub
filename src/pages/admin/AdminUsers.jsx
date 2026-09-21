import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  RefreshCw,
  Clock,
} from "lucide-react";

import { supabase } from "../../services/supabase";

function AdminUsers() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const { data, error: usersError } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, status, role, created_at, updated_at"
        )
        .order("created_at", { ascending: false });

      if (usersError) {
        throw usersError;
      }

      setUsers(data || []);
    } catch (err) {
      console.error("Users loading failed:", err);

      setError(
        err?.message || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUserStatus(userId, newStatus) {
    try {
      setActionLoading(`${userId}-${newStatus}`);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : user
        )
      );

      setSuccess(
        newStatus === "approved"
          ? "User approved successfully."
          : "User rejected successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("User status update failed:", err);

      setError(
        err?.message ||
          "Unable to update user status."
      );
    } finally {
      setActionLoading("");
    }
  }

  const filteredUsers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        filter === "all" || user.status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      return (
        (user.full_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (user.email || "")
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [users, search, filter]);

  const counts = {
    total: users.length,
    pending: users.filter(
      (user) => user.status === "pending"
    ).length,
    approved: users.filter(
      (user) => user.status === "approved"
    ).length,
    rejected: users.filter(
      (user) => user.status === "rejected"
    ).length,
  };

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getInitial(user) {
    return (
      user.full_name ||
      user.email ||
      "U"
    )
      .charAt(0)
      .toUpperCase();
  }

  function getStatusBadge(status) {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
          <CheckCircle2 size={13} />
          Approved
        </span>
      );
    }

    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
          <Clock size={13} />
          Pending
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
          <XCircle size={13} />
          Rejected
        </span>
      );
    }

    return (
      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
        {status || "Unknown"}
      </span>
    );
  }

  function getRoleBadge(role) {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#003B82]">
          <ShieldCheck size={13} />
          Admin
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
        <User size={13} />
        User
      </span>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: counts.total,
      icon: Users,
      bg: "bg-blue-50",
      color: "text-[#003B82]",
    },
    {
      label: "Pending",
      value: counts.pending,
      icon: Clock,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      label: "Approved",
      value: counts.approved,
      icon: UserCheck,
      bg: "bg-green-50",
      color: "text-green-600",
    },
    {
      label: "Rejected",
      value: counts.rejected,
      icon: UserX,
      bg: "bg-red-50",
      color: "text-red-600",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-3xl bg-white shadow-sm" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>

        <div className="h-[500px] animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#009FE3]">
              Management
            </p>

            <h1 className="mt-1 text-2xl font-extrabold text-[#10233F] sm:text-3xl">
              Users
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage registrations, approvals and user access.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#003B82] shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </section>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <XCircle size={18} />
          {error}
        </div>
      )}

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {card.label}
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-[#10233F]">
                    {card.value.toLocaleString("en-IN")}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg}`}
                >
                  <Icon size={21} className={card.color} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* User Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:bg-white focus:ring-2 focus:ring-[#009FE3]/10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["pending", "Pending"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    filter === value
                      ? "bg-[#003B82] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
          Showing{" "}
          <span className="font-bold text-[#10233F]">
            {filteredUsers.length}
          </span>{" "}
          of{" "}
          <span className="font-bold text-[#10233F]">
            {users.length}
          </span>{" "}
          users
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users
                size={42}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-bold text-[#10233F]">
                No users found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-4">
                    User
                  </th>

                  <th className="px-5 py-4">
                    Email
                  </th>

                  <th className="px-5 py-4">
                    Role
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Registered
                  </th>

                  <th className="px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5FF] text-sm font-extrabold text-[#003B82]">
                          {getInitial(user)}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-bold text-[#10233F]">
                            {user.full_name || "No name"}
                          </div>

                          <div className="mt-0.5 text-xs text-slate-400">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">
                        {user.email || "—"}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {getStatusBadge(user.status)}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {user.status !== "approved" &&
                          user.role !== "admin" && (
                            <button
                              type="button"
                              disabled={
                                actionLoading ===
                                `${user.id}-approved`
                              }
                              onClick={() =>
                                updateUserStatus(
                                  user.id,
                                  "approved"
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} />
                              {actionLoading ===
                              `${user.id}-approved`
                                ? "..."
                                : "Approve"}
                            </button>
                          )}

                        {user.status !== "rejected" &&
                          user.role !== "admin" && (
                            <button
                              type="button"
                              disabled={
                                actionLoading ===
                                `${user.id}-rejected`
                              }
                              onClick={() =>
                                updateUserStatus(
                                  user.id,
                                  "rejected"
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <XCircle size={14} />
                              {actionLoading ===
                              `${user.id}-rejected`
                                ? "..."
                                : "Reject"}
                            </button>
                          )}

                        {user.role === "admin" && (
                          <span className="px-3 py-2 text-xs font-semibold text-slate-400">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminUsers;