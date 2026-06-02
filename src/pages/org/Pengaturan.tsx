import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { useStore } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";

export default function OrgPengaturan() {
  const { state, currentUser } = useStore();
  const org = state.organizations.find((o) => o.id === currentUser?.orgId);

  if (!org) return null;

  return (
    <>
      <Topbar title="Pengaturan organisasi" />
      <div className="sh-shell__content">
        <PageHead
          title="Pengaturan organisasi"
          subtitle="Profil organisasi, dokumen legal, dan rekening pencairan."
        />

        <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
          <section className="sh-card">
            <div className="sh-card__body sh-stack">
              <div className="sh-row" style={{ gap: 16 }}>
                <span className="sh-org-logo" style={{ width: 64, height: 64, fontSize: 20 }}>
                  {org.logoInitials}
                </span>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{org.name}</h3>
                  <div className="sh-muted">
                    {org.category} · {org.city}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {org.verified ? (
                      <StatusBadge kind="custom" label="Terverifikasi" variant="success" />
                    ) : (
                      <StatusBadge kind="custom" label="Menunggu verifikasi" variant="pending" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Rekening pencairan</h3>
            </header>
            <div className="sh-card__body">
              <div className="sh-meta-label">Rekening tujuan dana sponsorship</div>
              <div className="sh-meta-value">{org.payoutAccount}</div>
            </div>
          </section>

          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Dokumen legal</h3>
            </header>
            <div className="sh-card__body">
              {org.legalDocs.length === 0 ? (
                <p className="sh-muted">Belum ada dokumen yang diunggah.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {org.legalDocs.map((doc) => (
                    <li key={doc}>{doc}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
