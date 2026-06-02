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

export type Organization = {
  id: string;
  name: string;
  category: string;
  city: string;
  logoInitials: string;
  verified: boolean;
  legalDocs: string[];
  payoutAccount: string;
};

export type FunderType = "Korporasi" | "Individu" | "Filantropi" | "Perbankan";

export type Funder = {
  id: string;
  name: string;
  type: FunderType;
  focus: string[];
  budgetTotal: number;
  budgetRemaining: number;
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

export type SponsorshipType = "in_cash" | "in_kind";

export type InKindItem = {
  name: string;
  qty: number;
  unit: string;
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
  // Detail sponsorship
  type: SponsorshipType;
  requestedAmount?: number; // in_cash
  inKindItems?: InKindItem[]; // in_kind
  benefits: string[];
  // Dokumen
  proposalDocUrl?: string;
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
  | "pengajuan.revisi";

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
