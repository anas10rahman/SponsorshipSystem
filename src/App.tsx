import { Navigate, Route, Routes } from "react-router-dom";
import { StoreProvider, rolePath, useStore } from "./lib/store";
import { RoleGuard } from "./components/RoleGuard";
import { Shell } from "./components/Shell";
import { ToastProvider } from "./components/Toast";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrganisasi from "./pages/admin/Organisasi";
import AdminPendana from "./pages/admin/Pendana";
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
import FunderPortofolio from "./pages/funder/Portofolio";
import FunderPengaturan from "./pages/funder/Pengaturan";

function RootRedirect() {
  const { currentUser } = useStore();
  return <Navigate to={currentUser ? rolePath[currentUser.role] : "/login"} replace />;
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

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
          <Route path="/funder/organisasi/:id" element={<OrganisasiProfil />} />
          <Route path="/funder/profil" element={<PendanaProfil />} />
          <Route path="/funder/portofolio" element={<FunderPortofolio />} />
          <Route path="/funder/pengaturan" element={<FunderPengaturan />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </ToastProvider>
    </StoreProvider>
  );
}
