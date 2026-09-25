import { useState, useEffect, useRef } from "react";
import { Bell, ShieldCheck, Check, Clock, AlertCircle } from "lucide-react";
import { notificationsApi } from "../../api/notifications";
import { authApi } from "../../api/auth";
import { useLanguage } from "../../context/LanguageContext";

export default function NotificationBell() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const backoffRef = useRef(10000);

  useEffect(() => {
    let timerId = null;
    let isCancelled = false;

    async function poll() {
      if (!authApi.hasToken()) {
        // Do not poll if user is not authenticated
        timerId = setTimeout(poll, 30000);
        return;
      }
      try {
        const fetchFn = notificationsApi?.getNotifications || notificationsApi?.listNotifications;
        if (fetchFn) {
          const res = await fetchFn(10);
          if (!isCancelled && res?.notifications) {
            setNotifications(res.notifications);
            setUnreadCount(res.unread_count || 0);
            backoffRef.current = 15000; // reset to 15s on success
          }
        }
      } catch (err) {
        // Exponential backoff on error, cap at 60s
        backoffRef.current = Math.min(backoffRef.current * 2, 60000);
      } finally {
        if (!isCancelled) {
          timerId = setTimeout(poll, backoffRef.current);
        }
      }
    }

    poll();
    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  async function handleMarkRead(id, e) {
    e?.stopPropagation?.();
    try {
      const markFn = notificationsApi?.markRead || notificationsApi?.markAsRead;
      if (markFn) await markFn(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  }

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="nav-btn"
        title={t("notifications.bell_title", "Notifications & Security Alerts")}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px",
          cursor: "pointer",
          background: open ? "var(--bg-surface-alt)" : "transparent",
        }}
      >
        <Bell size={17} color="var(--text-primary)" />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              color: "#fff",
              fontSize: "0.62rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "360px",
            maxHeight: "440px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 14px 30px rgba(0, 0, 0, 0.5)",
            padding: 0,
            zIndex: 9999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 14px",
              background: "var(--bg-surface-alt)",
              borderBottom: "1px solid var(--border-default)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>
              {t("notifications.feed_title", "In-App Security & Health Feed")}
            </strong>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {t("notifications.unread_count", `${unreadCount} Unread`, { count: unreadCount })}
            </span>
          </div>

          {/* Anti-Phishing Security Notice (Module L & P) */}
          <div
            style={{
              padding: "6px 12px",
              background: "rgba(14, 165, 233, 0.08)",
              borderBottom: "1px solid var(--border-default)",
              fontSize: "0.68rem",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ShieldCheck size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>{t("notifications.anti_phishing", "Anti-Phishing: Verified alerts always reference your secure in-app portal.")}</span>
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: "auto", maxHeight: "340px", display: "flex", flexDirection: "column" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                {t("notifications.no_notifications", "No notifications to display.")}
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.is_read;
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border-default)",
                      background: isUnread ? "rgba(14, 165, 233, 0.04)" : "transparent",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: isUnread ? "var(--primary)" : "var(--text-primary)" }}>
                        {n.title}
                      </span>
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkRead(n.id, e)}
                          title={t("notifications.mark_read", "Mark as read")}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "2px",
                          }}
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    {n.reference_code && (
                      <span style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        Ref: {n.reference_code}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
