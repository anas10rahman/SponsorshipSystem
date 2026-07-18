import { formatThousands, parseDigits } from "@/lib/format";

/** Input nominal rupiah dengan format ribuan otomatis saat mengetik.
 *  Menyimpan angka murni (number) ke atas, menampilkan "Rp 5.000.000". */
export function CurrencyInput({
  value,
  onChange,
  placeholder,
  className,
  style,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", ...style }}>
      <span
        style={{
          position: "absolute",
          left: 12,
          fontSize: "var(--text-base)",
          color: "var(--ink-500)",
          pointerEvents: "none",
        }}
      >
        Rp
      </span>
      <input
        className={className ?? "sh-input"}
        style={{ width: "100%", paddingLeft: 34 }}
        inputMode="numeric"
        value={formatThousands(value)}
        onChange={(e) => onChange(parseDigits(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  );
}
