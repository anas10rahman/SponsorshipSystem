import type { ReactNode } from "react";

type Props = { title: string; description?: string; action?: ReactNode };

export function Empty({ title, description, action }: Props) {
  return (
    <div className="sh-empty">
      <div className="sh-empty__title">{title}</div>
      {description && <p style={{ color: "var(--ink-500)" }}>{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
