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
      {
        id: "u-funder-2",
        name: "Sari Wijaya",
        email: "pendana2@sponsorhub.test",
        username: "pendana2",
        password: "Akundemo12345",
        role: "funder",
        funderId: "fund-2",
        createdAt: NOW,
      },
      {
        id: "u-funder-3",
        name: "Andi Pratama",
        email: "pendana3@sponsorhub.test",
        username: "pendana3",
        password: "Akundemo12345",
        role: "funder",
        funderId: "fund-3",
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
        phone: "0812-3456-7890",
        email: "halo@yayasansenibudaya.org",
        description:
          "Yayasan nirlaba yang mewadahi seniman muda lewat festival, pameran, dan lokakarya seni budaya nusantara.",
        website: "yayasansenibudaya.org",
        instagram: "@senibudaya.id",
        twitter: "@senibudaya",
        facebook: "YayasanSeniBudaya",
        pic: {
          name: "Rani Prameswari",
          phone: "0812-3456-7890",
          position: "Direktur Program",
          email: "rani@yayasansenibudaya.org",
          idDocUrl: "ktp-rani-prameswari.pdf",
        },
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
        phone: "0815-1111-2222",
        email: "csr@sinerginusantara.co.id",
        description:
          "Perusahaan teknologi yang menjalankan program CSR di bidang pendidikan digital dan inovasi anak muda.",
        website: "sinerginusantara.co.id",
        instagram: "@sinergi.nusantara",
        twitter: "@sinerginusantara",
        facebook: "SinergiNusantara",
        pic: {
          name: "Budi Santoso",
          phone: "0815-1111-2222",
          position: "Manajer CSR",
          email: "budi@sinerginusantara.co.id",
        },
      },
      {
        id: "fund-2",
        name: "Yayasan Cahaya",
        type: "Filantropi",
        focus: ["Pendidikan", "Kesehatan"],
        budgetTotal: 500_000_000,
        budgetRemaining: 500_000_000,
        phone: "0816-3333-4444",
        email: "kontak@yayasancahaya.org",
        description:
          "Yayasan filantropi yang mendukung program pendidikan dan kesehatan masyarakat prasejahtera.",
        website: "yayasancahaya.org",
        instagram: "@yayasancahaya",
        pic: {
          name: "Sari Wijaya",
          phone: "0816-3333-4444",
          position: "Direktur Program",
          email: "sari@yayasancahaya.org",
        },
      },
      {
        id: "fund-3",
        name: "Bank Daya",
        type: "Perbankan",
        focus: ["Olahraga", "Komunitas"],
        budgetTotal: 2_000_000_000,
        budgetRemaining: 2_000_000_000,
        phone: "0817-5555-6666",
        email: "sponsorship@bankdaya.co.id",
        description:
          "Bank nasional dengan program sponsorship untuk olahraga dan kegiatan komunitas di seluruh Indonesia.",
        website: "bankdaya.co.id",
        instagram: "@bankdaya",
        twitter: "@bankdaya",
        facebook: "BankDaya",
        pic: {
          name: "Andi Pratama",
          phone: "0817-5555-6666",
          position: "Head of Sponsorship",
          email: "andi@bankdaya.co.id",
        },
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
