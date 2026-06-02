import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

export function Modal({ open, onClose, title, children, footer, width }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="sh-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="sh-modal" style={width ? { width } : undefined}>
        <header className="sh-modal__header">
          <h3>{title}</h3>
          <button
            className="sh-btn sh-btn--ghost sh-btn--icon"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </header>
        <div className="sh-modal__body">{children}</div>
        {footer && <footer className="sh-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
