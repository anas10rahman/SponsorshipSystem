import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { AppFooter } from "@/components/AppFooter";
import { useStore } from "@/lib/store";
import type { PengajuanStatus } from "@/lib/types";
import { Inbox, Clock, CheckCircle2, XCircle, Hourglass, ArrowRight } from "lucide-react";

type Tile = {
  key: "semua" | PengajuanStatus;
  label: string;
  hint: string;
  tone: "blue" | "amber" | "green" | "red" | "slate";
  icon: React.ReactNode;
};

/* Kartu ringkasan. `key` dipakai sebagai filter awal di halaman Pengajuan,
   sehingga angka yang diklik selalu cocok dengan daftar yang terbuka. */
const TILES: Tile[] = [
  {
    key: "semua",
    label: "Proposal Masuk",
    hint: "Total proposal diterima",
    tone: "blue",
    icon: <Inbox size={20} />,
  },
  {
    key: "diajukan",
    label: "Perlu Ditinjau",
    hint: "Menunggu review Anda",
    tone: "amber",
    icon: <Clock size={20} />,
  },
  {
    key: "disetujui",
    label: "Disetujui",
    hint: "Proposal diterima",
    tone: "green",
    icon: <CheckCircle2 size={20} />,
  },
  {
    key: "ditolak",
    label: "Ditolak",
    hint: "Proposal ditolak",
    tone: "red",
    icon: <XCircle size={20} />,
  },
  {
    key: "kadaluarsa",
    label: "Kadaluarsa",
    hint: "Melewati batas waktu",
    tone: "slate",
    icon: <Hourglass size={20} />,
  },
];

export default function FunderDashboard() {
  const { state, currentUser } = useStore();
  const navigate = useNavigate();
  const funderId = currentUser?.funderId ?? "";
  const funder = state.funders.find((f) => f.id === funderId);

  // Draf milik organisasi belum terkirim — tidak dihitung sebagai proposal masuk.
  const inbox = useMemo(
    () => state.pengajuan.filter((p) => p.funderId === funderId && p.status !== "draf"),
    [state.pengajuan, funderId],
  );

  const countOf = (key: Tile["key"]) =>
    key === "semua" ? inbox.length : inbox.filter((p) => p.status === key).length;

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="sh-shell__content">
        <div className="dm-greet">
          <h2>Selamat datang, {funder?.name ?? currentUser?.name ?? "Mitra Sponsor"}! 👋</h2>
          <p>Kelola seluruh aktivitas sponsorship Anda di DealMatch.</p>
        </div>

        <div className="dm-tiles">
          {TILES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`dm-tile dm-tile--${t.tone}`}
              onClick={() => navigate(`/funder/pengajuan?status=${t.key}`)}
              title={`Lihat daftar: ${t.label}`}
            >
              <span className="dm-tile__icon">{t.icon}</span>
              <span className="dm-tile__label">{t.label}</span>
              <span className="dm-tile__value">{countOf(t.key)}</span>
              <span className="dm-tile__hint">{t.hint}</span>
              <span className="dm-tile__go">
                <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </div>

        <AppFooter />
      </div>
    </>
  );
}
