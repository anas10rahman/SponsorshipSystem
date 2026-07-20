import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatRupiah, percent } from "@/lib/format";
import { Trash2 } from "lucide-react";

export default function AdminPendana() {
  const { state } = useStore();
  const { deleteFunder } = useActions();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const delTarget = state.funders.find((f) => f.id === deleteId) ?? null;
  const doDelete = async () => {
    if (!delTarget) return;
    setBusy(true);
    try {
      await deleteFunder(delTarget.id);
      toast.success(`Pendana "${delTarget.name}" dihapus.`);
      setDeleteId(null);
    } catch (e: any) {
      toast.failed(String(e?.message || "Gagal menghapus."));
    } finally {
      setBusy(false);
    }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.funders;
    return state.funders.filter((f) =>
      [f.name, f.type, ...f.focus].some((s) => s.toLowerCase().includes(q)),
    );
  }, [state.funders, search]);

  return (
    <>
      <Topbar
        title="Direktori pendana"
        search={{ value: search, onChange: setSearch, placeholder: "Cari pendana / fokus…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Direktori pendana"
          subtitle="Pantau kapasitas anggaran & komitmen tiap pendana."
        />

        <section className="sh-card">
          {rows.length === 0 ? (
            <Empty title="Tidak ada pendana" />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Pendana</th>
                    <th>Tipe</th>
                    <th>Fokus</th>
                    <th>Anggaran total</th>
                    <th>Sisa anggaran</th>
                    <th style={{ width: 180 }}>Penggunaan</th>
                    <th style={{ width: 60 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => {
                    const used = f.budgetTotal - f.budgetRemaining;
                    const pct = percent(used, f.budgetTotal);
                    return (
                      <tr key={f.id}>
                        <td>
                          <Link
                            to={`/admin/pendana/${f.id}`}
                            style={{ fontWeight: 700, color: "inherit" }}
                          >
                            {f.name}
                          </Link>
                        </td>
                        <td>{f.type}</td>
                        <td>{f.focus.join(", ")}</td>
                        <td className="num">{formatRupiah(f.budgetTotal)}</td>
                        <td className="num">{formatRupiah(f.budgetRemaining)}</td>
                        <td>
                          <div className="sh-progress">
                            <div className="sh-progress__bar" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="sh-progress__meta">
                            <span>{pct}% terpakai</span>
                          </div>
                        </td>
                        <td>
                          <button
                            className="sh-btn sh-btn--ghost sh-btn--icon"
                            onClick={() => setDeleteId(f.id)}
                            title="Hapus pendana"
                          >
                            <Trash2 size={14} style={{ color: "var(--status-failed)" }} />
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

      {delTarget && (
        <Modal
          open
          onClose={() => setDeleteId(null)}
          title="Hapus pendana?"
          width={460}
          footer={
            <>
              <button className="sh-btn sh-btn--secondary" onClick={() => setDeleteId(null)} disabled={busy}>
                Batal
              </button>
              <button className="sh-btn sh-btn--danger" onClick={doDelete} disabled={busy}>
                <Trash2 size={16} />
                {busy ? "Menghapus…" : "Hapus permanen"}
              </button>
            </>
          }
        >
          <p>
            Pendana <strong>{delTarget.name}</strong> akan dihapus <strong>permanen</strong> —
            beserta akun loginnya dan seluruh pengajuan yang masuk ke pendana ini. Tindakan ini
            tidak bisa dibatalkan.
          </p>
        </Modal>
      )}
    </>
  );
}
