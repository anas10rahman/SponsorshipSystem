import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatRupiah } from "@/lib/format";
import { selectedAmount } from "@/lib/pengajuan";
import { orgVerifyBadge } from "@/lib/orgVerify";
import type { OrgVerificationStatus } from "@/lib/types";
import { CheckCircle2, XCircle, FileText, ShieldCheck } from "lucide-react";

type Filter = "semua" | "menunggu" | "terverifikasi" | "ditolak" | "belum_diajukan";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "menunggu", label: "Menunggu" },
  { value: "terverifikasi", label: "Terverifikasi" },
  { value: "ditolak", label: "Ditolak" },
  { value: "belum_diajukan", label: "Belum diajukan" },
];

export default function AdminOrganisasi() {
  const { state } = useStore();
  const { verifyOrg, rejectOrg } = useActions();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("menunggu");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { semua: state.organizations.length };
    for (const s of ["menunggu", "terverifikasi", "ditolak", "belum_diajukan"])
      c[s] = state.organizations.filter((o) => o.verificationStatus === s).length;
    return c;
  }, [state.organizations]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.organizations.filter((o) => {
      if (filter !== "semua" && o.verificationStatus !== filter) return false;
      if (!q) return true;
      return [o.name, o.category, o.city].some((s) => s.toLowerCase().includes(q));
    });
  }, [state.organizations, search, filter]);

  const review = state.organizations.find((o) => o.id === reviewId) ?? null;

  const closeReview = () => {
    setReviewId(null);
    setRejecting(false);
    setNote("");
  };

  const doVerify = async () => {
    if (!review) return;
    setBusy(true);
    try {
      await verifyOrg(review.id);
      toast.success(`Organisasi "${review.name}" diverifikasi.`);
      closeReview();
    } catch (e: any) {
      toast.failed(String(e?.message || "Gagal memverifikasi."));
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    if (!review) return;
    if (!note.trim()) {
      toast.failed("Tulis alasan penolakan.");
      return;
    }
    setBusy(true);
    try {
      await rejectOrg(review.id, note.trim());
      toast.failed(`Verifikasi "${review.name}" ditolak.`);
      closeReview();
    } catch (e: any) {
      toast.failed(String(e?.message || "Gagal menolak."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Topbar
        title="Direktori organisasi"
        search={{ value: search, onChange: setSearch, placeholder: "Cari organisasi…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Direktori organisasi"
          subtitle="Tinjau & verifikasi organisasi. Hanya organisasi terverifikasi yang bisa mengirim pengajuan."
        />

        <div className="sh-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`sh-chip${filter === f.value ? " is-active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="sh-muted" style={{ fontWeight: 600 }}>
                ({counts[f.value] ?? 0})
              </span>
            </button>
          ))}
        </div>

        <section className="sh-card">
          {rows.length === 0 ? (
            <Empty title="Tidak ada organisasi" description="Coba ubah filter." />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Organisasi</th>
                    <th>Kategori</th>
                    <th>Kota</th>
                    <th>Status verifikasi</th>
                    <th>Pengajuan dikirim</th>
                    <th style={{ width: 100 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((org) => {
                    const myPengajuan = state.pengajuan.filter((p) => p.orgId === org.id);
                    const sent = myPengajuan.filter((p) => p.status !== "draf").length;
                    const badge = orgVerifyBadge(org.verificationStatus);
                    return (
                      <tr key={org.id}>
                        <td>
                          <div className="sh-row" style={{ gap: 10 }}>
                            <span className="sh-org-logo">{org.logoInitials}</span>
                            <Link
                              to={`/admin/organisasi/${org.id}`}
                              style={{ fontWeight: 700, color: "inherit" }}
                            >
                              {org.name}
                            </Link>
                          </div>
                        </td>
                        <td>{org.category}</td>
                        <td>{org.city}</td>
                        <td>
                          <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
                        </td>
                        <td>{sent}</td>
                        <td>
                          <button
                            className="sh-btn sh-btn--ghost sh-btn--sm"
                            onClick={() => {
                              setNote("");
                              setRejecting(false);
                              setReviewId(org.id);
                            }}
                          >
                            <ShieldCheck size={14} />
                            Tinjau
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {review && (
        <Modal
          open
          onClose={closeReview}
          title={`Verifikasi: ${review.name}`}
          width={640}
          footer={
            review.verificationStatus === "terverifikasi" ? (
              <span className="sh-muted">Organisasi ini sudah terverifikasi.</span>
            ) : rejecting ? (
              <>
                <button className="sh-btn sh-btn--secondary" onClick={() => setRejecting(false)} disabled={busy}>
                  Batal
                </button>
                <button className="sh-btn sh-btn--danger" onClick={doReject} disabled={busy}>
                  Kirim penolakan
                </button>
              </>
            ) : (
              <>
                <button
                  className="sh-btn sh-btn--secondary"
                  onClick={() => setRejecting(true)}
                  disabled={busy}
                >
                  <XCircle size={16} />
                  Tolak
                </button>
                <button className="sh-btn sh-btn--primary" onClick={doVerify} disabled={busy}>
                  <CheckCircle2 size={16} />
                  Verifikasi
                </button>
              </>
            )
          }
        >
          <div className="sh-row sh-row--between" style={{ marginBottom: 12 }}>
            <StatusBadge
              kind="custom"
              label={orgVerifyBadge(review.verificationStatus).label}
              variant={orgVerifyBadge(review.verificationStatus).variant}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              padding: "12px 0",
              borderTop: "1px solid var(--line)",
            }}
          >
            <Field label="Kategori">{review.category || "—"}</Field>
            <Field label="Kota">{review.city || "—"}</Field>
            <Field label="Email">{review.email || "—"}</Field>
            <Field label="Rekening pencairan">{review.payoutAccount || "—"}</Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Deskripsi">{review.description || "—"}</Field>
            </div>
          </div>

          <h4 style={{ margin: "6px 0 8px" }}>Penanggung jawab (PIC)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Nama">{review.pic.name || "—"}</Field>
            <Field label="Jabatan">{review.pic.position || "—"}</Field>
            <Field label="No. WA">{review.pic.phone || "—"}</Field>
            <Field label="Email PIC">{review.pic.email || "—"}</Field>
          </div>

          <h4 style={{ margin: "14px 0 8px" }}>Dokumen</h4>
          <DocRow label="KTP/KTM PIC" name={review.pic.idDocUrl} />

          {review.verificationStatus === "ditolak" && review.verificationNote && (
            <div className="sh-notice sh-notice--failed" style={{ marginTop: 12 }}>
              Ditolak sebelumnya: {review.verificationNote}
            </div>
          )}

          {rejecting && (
            <div className="sh-field" style={{ marginTop: 12 }}>
              <label className="sh-field__label">Alasan penolakan</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Jelaskan apa yang perlu diperbaiki organisasi."
              />
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="sh-meta-label">{label}</div>
      <div className="sh-meta-value">{children}</div>
    </div>
  );
}

function DocRow({ label, name }: { label: string; name: string }) {
  return (
    <div
      className="sh-row"
      style={{
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      <div className="sh-meta-label" style={{ width: 120, flex: "none" }}>
        {label}
      </div>
      {name ? (
        <div className="sh-row" style={{ gap: 8, minWidth: 0 }}>
          <FileText size={16} style={{ color: "var(--status-failed)", flex: "none" }} />
          <span style={{ wordBreak: "break-all" }}>{name}</span>
        </div>
      ) : (
        <span className="sh-muted">Belum diunggah</span>
      )}
    </div>
  );
}
