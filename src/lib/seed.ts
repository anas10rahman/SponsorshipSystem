/* Seed data — clean slate.
   Menyimpan: 3 akun login demo, profil organisasi milik akun login,
   dan daftar pendana (funders). Semua data transaksional dikosongkan
   agar bisa diisi data nyata.
   Sisa anggaran tiap pendana = anggaran total (belum ada komitmen). */

import type { AppState } from "./types";

const NOW = new Date().toISOString();

export function createSeedState(): AppState {
  return {
    users: [
      {
        id: "u-admin",
        name: "Maya Admin",
        email: "admin@sponsorhub.test",
        username: "Admin",
        password: "Akundemo12345",
        role: "admin",
        createdAt: NOW,
      },
      {
        id: "u-org",
        name: "Rani Prameswari",
        email: "organisasi@sponsorhub.test",
        username: "organisasi",
        password: "Akundemo12345",
        role: "org",
        orgId: "org-1",
        createdAt: NOW,
      },
      {
        id: "u-funder",
        name: "Budi Santoso",
        email: "pendana@sponsorhub.test",
        username: "pendana",
        password: "Akundemo12345",
        role: "funder",
        funderId: "fund-1",
        createdAt: NOW,
      },
    ],

    // Profil organisasi milik akun login "organisasi".
    organizations: [
      {
        id: "org-1",
        name: "Yayasan Seni Budaya",
        category: "Seni & Budaya",
        city: "Jakarta",
        logoInitials: "YS",
        verified: true,
        legalDocs: ["akta-yayasan.pdf", "skt-kemenkumham.pdf"],
        payoutAccount: "BCA 0123456789",
        balance: 100_000,
      },
    ],

    // Daftar pendana — dipertahankan.
    funders: [
      {
        id: "fund-1",
        name: "Sinergi Nusantara",
        type: "Korporasi",
        focus: ["Teknologi", "Edukasi"],
        budgetTotal: 1_000_000_000,
        budgetRemaining: 1_000_000_000,
      },
      {
        id: "fund-2",
        name: "Yayasan Cahaya",
        type: "Filantropi",
        focus: ["Pendidikan", "Kesehatan"],
        budgetTotal: 500_000_000,
        budgetRemaining: 500_000_000,
      },
      {
        id: "fund-3",
        name: "Bank Daya",
        type: "Perbankan",
        focus: ["Olahraga", "Komunitas"],
        budgetTotal: 2_000_000_000,
        budgetRemaining: 2_000_000_000,
      },
    ],

    // Data transaksional — kosong.
    proposals: [],
    transactions: [],
    pengajuan: [],
    auditLogs: [],
    notifications: [],

    session: { userId: null },
  };
}
