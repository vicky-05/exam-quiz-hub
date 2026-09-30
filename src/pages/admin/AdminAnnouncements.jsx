import React, { useEffect, useState } from "react";
import {
  Bell,
  Send,
  RefreshCw,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

export default function AdminAnnouncements() {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /* =========================================================
     LOAD ANNOUNCEMENTS
  ========================================================= */

  async function loadAnnouncements() {
    try {
      setLoadingHistory(true);

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          title,
          message,
          link,
          created_at,
          metadata
        `)
        .eq("category", "announcement")
        .eq("type", "announcement")
        .order("created_at", {
          ascending: false,
        })
        .limit(100);

      if (error) throw error;

      /*
       * One announcement creates one notification
       * for every approved user.
       *
       * Group those notifications using announcement_id.
       */

      const grouped = [];
      const seen = new Set();

      for (const item of data || []) {
        const announcementId =
          item.metadata?.announcement_id || item.id;

        if (seen.has(announcementId)) continue;

        seen.add(announcementId);

        grouped.push({
          id: item.id,
          announcement_id: announcementId,
          title: item.title,
          message: item.message,
          link: item.link,
          created_at: item.created_at,
          recipient_count:
            item.metadata?.recipient_count || 0,
        });
      }

      setRecentAnnouncements(grouped);
    } catch (err) {
      console.error(
        "Failed to load announcements:",
        err
      );

      setError(
        err?.message ||
          "Unable to load announcements."
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  /* =========================================================
     SEND ANNOUNCEMENT
  ========================================================= */

  async function handleSendAnnouncement(event) {
    event.preventDefault();

    setSuccess("");
    setError("");

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    const cleanLink = link.trim();

    if (!cleanTitle) {
      setError(
        "Please enter an announcement title."
      );
      return;
    }

    if (!cleanMessage) {
      setError(
        "Please enter an announcement message."
      );
      return;
    }

    try {
      setSending(true);

      /*
       * Get all approved normal users.
       */

      const { data: users, error: usersError } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("status", "approved")
          .eq("role", "user");

      if (usersError) throw usersError;

      if (!users?.length) {
        setError(
          "No approved users are available."
        );
        return;
      }

      const announcementId =
        crypto.randomUUID();

      const notifications = users.map(
        (recipient) => ({
          user_id: recipient.id,
          category: "announcement",
          type: "announcement",
          title: cleanTitle,
          message: cleanMessage,
          icon: "📢",
          link: cleanLink || null,
          is_read: false,

          metadata: {
            announcement_id: announcementId,
            created_by: user?.id || null,
            recipient_count: users.length,
          },
        })
      );

      /*
       * Insert in batches.
       */

      const batchSize = 500;

      for (
        let i = 0;
        i < notifications.length;
        i += batchSize
      ) {
        const batch = notifications.slice(
          i,
          i + batchSize
        );

        const { error: insertError } =
          await supabase
            .from("notifications")
            .insert(batch);

        if (insertError) throw insertError;
      }

      setTitle("");
      setMessage("");
      setLink("");

      setSuccess(
        `Announcement sent successfully to ${
          users.length
        } approved user${
          users.length === 1 ? "" : "s"
        }.`
      );

      await loadAnnouncements();
    } catch (err) {
      console.error(
        "Announcement failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to send announcement. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  /* =========================================================
     DELETE ANNOUNCEMENT
  ========================================================= */

  async function handleDeleteAnnouncement() {
    if (!deleteTarget) return;

    setSuccess("");
    setError("");

    try {
      setDeleting(true);

      /*
       * Delete every notification belonging
       * to this announcement.
       */

      const { error: deleteError } =
        await supabase
          .from("notifications")
          .delete()
          .eq(
            "category",
            "announcement"
          )
          .eq(
            "type",
            "announcement"
          )
          .filter(
            "metadata->>announcement_id",
            "eq",
            deleteTarget.announcement_id
          );

      if (deleteError) {
        throw deleteError;
      }

      setDeleteTarget(null);

      setSuccess(
        "Announcement deleted successfully."
      );

      await loadAnnouncements();
    } catch (err) {
      console.error(
        "Delete announcement failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete announcement."
      );
    } finally {
      setDeleting(false);
    }
  }

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#003B82] to-[#0067B8] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-100">
              <Megaphone size={17} />

              Announcement Center
            </div>

            <h1 className="text-2xl font-extrabold sm:text-3xl">
              Send Announcements
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Send important updates and study
              announcements directly to approved users.
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Bell size={26} />
          </div>
        </div>
      </section>

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{success}</span>
        </div>
      )}

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto shrink-0 rounded-lg p-1 transition hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =====================================================
          CREATE ANNOUNCEMENT
      ====================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-[#10233F]">
            Create Announcement
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            This will appear in the notification bell
            of all approved users.
          </p>
        </div>

        <form
          onSubmit={handleSendAnnouncement}
          className="space-y-5"
        >
          {/* TITLE */}

          <div>
            <label className="mb-2 block text-sm font-bold text-[#10233F]">
              Announcement Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Example: New TNPSC AO Test Series Available"
              maxLength={150}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10"
            />
          </div>

          {/* MESSAGE */}

          <div>
            <label className="mb-2 block text-sm font-bold text-[#10233F]">
              Message
            </label>

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Write your announcement..."
              rows={5}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 outline-none transition focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10"
            />

            <div className="mt-1 text-right text-[11px] font-semibold text-slate-400">
              {message.length}/1000
            </div>
          </div>

          {/* LINK */}

          <div>
            <label className="mb-2 block text-sm font-bold text-[#10233F]">
              Link
              <span className="ml-1 font-medium text-slate-400">
                (Optional)
              </span>
            </label>

            <input
              type="text"
              value={link}
              onChange={(event) =>
                setLink(event.target.value)
              }
              placeholder="Example: /dashboard"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10"
            />
          </div>

          {/* PREVIEW */}

          <div className="rounded-2xl border border-[#009FE3]/15 bg-[#F7F9FC] p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#A56A00]">
              Notification Preview
            </p>

            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF7FF] text-xl">
                📢
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-black text-[#10233F]">
                  {title.trim() ||
                    "Announcement Title"}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {message.trim() ||
                    "Your announcement message will appear here."}
                </p>
              </div>
            </div>
          </div>

          {/* SEND */}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003B82] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#002E66] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />

                  Sending...
                </>
              ) : (
                <>
                  <Send size={17} />

                  Send Announcement
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          RECENT ANNOUNCEMENTS
      ====================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#10233F]">
              Recent Announcements
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Previously sent announcements.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnnouncements}
            disabled={loadingHistory}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <RefreshCw
              size={17}
              className={
                loadingHistory
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>

        {/* LOADING */}

        {loadingHistory ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : recentAnnouncements.length ===
          0 ? (
          /* EMPTY */

          <div className="mt-6 rounded-2xl bg-[#F7F9FC] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF7FF]">
              <Megaphone
                size={22}
                className="text-[#009FE3]"
              />
            </div>

            <p className="mt-3 font-semibold text-gray-700">
              No announcements yet
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Sent announcements will appear here.
            </p>
          </div>
        ) : (
          /* LIST */

          <div className="mt-6 space-y-3">
            {recentAnnouncements.map(
              (announcement) => (
                <div
                  key={
                    announcement.announcement_id
                  }
                  className="rounded-2xl border border-slate-100 p-4 transition hover:border-[#009FE3]/20 hover:bg-[#F7F9FC]"
                >
                  <div className="flex gap-3">
                    {/* ICON */}

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF7FF] text-lg">
                      📢
                    </div>

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-[#10233F]">
                            {announcement.title}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {announcement.message}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                            <span>
                              {formatDate(
                                announcement.created_at
                              )}
                            </span>

                            {announcement.recipient_count >
                              0 && (
                              <>
                                <span>•</span>

                                <span>
                                  Sent to{" "}
                                  {
                                    announcement.recipient_count
                                  }{" "}
                                  users
                                </span>
                              </>
                            )}

                            {announcement.link && (
                              <>
                                <span>•</span>

                                <span className="text-[#009FE3]">
                                  Link included
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* DELETE BUTTON */}

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget(
                              announcement
                            )
                          }
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-200 hover:bg-red-100"
                        >
                          <Trash2 size={15} />

                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                  <Trash2
                    size={20}
                    className="text-red-600"
                  />
                </div>

                <h3 className="mt-4 text-lg font-extrabold text-[#10233F]">
                  Delete Announcement?
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  This will remove this announcement
                  from all users' notification lists.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>
            </div>

            {/* ANNOUNCEMENT */}

            <div className="mx-6 my-5 rounded-2xl bg-[#F7F9FC] p-4">
              <p className="text-sm font-extrabold text-[#10233F]">
                {deleteTarget.title}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {deleteTarget.message}
              </p>
            </div>

            {/* ACTIONS */}

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteAnnouncement
                }
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />

                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />

                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}