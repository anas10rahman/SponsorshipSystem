import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import {
  BANKS,
  composeAccount,
  extractBank,
  extractNumber,
  extractOwner,
  validateAccountNumber,
} from "@/lib/bankValidate";

/** Input rekening pencairan: pilih bank + nomor (diketik dua kali) + nama pemilik.
 *
 *  Disengaja TIDAK mengklaim "terverifikasi": tanpa API name-inquiry berbayar,
 *  sistem tidak mungkin tahu nama pemilik rekening sebenarnya. Yang dilakukan
 *  di sini adalah menangkap salah ketik (format & ketik ulang); kecocokan nama
 *  pemilik diperiksa admin lewat dokumen saat verifikasi organisasi. */
export function RekeningValidator({
  value,
  onChange,
  invalid,
  ownerHint,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean; // paksa border merah dari validasi form luar
  ownerHint?: string; // nama organisasi — dipakai sebagai isian awal pemilik
}) {
  const [bank, setBank] = useState(() => extractBank(value));
  const [number, setNumber] = useState(() => extractNumber(value));
  const [confirm, setConfirm] = useState(() => extractNumber(value));
  const [owner, setOwner] = useState(() => extractOwner(value) || ownerHint?.trim() || "");
  const [touched, setTouched] = useState(false);

  const formatError = validateAccountNumber(bank, number);
  const mismatch = confirm.length > 0 && number !== confirm;
  const ownerMissing = owner.trim().length < 3;
  const ok = !formatError && !mismatch && confirm.length > 0 && !ownerMissing;

  // Naikkan nilai tersimpan hanya bila seluruh isian lolos; selain itu kosongkan
  // supaya validasi form induk (wajib diisi) ikut menahan penyimpanan.
  useEffect(() => {
    onChange(ok ? composeAccount(bank, number, owner) : "");
    // onChange sengaja tidak masuk dependency: identitasnya berubah tiap render induk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, bank, number, owner]);

  const showError = invalid || (touched && (!!formatError || mismatch || ownerMissing));
  const errStyle = {
    borderColor: showError ? "var(--status-failed)" : undefined,
    boxShadow: showError ? "0 0 0 3px rgba(220,38,38,0.12)" : undefined,
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <select
        className="sh-input"
        value={bank}
        onChange={(e) => setBank(e.target.value)}
        onBlur={() => setTouched(true)}
        style={errStyle}
      >
        <option value="">— Select a bank —</option>
        {BANKS.map((b) => (
          <option key={b.name} value={b.name}>
            {b.name}
          </option>
        ))}
      </select>

      <input
        className="sh-input"
        inputMode="numeric"
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
        onBlur={() => setTouched(true)}
        placeholder="Account number"
        style={errStyle}
      />

      <input
        className="sh-input"
        inputMode="numeric"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
        onBlur={() => setTouched(true)}
        onPaste={(e) => e.preventDefault()} // ketik ulang manual — menyalin meniadakan gunanya
        placeholder="Re-enter the account number"
        style={errStyle}
      />

      <input
        className="sh-input"
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Account holder name (as printed in the passbook)"
        style={errStyle}
      />

      {ok ? (
        <div
          className="sh-row"
          style={{
            gap: 10,
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--canvas-tint)",
          }}
        >
          <CheckCircle2 size={18} style={{ color: "var(--status-success)", flex: "none" }} />
          <div style={{ fontSize: 13 }}>
            <div>
              <strong>{bank}</strong> • <strong>{number}</strong>
            </div>
            <div>
              a.n. <strong>{owner.trim()}</strong>
            </div>
            <div className="sh-muted" style={{ marginTop: 4 }}>
              Make sure this matches the passbook. Account ownership is checked by an admin during
              organization verification.
            </div>
          </div>
        </div>
      ) : (
        touched && (
          <div className="sh-row" style={{ gap: 6, color: "var(--status-failed)", fontSize: 13 }}>
            <AlertCircle size={14} style={{ flex: "none" }} />
            <span>
              {formatError ??
                (mismatch
                  ? "The re-entered account number does not match."
                  : confirm.length === 0
                    ? "Re-enter the account number to confirm."
                    : "Enter the account holder name.")}
            </span>
          </div>
        )
      )}

      <div className="sh-row" style={{ gap: 6, fontSize: 12 }}>
        <Info size={13} style={{ flex: "none", color: "var(--ink-soft)" }} />
        <span className="sh-muted">
          Sistem memeriksa format penulisan, bukan kepemilikan rekening. Salah transfer akibat
          nomor yang keliru menjadi tanggung jawab pemilik akun.
        </span>
      </div>
    </div>
  );
}
