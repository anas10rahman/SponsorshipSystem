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
      toast.success("Verification requested. Awaiting admin review.");
    } catch (e: any) {
      toast.failed(String(e?.message || "Could not request verification."));
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
          <strong>Awaiting admin verification.</strong> Funding submissions cannot be sent until
          your organization is verified.
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
            <strong>Verification rejected.</strong>{" "}
            {org.verificationNote ? `Reason: ${org.verificationNote}` : "Fix the details, then request again."}
          </div>
        ) : (
          <div style={{ marginBottom: 6 }}>
            <strong>Organization is not verified yet.</strong> Get verified first so you can send
            funding submissions.
          </div>
        )}

        {complete ? (
          <button
            className="sh-btn sh-btn--primary sh-btn--sm"
            onClick={ajukan}
            disabled={busy}
            style={{ marginTop: 4 }}
          >
            {busy ? "Mengajukan…" : rejected ? "Request verification again" : "Request verification"}
          </button>
        ) : (
          <div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Complete these first: {missing.join(", ")}.
            </div>
            <Link to="/org/pengaturan" className="sh-btn sh-btn--secondary sh-btn--sm">
              Complete registration details
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
