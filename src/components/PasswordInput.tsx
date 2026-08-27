import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Input kata sandi dengan tombol mata (tampilkan/sembunyikan).
 *  Dipakai di semua tempat pengisian kata sandi agar perilakunya seragam. */
export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  autoFocus,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          paddingRight: 42,
          borderColor: invalid ? "var(--status-failed)" : undefined,
          boxShadow: invalid ? "0 0 0 3px rgba(220,38,38,0.12)" : undefined,
        }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          border: 0,
          borderRadius: 8,
          background: "transparent",
          color: "var(--ink-soft)",
          cursor: "pointer",
        }}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
