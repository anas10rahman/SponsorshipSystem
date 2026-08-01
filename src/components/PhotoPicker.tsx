import { useRef, useState } from "react";
import { Pencil, X, Loader2 } from "lucide-react";
import { compressImage, formatBytes } from "@/lib/imageCompress";

/** Pemilih foto/logo: gambar ditampilkan langsung, diganti lewat ikon pensil
 *  yang menempel di sudut foto (bukan tombol terpisah).
 *  Umpan balik keberhasilan tampil di bawah foto, bukan sebagai toast. */
export function PhotoPicker({
  value,
  fallback,
  onChange,
  size = 96,
  round,
  label,
  hint,
}: {
  value?: string;
  /** Isi saat foto kosong — biasanya inisial nama. */
  fallback: string;
  onChange: (dataUrl: string | undefined) => void;
  size?: number;
  round?: boolean;
  label?: string;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const reset = () => {
      if (ref.current) ref.current.value = "";
    };
    if (!file) return;
    setOk("");
    if (!file.type.startsWith("image/")) {
      setError("Berkas harus berupa gambar (PNG/JPG).");
      reset();
      return;
    }
    // Batas berkas masukan longgar karena hasilnya dikompres dulu.
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 10 MB.");
      reset();
      return;
    }
    setBusy(true);
    try {
      // Gambar diperkecil & dikompres supaya tidak membengkakkan data aplikasi.
      const r = await compressImage(file);
      setError("");
      onChange(r.dataUrl);
      const saved = file.size - r.bytes;
      setOk(
        saved > 1024
          ? `Siap disimpan · ${formatBytes(r.bytes)} (dari ${formatBytes(file.size)}).`
          : `Siap disimpan · ${formatBytes(r.bytes)}.`,
      );
    } catch (err: any) {
      setError(String(err?.message || "Gambar gagal diproses."));
    } finally {
      setBusy(false);
      reset();
    }
  };

  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label
          className="sh-field__label"
          style={{ display: "block", marginBottom: 8 }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={pick}
      />

      <div>
        <div className="dm-photo" style={{ width: size, height: size }}>
          <span
            className={`dm-photo__frame${round ? " dm-photo__frame--round" : ""}`}
            style={{ fontSize: Math.round(size / 3.6) }}
          >
            {value ? <img src={value} alt={label ?? "Foto"} /> : fallback}
          </span>

          <button
            type="button"
            className="dm-photo__edit"
            onClick={() => ref.current?.click()}
            title={value ? "Ganti foto" : "Unggah foto"}
            aria-label={value ? "Ganti foto" : "Unggah foto"}
          >
            <Pencil size={14} />
          </button>

          {value && (
            <button
              type="button"
              className="dm-photo__remove"
              onClick={() => {
                onChange(undefined);
                setOk("");
                setError("");
                if (ref.current) ref.current.value = "";
              }}
              title="Hapus foto"
              aria-label="Hapus foto"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {error ? (
        <span
          className="sh-field__hint"
          style={{ color: "var(--status-failed)" }}
        >
          {error}
        </span>
      ) : ok ? (
        <span
          className="sh-field__hint"
          style={{ color: "var(--status-success)" }}
        >
          {ok}
        </span>
      ) : (
        hint && <span className="sh-field__hint">{hint}</span>
      )}
    </div>
  );
}
