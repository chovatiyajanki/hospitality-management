import { Inbox } from "lucide-react";
import { Card } from "./Card";
import { cn } from "../../lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  action,
  className,
}) {
  return (
    <Card className={cn("p-8 sm:p-12 text-center", className)}>
      <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CFE0F3]/40 text-[#183D6D] border border-[#CFE0F3]">
        <Icon className="h-7 w-7" strokeWidth={1.8} />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[var(--fg)]">
        {title}
      </h3>
      {body && (
        <p className="mx-auto mt-1.5 max-w-sm text-xs sm:text-sm text-[var(--fg-muted)] leading-relaxed">
          {body}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
}
