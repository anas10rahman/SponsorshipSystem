import { useRef, useState } from "react";
import { UploadCloud, FileText, Eye, X } from "lucide-react";
import type { OrgDoc } from "@/lib/types";

/** Unggah berkas PDF (satu atau banyak) dengan daftar yang bisa dipratinjau.
 *  Pesan berhasil/gagal tampil menempel di bawah kontrol, bukan sebagai toast. */
export function DocPicker({
  label,
  required,
  multiple,
  docs,
  onChange,
  onPreview,
  invalid,
  hint,
}: {
  label: string;
  required?: boolean;
  multiple?: boolean;
  docs: OrgDoc[];
  onChange: (docs: OrgDoc[]) => void;
  /** Buka pratinjau berkas ke-i (data diambil pemanggil bila perlu). */
  onPreview: (doc: OrgDoc, index: number) => void;
  invalid?: boolean;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const readPdf = (file: File): Promise<OrgDoc | string> =>
    new Promise((resolve) => {
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) return resolve(`"${file.name}" bukan PDF.`);
      if (file.size > 2 * 1024 * 1024) return resolve(`"${file.name}" melebihi 2 MB.`);
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, data: String(reader.result) });
      reader.onerror = () => resolve(`"${file.name}" gagal dibaca.`);
      reader.readAsDataURL(file);
    });

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (ref.current) ref.current.value = "";
    if (!files.length) return;
    setError("");
    setOk("");
    const added: OrgDoc[] = [];
    const problems: string[] = [];
    for (const f of files) {
      if (docs.some((d) => d.name === f.name)) {
        problems.push(`"${f.name}" sudah ditambahkan.`);
        continue;
      }
      const r = await readPdf(f);
      if (typeof r === "string") problems.push(r);
      else added.push(r);
    }
    if (added.length) {
      onChange(multiple ? [...docs, ...added] : added.slice(0, 1));
      setOk(
        added.length === 1
          ? `"${added[0].name}" siap disimpan.`
          : `${added.length} berkas siap disimpan.`,
      );
    }
    if (problems.length) setError(problems.join(" "));
  };

  const remove = (i: number) => {
    onChange(docs.filter((_, idx) => idx !== i));
    setOk("");
    setError("");
  };

  return (
    <div className={`sh-field${invalid ? " sh-field--invalid" : ""}`} style={{ marginBottom: 18 }}>
      <label className="sh-field__label" style={{ display: "block", marginBottom: 8 }}>
        {label} {required && <span style={{ color: "var(--status-failed)" }}>*</span>}
      </label>

      <input
        ref={ref}
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        style={{ display: "none" }}
        onChange={pick}
      />

      {docs.length > 0 && (
        <div className="dm-files">
          {docs.map((d, i) => (
            <div key={d.name} className="dm-file">
              <FileText size={18} style={{ color: "var(--status-failed)", flex: "none" }} />
              <button
                type="button"
                className="dm-file__name"
                onClick={() => onPreview(d, i)}
                title="Pratinjau dokumen"
                style={{ background: "none", border: 0, cursor: "pointer" }}
              >
                {d.name}
              </button>
              <button
                type="button"
                className="sh-btn sh-btn--ghost sh-btn--icon"
                onClick={() => onPreview(d, i)}
                title="Pratinjau"
              >
                <Eye size={16} />
              </button>
              <button
                type="button"
                className="sh-btn sh-btn--ghost sh-btn--icon"
                onClick={() => remove(i)}
                title="Hapus berkas"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="sh-file-drop"
        style={{ width: "100%", cursor: "pointer" }}
        onClick={() => ref.current?.click()}
      >
        <UploadCloud size={26} style={{ color: "var(--brand-500)" }} />
        <span>
          {docs.length > 0
            ? multiple
              ? "Tambah berkas lain."
              : "Ganti berkas."
            : "Klik untuk unggah berkas PDF."}
        </span>
        <span className="sh-muted" style={{ fontSize: 12 }}>
          Hanya PDF · maks 2 MB per berkas
          {multiple ? " · bisa pilih beberapa sekaligus" : ""}
        </span>
      </button>

      {error ? (
        <span className="sh-field__hint" style={{ color: "var(--status-failed)" }}>
          {error}
        </span>
      ) : ok ? (
        <span className="sh-field__hint" style={{ color: "var(--status-success)" }}>
          {ok}
        </span>
      ) : invalid ? (
        <span className="sh-field__hint" style={{ color: "var(--status-failed)" }}>
          {label} wajib diunggah.
        </span>
      ) : (
        hint && <span className="sh-field__hint">{hint}</span>
      )}
    </div>
  );
}
