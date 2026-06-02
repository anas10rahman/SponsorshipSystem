import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

type Props = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { direction: "up" | "down"; label: string };
};

export function StatCard({ label, value, icon, trend }: Props) {
  return (
    <div className="sh-stat">
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="sh-stat__label">{label}</div>
        <div className="sh-stat__value tabular">{value}</div>
        {trend && (
          <div
            className={`sh-stat__trend${trend.direction === "down" ? " sh-stat__trend--down" : ""}`}
          >
            {trend.direction === "up" ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            {trend.label}
          </div>
        )}
      </div>
      {icon && <span className="sh-stat__icon">{icon}</span>}
    </div>
  );
}
