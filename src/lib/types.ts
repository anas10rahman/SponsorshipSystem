/* Model data sesuai PRD §6 — sumber kebenaran tunggal. */

export type Role = "admin" | "org" | "funder";

export type User = {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string; // demo-only, plain text
  role: Role;
  orgId?: string;
  funderId?: string;
  createdAt: string;
};

/** Penanggung jawab (PIC) organisasi. */
export type OrgPic = {
  name: string;
  phone: string; // no.WA aktif PIC
  position: string; // jabatan di organisasi
  email: string; // email PIC
  idDocUrl: string; // KTP/KTM (PDF) — wajib
};

/** Status verifikasi organisasi oleh admin (gate pengajuan). */
export type OrgVerificationStatus = "belum_diajukan" | "menunggu" | "terverifikasi" | "ditolak";

export type Organization = {
  id: string;
  name: string;
  category: string;
  city: string;
  logoInitials: string;
  logoUrl?: string; // logo organisasi (data URL/base64) — opsional, fallback ke inisial
  verified: boolean;
  verificationStatus: OrgVerificationStatus;
  verificationNote?: string; // alasan bila ditolak admin
  legalDocs: string[];
  payoutAccount: string;
  balance: number; // saldo untuk biaya pengajuan
  phone: string; // no.hp kontak (ber-gate ke lawan) — disinkronkan dari PIC
  // Profil publik
  email: string;
  description: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string; // X (legacy)
  facebook?: string; // legacy
  // Penanggung jawab
  pic: OrgPic;
};

export type FunderType = "Korporasi" | "Individu" | "Filantropi" | "Perbankan";

/** Penanggung jawab (PIC) pendana. */
export type FunderPic = {
  name: string;
  phone: string; // no.WA aktif PIC
  position: string; // jabatan
  email: string;
};

export type Funder = {
  id: string;
  name: string;
  type: FunderType;
  focus: string[];
  budgetTotal: number;
  budgetRemaining: number;
  phone: string; // no.hp kontak (ber-gate ke lawan) — disinkronkan dari PIC
  // Profil publik
  email: string;
  description: string;
  website?: string;
  instagram?: string;
  twitter?: string; // X
  facebook?: string;
  logoUrl?: string; // logo pendana (data URL/base64), opsional
  // Penanggung jawab
  pic: FunderPic;
};

export type ProposalStatus = "draf" | "aktif" | "tercapai" | "arsip";

export type Proposal = {
  id: string;
  orgId: string;
  title: string;
  category: string;
  city: string;
  description: string;
  benefits: string[];
  target: number;
  raised: number;
  status: ProposalStatus;
  supporters: string[]; // funderId[]
  proposalDocUrl?: string;
  createdAt: string;
  updatedAt: string;
};

/* PRD §6 + §7: state machine `menunggu → diproses → disalurkan` (sukses)
   atau `menunggu → ditolak` (oleh Admin). */
export type TransactionStatus = "menunggu" | "diproses" | "disalurkan" | "ditolak";

export type Transaction = {
  id: string; // TRX-YYYY-MMDD-XXXX
  proposalId: string;
  orgId: string;
  funderId: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  verifiedBy?: string; // userId admin
  verifiedAt?: string;
  note?: string;
};

/* ============================================================
   Pengajuan (directed): Organisasi → Pendana spesifik.
   Berbeda dari Proposal (katalog publik). PRD flow D + ekspansi.
   ============================================================ */

/** Jenis detail permintaan pada satu poin paket. */
export type SponsorshipRequestType = "in_cash" | "in_kind";

/** Satu poin "detail permintaan" pada paket.
 *  - in_cash: nominal dana tunai (amount), spec kosong.
 *  - in_kind: spesifikasi barang/jasa (spec), amount 0. */
export type SponsorshipRequest = {
  type: SponsorshipRequestType;
  amount: number; // Rp — hanya untuk in_cash
  spec: string; // spesifikasi barang — hanya untuk in_kind
};

/** Satu paket sponsorship yang ditawarkan organisasi ke pendana.
 *  Pendana memilih SATU paket saat menyetujui pengajuan.
 *  Nominal paket = jumlah seluruh poin in_cash (turunan, tidak disimpan). */
export type SponsorshipPackage = {
  name: string; // Nama paket (mis. "Gold")
  requests: SponsorshipRequest[]; // Detail permintaan ke pendana (per poin, bertipe)
  benefits: string[]; // Benefit untuk pendana (per poin)
};

/** Satu dokumen pendukung (PDF). `data` (data URL base64) hanya ada saat
 *  berkas baru diunggah atau diambil lazy via /api/pengajuan-doc; di AppState
 *  hanya `name` yang disertakan agar payload ringan. */
export type PengajuanDoc = {
  name: string;
  data?: string;
};

/* Lifecycle pengajuan terarah:
   draf → diajukan → (perlu_revisi → diajukan)* → disetujui | ditolak
   Persetujuan pendana bersifat FINAL (admin hanya memantau). */
export type PengajuanStatus =
  | "draf"
  | "diajukan"
  | "perlu_revisi"
  | "disetujui"
  | "ditolak";

export type PengajuanEvent = {
  action: string;
  actor: "Organisasi" | "Pendana" | "Admin";
  note: string;
  at: string;
};

export type Pengajuan = {
  id: string;
  orgId: string;
  funderId: string;
  // Informasi event
  eventName: string;
  eventLocation: string;
  eventDate?: string;
  description: string;
  eventBudget: number;
  // Detail sponsorship — daftar paket yang ditawarkan
  packages: SponsorshipPackage[];
  selectedPackage?: number; // index paket yang dipilih pendana saat menyetujui
  // Dokumen pendukung (bisa lebih dari satu berkas PDF)
  documents: PengajuanDoc[];
  extraNote?: string;
  // Lifecycle
  status: PengajuanStatus;
  revisionNote?: string;
  history: PengajuanEvent[];
  createdAt: string;
  updatedAt: string;
};

export type AuditAction =
  | "transaksi.dibuat"
  | "transaksi.diproses"
  | "transaksi.disalurkan"
  | "transaksi.ditolak"
  | "proposal.dipublikasi"
  | "proposal.diarsip"
  | "proposal.diedit"
  | "proposal.dibuat"
  | "ajuan.dikirim"
  | "akun.diverifikasi"
  | "pengajuan.dibuat"
  | "pengajuan.diajukan"
  | "pengajuan.disetujui"
  | "pengajuan.ditolak"
  | "pengajuan.revisi";

export type AuditLog = {
  id: string;
  actorId: string;
  action: AuditAction;
  entity: "transaksi" | "proposal" | "organisasi" | "pendana" | "ajuan" | "pengajuan";
  entityId: string;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export type NotificationType =
  | "transaksi.menunggu"
  | "transaksi.disalurkan"
  | "transaksi.ditolak"
  | "proposal.tercapai"
  | "ajuan.diterima"
  | "pengajuan.diajukan"
  | "pengajuan.disetujui"
  | "pengajuan.ditolak"
  | "pengajuan.revisi"
  | "verifikasi.diajukan"
  | "verifikasi.disetujui"
  | "verifikasi.ditolak";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
};

export type AppState = {
  users: User[];
  organizations: Organization[];
  funders: Funder[];
  proposals: Proposal[];
  transactions: Transaction[];
  pengajuan: Pengajuan[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  session: { userId: string | null };
};
