import { useLanguage } from "../../context/LanguageContext";

export default function EmptyState({ title, description, actionLabel, onAction }) {
  const { t } = useLanguage();
  return (
    <section className="empty-state" aria-live="polite">
      <p className="empty-state-kicker">{t("empty_state.kicker", "Nothing here yet")}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {onAction && <button type="button" className="action-btn primary" onClick={onAction}>{actionLabel}</button>}
    </section>
  );
}
