import { ChevronRight } from "lucide-react";
import { useI18n } from "../context/I18nContext";

export default function PageHeader({ title, subtitle, current }) {
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <nav className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
        <span>{t("crumbs.home")}</span>
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="text-[#E4572E] font-bold">{current || title}</span>
      </nav>
      {title && <h2 className="text-2xl sm:text-3xl font-display font-normal tracking-tight text-[var(--fg)]">{title}</h2>}
      {subtitle && <p className="mt-1 text-sm text-[var(--fg-muted)]">{subtitle}</p>}
    </div>
  );
}
