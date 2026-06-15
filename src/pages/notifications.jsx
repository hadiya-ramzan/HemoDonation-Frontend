import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const typeStyles = {
  request: "border-red-400/20 bg-red-500/10 text-red-200",
  donation: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  admin: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  system: "border-blue-400/20 bg-blue-500/10 text-blue-200",
};

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const backPath = getBackPath();

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => Number(item.is_read) === 0);
    }

    if (filter === "read") {
      return notifications.filter((item) => Number(item.is_read) === 1);
    }

    return notifications;
  }, [filter, notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notifications");
      setNotifications(Array.isArray(res.data?.notifications) ? res.data.notifications : []);
      setUnreadCount(Number(res.data?.unread_count || 0));
      setNotice("");
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
      setNotice("No notifications available right now. New blood request alerts will appear here automatically.");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (notification) => {
    try {
      if (Number(notification.is_read) === 1) {
        if (notification.link) navigate(notification.link);
        return;
      }

      await API.patch(`/notifications/${notification.id}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, is_read: 1 } : item))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));

      if (notification.link) navigate(notification.link);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to update notification.");
    }
  };

  const markAllRead = async () => {
    try {
      await API.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: 1 })));
      setUnreadCount(0);
      setNotice("All notifications marked as read.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to update notifications.");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#050914] text-white">
      <div className="fixed inset-0 pointer-events-none soft-grid opacity-30" />
      <div className="fixed -top-32 -left-32 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
      <div className="fixed top-48 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050914]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate(backPath)} className="text-left">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Hemo<span className="text-red-500">Donation</span>
            </h1>
            <p className="hidden text-xs text-slate-400 sm:block">Notifications center</p>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              Refresh
            </button>
            <Link
              to={backPath}
              className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-500"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111827]/95 to-[#0b1220]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-200">
                <span className="h-2 w-2 rounded-full bg-red-400" /> Live Alerts
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Notifications</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Track request alerts, donor responses and completed donation updates in one place.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-black/25 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Unread</p>
              <p className="mt-2 text-5xl font-black text-red-300">{unreadCount}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["unread", "Unread"],
              ["read", "Read"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                  filter === value
                    ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                    : "border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-black text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>

        {notice && (
          <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
            {notice}
          </div>
        )}

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#0d1421]/90 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-red-500/10 text-3xl">🔕</div>
              <h3 className="mt-5 text-xl font-black">No notifications found</h3>
              <p className="mt-2 text-sm text-slate-400">New blood requests and donation updates will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} item={notification} onOpen={() => markRead(notification)} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function NotificationCard({ item, onOpen }) {
  const isUnread = Number(item.is_read) === 0;
  const style = typeStyles[item.type] || typeStyles.system;

  return (
    <button
      onClick={onOpen}
      className={`w-full rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.07] ${
        isUnread ? "border-red-400/30 bg-red-500/[0.08]" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isUnread && <span className="h-2.5 w-2.5 rounded-full bg-red-400" />}
            <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${style}`}>
              {item.type || "system"}
            </span>
            <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
            {Number(item.priority_score || 0) > 0 && (
              <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-red-200">
                Priority {item.priority_score}%
              </span>
            )}
          </div>
          <h3 className="mt-3 text-lg font-black text-white">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.message}</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-slate-200">
          {isUnread ? "Open" : "View"}
        </span>
      </div>
    </button>
  );
}

function getBackPath() {
  try {
    const activeMode = localStorage.getItem("activeMode");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user.role === "admin") return "/admin";
    if (activeMode === "donor") return "/donor";
    if (activeMode === "recipient") return "/recipient";
    if (user.role === "donor") return "/donor";
    if (user.role === "recipient") return "/recipient";
    return "/";
  } catch {
    return "/";
  }
}

function formatDate(value) {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default Notifications;
