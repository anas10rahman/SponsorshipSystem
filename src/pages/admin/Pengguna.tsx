import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatDate } from "@/lib/format";
import { orgVerifyBadge } from "@/lib/orgVerify";
import { Trash2, Building2, HandCoins } from "lucide-react";

type Tab = "org" | "funder";

export default function AdminPengguna() {
  const { state } = useStore();
  const { deleteOrg, deleteFunder } = useActions();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("org");
  const [search, setSearch] = useState("");
  const [del, setDel] = useState<{ kind: Tab; id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const q = search.trim().toLowerCase();
  const loginUser = (predicate: (u: (typeof state.users)[number]) => boolean) =>
    state.users.find(predicate);

  const orgRows = useMemo(
    () =>
      state.organizations.filter((o) => {
        if (!q) return true;
        const u = loginUser((x) => x.role === "org" && x.orgId === o.id);
        return [o.name, o.email, u?.username ?? ""].some((s) => s.toLowerCase().includes(q));
      }),
    [state.organizations, state.users, q],
  );
  const funderRows = useMemo(
    () =>
      state.funders.filter((f) => {
        if (!q) return true;
        const u = loginUser((x) => x.role === "funder" && x.funderId === f.id);
        return [f.name, f.email, f.type, u?.username ?? ""].some((s) =>
          s.toLowerCase().includes(q),
        );
      }),
    [state.funders, state.users, q],
  );

  const doDelete = async () => {
    if (!del) return;
    setBusy(true);
    try {
      if (del.kind === "org") await deleteOrg(del.id);
      else await deleteFunder(del.id);
      toast.success(`${del.kind === "org" ? "Organization" : "Sponsor Partner"} "${del.name}" deleted.`);
      setDel(null);
    } catch (e: any) {
      toast.failed(String(e?.message || "Could not delete."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Topbar
        search={{ value: search, onChange: setSearch, placeholder: "Search name / username / email…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="User management"
          subtitle="Manage organization and sponsor partner accounts. Deleting an account removes all of its related data."
        />

        <div className="sh-toolbar">
          <button
            className={`sh-chip${tab === "org" ? " is-active" : ""}`}
            onClick={() => setTab("org")}
          >
            <Building2 size={14} />
            Organizations
            <span className="sh-muted" style={{ fontWeight: 600 }}>
              ({state.organizations.length})
            </span>
          </button>
          <button
            className={`sh-chip${tab === "funder" ? " is-active" : ""}`}
            onClick={() => setTab("funder")}
          >
            <HandCoins size={14} />
            Sponsor Partners
            <span className="sh-muted" style={{ fontWeight: 600 }}>
              ({state.funders.length})
            </span>
          </button>
        </div>

        <section className="sh-card">
          {tab === "org" ? (
            orgRows.length === 0 ? (
              <Empty title="No organizations" description="No organization accounts yet." />
            ) : (
              <div className="sh-table-wrap">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Organization</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Verification</th>
                      <th>Terdaftar</th>
                      <th style={{ width: 60 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgRows.map((o) => {
                      const u = loginUser((x) => x.role === "org" && x.orgId === o.id);
                      const badge = orgVerifyBadge(o.verificationStatus);
                      return (
                        <tr key={o.id}>
                          <td data-label="Organization">
                            <div className="sh-row" style={{ gap: 10 }}>
                              <span className="sh-org-logo">{o.logoInitials}</span>
                              <span style={{ fontWeight: 700 }}>{o.name}</span>
                            </div>
                          </td>
                          <td data-label="Username">{u?.username ?? "—"}</td>
                          <td className="sh-muted" data-label="Email">{o.email || u?.email || "—"}</td>
                          <td data-label="Verification">
                            <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
                          </td>
                          <td className="sh-muted" data-label="Terdaftar">{u ? formatDate(u.createdAt) : "—"}</td>
                          <td data-label="Aksi">
                            <button
                              className="sh-btn sh-btn--ghost sh-btn--icon"
                              onClick={() => setDel({ kind: "org", id: o.id, name: o.name })}
                              title="Delete organization"
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
            )
          ) : funderRows.length === 0 ? (
            <Empty title="No sponsor partners" description="No sponsor partner accounts yet." />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Sponsor Partner</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Tipe</th>
                    <th>Terdaftar</th>
                    <th style={{ width: 60 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {funderRows.map((f) => {
                    const u = loginUser((x) => x.role === "funder" && x.funderId === f.id);
                    return (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700 }} data-label="Sponsor Partner">{f.name}</td>
                        <td data-label="Username">{u?.username ?? "—"}</td>
                        <td className="sh-muted" data-label="Email">{f.email || u?.email || "—"}</td>
                        <td data-label="Tipe">{f.type}</td>
                        <td className="sh-muted" data-label="Terdaftar">{u ? formatDate(u.createdAt) : "—"}</td>
                        <td data-label="Aksi">
                          <button
                            className="sh-btn sh-btn--ghost sh-btn--icon"
                            onClick={() => setDel({ kind: "funder", id: f.id, name: f.name })}
                            title="Delete sponsor partner"
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

      {del && (
        <Modal
          open
          onClose={() => setDel(null)}
          title={del.kind === "org" ? "Delete this organization?" : "Delete this sponsor partner?"}
          width={460}
          footer={
            <>
              <button className="sh-btn sh-btn--secondary" onClick={() => setDel(null)} disabled={busy}>
                Cancel
              </button>
              <button className="sh-btn sh-btn--danger" onClick={doDelete} disabled={busy}>
                <Trash2 size={16} />
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
            </>
          }
        >
          <p>
            {del.kind === "org" ? "Organization" : "Sponsor Partner"} <strong>{del.name}</strong> will be deleted{" "}
            <strong>permanently</strong> — along with the login account and every related submission.
            This cannot be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
