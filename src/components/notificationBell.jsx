import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await API.get("/notifications/unread-count");
        if (mounted) {
          setCount(Number(res.data?.unread_count || 0));
        }
      } catch (error) {
        if (mounted) setCount(0);
      }
    };

    fetchCount();
    const interval = window.setInterval(fetchCount, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <Link
      to="/notifications"
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
      title="Notifications"
    >
      🔔
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-lg shadow-red-950/40">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

export default NotificationBell;
