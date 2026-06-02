import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHead({ title, subtitle, actions }: Props) {
  return (
    <div className="sh-page-head">
      <div className="sh-page-head__title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="sh-page-head__actions">{actions}</div>}
    </div>
  );
}
