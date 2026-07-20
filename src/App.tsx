import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { StoreProvider, rolePath, useStore } from "./lib/store";
import { RoleGuard } from "./components/RoleGuard";
import { Shell } from "./components/Shell";
import { ToastProvider } from "./components/Toast";
import { BrandMark } from "./components/BrandMark";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrganisasi from "./pages/admin/Organisasi";
import AdminPendana from "./pages/admin/Pendana";
import AdminPengguna from "./pages/admin/Pengguna";
import AdminLaporan from "./pages/admin/Laporan";
import AdminPengaturan from "./pages/admin/Pengaturan";
import AdminPengajuan from "./pages/admin/Pengajuan";
import PendanaProfil from "./pages/shared/PendanaProfil";
import OrganisasiProfil from "./pages/shared/OrganisasiProfil";
import OrgDashboard from "./pages/org/Dashboard";
import OrgCariPendana from "./pages/org/CariPendana";
import OrgPengajuanList from "./pages/org/PengajuanList";
import BuatPengajuan from "./pages/org/BuatPengajuan";
import OrgTopUp from "./pages/org/TopUp";
import OrgPengaturan from "./pages/org/Pengaturan";
import FunderPengajuanInbox from "./pages/funder/PengajuanInbox";
import FunderPengajuanReview from "./pages/funder/PengajuanReview";
import FunderPortofolio from "./pages/funder/Portofolio";
import FunderPengaturan from "./pages/funder/Pengaturan";

function RootRedirect() {
  const { currentUser } = useStore();
  return <Navigate to={currentUser ? rolePath[currentUser.role] : "/login"} replace />;
}

function HydrationGate({ children }: { children: ReactNode }) {
  const { status, errorMsg } = useStore();
  if (status === "loading") {
    return (
      <main className="sh-login">
        <div style={{ textAlign: "center", display: "grid", gap: 16, placeItems: "center" }}>
          <BrandMark size={40} />
          <div
            style={{
              width: 28,
              height: 28,
              border: "3px solid var(--line)",
              borderTopColor: "var(--brand-500)",
              borderRadius: "999px",
              animation: "sh-spin 0.7s linear infinite",
            }}
          />
          <p className="sh-muted">Memuat data…</p>
        </div>
        <style>{`@keyframes sh-spin{to{transform:rotate(360deg)}}`}</style>
      </main>
    );
  }
  if (status === "error") {
    return (
      <main className="sh-login">
        <div className="sh-login__card" style={{ textAlign: "center", gap: 12 }}>
          <BrandMark size={40} style={{ justifyContent: "center" }} />
          <h2>Gagal memuat data</h2>
          <p className="sh-muted">{errorMsg || "Tidak dapat terhubung ke server."}</p>
          <button className="sh-btn sh-btn--primary" onClick={() => location.reload()}>
            Coba lagi
          </button>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
      <HydrationGate>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />

        {/* === Admin === */}
        <Route
          element={
            <RoleGuard allow="admin">
              <Shell role="admin" />
            </RoleGuard>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/pengajuan" element={<AdminPengajuan />} />
          <Route path="/admin/organisasi/:id" element={<OrganisasiProfil />} />
          <Route path="/admin/pendana/:id" element={<PendanaProfil />} />
          <Route path="/admin/organisasi" element={<AdminOrganisasi />} />
          <Route path="/admin/pendana" element={<AdminPendana />} />
          <Route path="/admin/pengguna" element={<AdminPengguna />} />
          <Route path="/admin/laporan" element={<AdminLaporan />} />
          <Route path="/admin/pengaturan" element={<AdminPengaturan />} />
        </Route>

        {/* === Organisasi === */}
        <Route
          element={
            <RoleGuard allow="org">
              <Shell role="org" />
            </RoleGuard>
          }
        >
          <Route path="/org/dashboard" element={<OrgDashboard />} />
          <Route path="/org/cari" element={<OrgCariPendana />} />
          <Route path="/org/pendana/:id" element={<PendanaProfil />} />
          <Route path="/org/profil" element={<OrganisasiProfil />} />
          <Route path="/org/pengajuan" element={<OrgPengajuanList />} />
          <Route path="/org/pengajuan/baru" element={<BuatPengajuan />} />
          <Route path="/org/pengajuan/:id/edit" element={<BuatPengajuan />} />
          <Route path="/org/topup" element={<OrgTopUp />} />
          <Route path="/org/pengaturan" element={<OrgPengaturan />} />
        </Route>

        {/* === Pendana === */}
        <Route
          element={
            <RoleGuard allow="funder">
              <Shell role="funder" />
            </RoleGuard>
          }
        >
          <Route path="/funder/pengajuan" element={<FunderPengajuanInbox />} />
          <Route path="/funder/pengajuan/:id" element={<FunderPengajuanReview />} />
          <Route path="/funder/organisasi/:id" element={<OrganisasiProfil />} />
          <Route path="/funder/profil" element={<PendanaProfil />} />
          <Route path="/funder/portofolio" element={<FunderPortofolio />} />
          <Route path="/funder/pengaturan" element={<FunderPengaturan />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </HydrationGate>
      </ToastProvider>
    </StoreProvider>
  );
}
