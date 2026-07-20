import { useState } from "react";
import { Link } from "react-router-dom";
import { useActions } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { orgDataComplete } from "@/lib/orgVerify";
import type { Organization } from "@/lib/types";
import { ShieldCheck, Clock, AlertTriangle } from "lucide-react";

/** Banner status verifikasi organisasi. Tidak tampil bila sudah terverifikasi. */
export function OrgVerifyBanner({ org }: { org: Organization }) {
  const { requestOrgVerification } = useActions();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (org.verificationStatus === "terverifikasi") return null;

  const { complete, missing } = orgDataComplete(org);

  const ajukan = async () => {
    setBusy(true);
    try {
      await requestOrgVerification();
      toast.success("Verifikasi diajukan. Menunggu tinjauan admin.");
    } catch (e: any) {
      toast.failed(String(e?.message || "Gagal mengajukan verifikasi."));
    } finally {
      setBusy(false);
    }
  };

  // Sedang diproses admin
  if (org.verificationStatus === "menunggu") {
    return (
      <div className="sh-notice" style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Clock size={18} style={{ flex: "none", marginTop: 1 }} />
        <div>
          <strong>Menunggu verifikasi admin.</strong> Pengajuan pendanaan belum bisa dikirim sampai
          organisasi Anda diverifikasi.
        </div>
      </div>
    );
  }

  // belum_diajukan atau ditolak → perlu aksi org
  const rejected = org.verificationStatus === "ditolak";
  return (
    <div
      className={`sh-notice ${rejected ? "sh-notice--failed" : ""}`}
      style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}
    >
      {rejected ? (
        <AlertTriangle size={18} style={{ flex: "none", marginTop: 1 }} />
      ) : (
        <ShieldCheck size={18} style={{ flex: "none", marginTop: 1 }} />
      )}
      <div style={{ flex: 1 }}>
        {rejected ? (
          <div style={{ marginBottom: 6 }}>
            <strong>Verifikasi ditolak.</strong>{" "}
            {org.verificationNote ? `Alasan: ${org.verificationNote}` : "Perbaiki data lalu ajukan ulang."}
          </div>
        ) : (
          <div style={{ marginBottom: 6 }}>
            <strong>Organisasi belum terverifikasi.</strong> Verifikasi dulu agar bisa mengirim
            pengajuan pendanaan.
          </div>
        )}

        {complete ? (
          <button
            className="sh-btn sh-btn--primary sh-btn--sm"
            onClick={ajukan}
            disabled={busy}
            style={{ marginTop: 4 }}
          >
            {busy ? "Mengajukan…" : rejected ? "Ajukan ulang verifikasi" : "Ajukan verifikasi"}
          </button>
        ) : (
          <div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Lengkapi dulu: {missing.join(", ")}.
            </div>
            <Link to="/org/pengaturan" className="sh-btn sh-btn--secondary sh-btn--sm">
              Lengkapi data pendaftaran
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
