import { Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatRupiahShort } from "@/lib/format";

/** Hero sapaan bergaya indigo→violet dengan kartu nilai melayang.
 *  Konten menyesuaikan peran & data nyata dari store. */
export function Hero() {
  const { state, currentUser } = useStore();
  if (!currentUser) return null;

  const approvedCashTo = (predicate: (orgId: string, funderId: string) => boolean) =>
    state.pengajuan
      .filter((p) => p.status === "disetujui" && p.type === "in_cash" && predicate(p.orgId, p.funderId))
      .reduce((s, p) => s + (p.requestedAmount ?? 0), 0);

  let greeting = "";
  let subtitle = "";
  let value = "";
  let label = "";

  if (currentUser.role === "admin") {
    const sent = state.pengajuan.filter((p) => p.status !== "draf").length;
    const total = approvedCashTo(() => true);
    greeting = `Halo, ${currentUser.name}! 👋`;
    subtitle = `Pantau aktivitas pendanaan lintas platform. ${sent} pengajuan tercatat sejauh ini.`;
    value = formatRupiahShort(total);
    label = "Total disetujui";
  } else if (currentUser.role === "org") {
    const org = state.organizations.find((o) => o.id === currentUser.orgId);
    const total = approvedCashTo((orgId) => orgId === currentUser.orgId);
    greeting = `Halo, ${org?.name ?? "Organisasi"}! 👋`;
    subtitle =
      "Wujudkan programmu — susun pengajuan yang menarik lalu ajukan ke pendana yang tepat.";
    value = formatRupiahShort(total);
    label = "Total terkumpul";
  } else {
    const funder = state.funders.find((f) => f.id === currentUser.funderId);
    const total = approvedCashTo((_o, funderId) => funderId === currentUser.funderId);
    greeting = `Halo, ${funder?.name ?? "Pendana"}! 👋`;
    subtitle =
      "Banyak pengajuan menunggu dukunganmu. Tinjau dan bantu wujudkan program mereka.";
    value = formatRupiahShort(total);
    label = "Disponsori";
  }

  return (
    <div className="sh-hero">
      <div className="sh-hero__text">
        <h2>{greeting}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="sh-hero__stat">
        <div>
          <div className="sh-hero__stat-val tabular">{value}</div>
          <div className="sh-hero__stat-lbl">{label}</div>
        </div>
        <div className="sh-hero__stat-ic">
          <Wallet size={22} />
        </div>
      </div>
    </div>
  );
}
