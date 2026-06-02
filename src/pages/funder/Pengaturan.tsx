import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { useStore } from "@/lib/store";
import { formatRupiah, percent } from "@/lib/format";

export default function FunderPengaturan() {
  const { state, currentUser } = useStore();
  const funder = state.funders.find((f) => f.id === currentUser?.funderId);
  if (!funder) return null;
  const used = funder.budgetTotal - funder.budgetRemaining;
  const pct = percent(used, funder.budgetTotal);

  return (
    <>
      <Topbar title="Pengaturan akun pendana" />
      <div className="sh-shell__content">
        <PageHead
          title="Pengaturan akun pendana"
          subtitle="Profil pendana, kapasitas anggaran, dan fokus sponsorship."
        />

        <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
          <section className="sh-card">
            <div className="sh-card__body sh-stack">
              <div>
                <h3 style={{ marginBottom: 4 }}>{funder.name}</h3>
                <div className="sh-muted">{funder.type}</div>
              </div>
              <div>
                <div className="sh-meta-label">Fokus sponsorship</div>
                <div className="sh-row" style={{ gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {funder.focus.map((f) => (
                    <span key={f} className="sh-chip" style={{ cursor: "default" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Kapasitas anggaran tahunan</h3>
            </header>
            <div className="sh-card__body sh-stack">
              <div className="sh-row" style={{ gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div className="sh-meta-label">Anggaran total</div>
                  <div className="sh-meta-value num">{formatRupiah(funder.budgetTotal)}</div>
                </div>
                <div>
                  <div className="sh-meta-label">Terpakai</div>
                  <div className="sh-meta-value num">{formatRupiah(used)}</div>
                </div>
                <div>
                  <div className="sh-meta-label">Sisa</div>
                  <div className="sh-meta-value num">{formatRupiah(funder.budgetRemaining)}</div>
                </div>
              </div>
              <div className="sh-progress">
                <div className="sh-progress__bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="sh-progress__meta">
                <span>{pct}% anggaran sudah terpakai</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
