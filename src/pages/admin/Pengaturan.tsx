import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { useStore } from "@/lib/store";
import { Users, ShieldCheck } from "lucide-react";

export default function AdminPengaturan() {
  const { state } = useStore();

  return (
    <>
      <Topbar title="Pengaturan platform" />
      <div className="sh-shell__content">
        <PageHead
          title="Pengaturan platform"
          subtitle="Konfigurasi peran, verifikasi, dan kelola data demo."
        />

        <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
          <section className="sh-card">
            <div className="sh-card__body">
              <div className="sh-row" style={{ gap: 14, marginBottom: 12 }}>
                <span className="sh-stat__icon">
                  <Users size={20} />
                </span>
                <div>
                  <h3 style={{ marginBottom: 4 }}>Pengguna platform</h3>
                  <p className="sh-muted">
                    {state.users.length} pengguna terdaftar di akun demo.
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                }}
              >
                {state.users.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: "var(--radius-md)",
                      padding: 12,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div className="sh-muted" style={{ fontSize: 12 }}>
                      {u.email}
                    </div>
                    <div className="sh-muted" style={{ fontSize: 12, marginTop: 4 }}>
                      Role: <strong>{u.role}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="sh-card">
            <div className="sh-card__body">
              <div className="sh-row" style={{ gap: 14, marginBottom: 12 }}>
                <span className="sh-stat__icon">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <h3 style={{ marginBottom: 4 }}>Ambang verifikasi</h3>
                  <p className="sh-muted">
                    Untuk rilis pertama, semua transaksi memerlukan verifikasi manual oleh Admin.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
