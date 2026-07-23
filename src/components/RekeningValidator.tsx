import { useState } from "react";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { validateAccount, composeAccount, extractNumber } from "@/lib/bankValidate";

/** Input nomor rekening + tombol Validasi (mock name-inquiry).
 *  Sukses → tampil Bank + Nama pemilik, dan `onChange` diisi string tersimpan.
 *  Gagal → pesan "Nomor rekening salah atau tidak terdaftar" + border merah. */
export function RekeningValidator({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean; // paksa border merah dari validasi form luar
}) {
  const [number, setNumber] = useState(() => extractNumber(value));
  const [result, setResult] = useState<{ bank: string; owner: string } | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const validate = () => {
    const digits = number.replace(/\D/g, "");
    if (!digits) {
      setError("Masukkan nomor rekening dulu.");
      setResult(null);
      onChange("");
      return;
    }
    setChecking(true);
    // Simulasikan jeda cek (biar terasa seperti panggilan API).
    setTimeout(() => {
      const info = validateAccount(digits);
      setChecking(false);
      if (!info) {
        setError("Nomor rekening salah atau tidak terdaftar");
        setResult(null);
        onChange("");
        return;
      }
      setError("");
      setResult(info);
      onChange(composeAccount(info.bank, digits, info.owner));
    }, 500);
  };

  const showError = !!error || invalid;

  return (
    <div>
      <div className="sh-row" style={{ gap: 8, alignItems: "stretch" }}>
        <input
          className="sh-input"
          inputMode="numeric"
          style={{
            flex: 1,
            borderColor: showError ? "var(--status-failed)" : undefined,
            boxShadow: showError ? "0 0 0 3px rgba(220,38,38,0.12)" : undefined,
          }}
          value={number}
          onChange={(e) => {
            setNumber(e.target.value.replace(/\D/g, ""));
            setError("");
            setResult(null);
            onChange(""); // reset sampai divalidasi ulang
          }}
          placeholder="Nomor rekening"
        />
        <button
          type="button"
          className="sh-btn sh-btn--secondary"
          onClick={validate}
          disabled={checking}
          style={{ flex: "none" }}
        >
          <ShieldCheck size={16} />
          {checking ? "Memeriksa…" : "Validasi"}
        </button>
      </div>

      {result && (
        <div
          className="sh-row"
          style={{
            gap: 10,
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--canvas-tint)",
          }}
        >
          <CheckCircle2 size={18} style={{ color: "var(--status-success)", flex: "none" }} />
          <div style={{ fontSize: 13 }}>
            <div>
              Bank: <strong>{result.bank}</strong>
            </div>
            <div>
              Nama pemilik: <strong>{result.owner}</strong>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="sh-row"
          style={{ gap: 6, marginTop: 6, color: "var(--status-failed)", fontSize: 13 }}
        >
          <AlertCircle size={14} /> {error}
        </div>
      )}
    </div>
  );
}
