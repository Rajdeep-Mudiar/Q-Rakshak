import { useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = "QRakshak Medical Platform | Page Not Found";
  }, []);

  return (
    <main className="not-found-page" style={{ maxWidth: "600px", margin: "80px auto", textAlign: "center", padding: "40px 24px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)" }}>
      <div className="not-found-mark" style={{ fontSize: "3.5rem", fontWeight: 900, color: "var(--primary)", fontFamily: "var(--font-mono)", marginBottom: "8px" }}>404</div>
      <span className="step-badge" style={{ marginBottom: "12px", display: "inline-block" }}>{t("not_found.badge", "CLINICAL ROUTE UNAVAILABLE")}</span>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--ink-primary)", margin: "8px 0 12px" }}>{t("not_found.title", "Page Not Found")}</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "24px" }}>
        {t("not_found.desc", "The requested clinical resource, encounter URL, or platform view may have moved or is temporarily restricted.")}
      </p>
      <a className="btn-primary" href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", margin: "0 auto" }}>
        {t("not_found.return_home", "Return to QRakshak Clinical Platform")}
      </a>
    </main>
  );
}
