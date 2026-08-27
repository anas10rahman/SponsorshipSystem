import { Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatRupiahShort } from "@/lib/format";
import { selectedAmount } from "@/lib/pengajuan";

/** Hero sapaan bergaya indigo→violet dengan kartu nilai melayang.
 *  Konten menyesuaikan peran & data nyata dari store. */
export function Hero() {
  const { state, currentUser } = useStore();
  if (!currentUser) return null;

  const approvedCashTo = (predicate: (orgId: string, funderId: string) => boolean) =>
    state.pengajuan
      .filter((p) => p.status === "disetujui" && predicate(p.orgId, p.funderId))
      .reduce((s, p) => s + selectedAmount(p), 0);

  let greeting = "";
  let subtitle = "";
  let value = "";
  let label = "";

  if (currentUser.role === "admin") {
    const sent = state.pengajuan.filter((p) => p.status !== "draf").length;
    const total = approvedCashTo(() => true);
    greeting = `Hi, ${currentUser.name}! 👋`;
    subtitle = `Track funding activity across the platform. ${sent} submissions recorded so far.`;
    value = formatRupiahShort(total);
    label = "Total approved";
  } else if (currentUser.role === "org") {
    const org = state.organizations.find((o) => o.id === currentUser.orgId);
    greeting = `Hi, ${org?.name ?? "Organization"}! 👋`;
    subtitle =
      "Top up your balance first, then build a compelling submission and send it to the right sponsor partner.";
    value = formatRupiahShort(org?.balance ?? 0);
    label = "Balance";
  } else {
    const funder = state.funders.find((f) => f.id === currentUser.funderId);
    const total = approvedCashTo((_o, funderId) => funderId === currentUser.funderId);
    greeting = `Hi, ${funder?.name ?? "Sponsor Partner"}! 👋`;
    subtitle =
      "Plenty of submissions are waiting for your support. Review them and help make these programs happen.";
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
