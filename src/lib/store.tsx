/* Global state store + localStorage persistence + Auth/RBAC.
   Single source of truth untuk UI di seluruh app. */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { createSeedState } from "./seed";
import type {
  AppState,
  AuditLog,
  Funder,
  Notification,
  Organization,
  Pengajuan,
  Proposal,
  Role,
  Transaction,
  TransactionStatus,
  User,
} from "./types";
import { makeTransactionId, nowIso } from "./format";
import { SUBMISSION_FEE } from "./pengajuan";

const STORAGE_KEY = "sponsorhub-state-v10";

function loadInitial(): AppState {
  if (typeof localStorage === "undefined") return createSeedState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createSeedState();
  try {
    const parsed = JSON.parse(raw) as AppState;
    return { ...createSeedState(), ...parsed };
  } catch {
    return createSeedState();
  }
}

function persist(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — ignore for demo */
  }
}

/* -------- Action types -------- */
type Action =
  | { type: "auth/login"; userId: string }
  | { type: "auth/logout" }
  | { type: "state/replace"; state: AppState }
  | { type: "state/reset" }
  | { type: "proposal/upsert"; proposal: Proposal }
  | { type: "proposal/delete"; id: string }
  | { type: "tx/create"; tx: Transaction }
  | { type: "tx/setStatus"; id: string; status: TransactionStatus; actorId: string; note?: string }
  | { type: "pengajuan/upsert"; pengajuan: Pengajuan }
  | { type: "pengajuan/approve"; id: string }
  | { type: "org/addBalance"; orgId: string; delta: number }
  | { type: "org/update"; orgId: string; patch: Partial<Organization> }
  | { type: "funder/update"; funderId: string; patch: Partial<Funder> }
  | { type: "notification/add"; notification: Notification }
  | { type: "notification/markRead"; id: string }
  | { type: "audit/add"; log: AuditLog };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "auth/login":
      return { ...state, session: { userId: action.userId } };

    case "auth/logout":
      return { ...state, session: { userId: null } };

    case "state/replace":
      return action.state;

    case "state/reset":
      return createSeedState();

    case "proposal/upsert": {
      const exists = state.proposals.some((p) => p.id === action.proposal.id);
      const next = exists
        ? state.proposals.map((p) => (p.id === action.proposal.id ? action.proposal : p))
        : [action.proposal, ...state.proposals];
      return { ...state, proposals: next };
    }

    case "proposal/delete":
      return {
        ...state,
        proposals: state.proposals.filter((p) => p.id !== action.id),
      };

    case "tx/create": {
      const proposal = state.proposals.find((p) => p.id === action.tx.proposalId);
      const funder = state.funders.find((f) => f.id === action.tx.funderId);
      const updatedProposals = proposal
        ? state.proposals.map((p) =>
            p.id === proposal.id
              ? {
                  ...p,
                  raised: Math.min(p.target, p.raised + action.tx.amount),
                  supporters: p.supporters.includes(action.tx.funderId)
                    ? p.supporters
                    : [...p.supporters, action.tx.funderId],
                  status: p.raised + action.tx.amount >= p.target ? "tercapai" : p.status,
                  updatedAt: nowIso(),
                }
              : p,
          )
        : state.proposals;
      const updatedFunders = funder
        ? state.funders.map((f) =>
            f.id === funder.id
              ? { ...f, budgetRemaining: Math.max(0, f.budgetRemaining - action.tx.amount) }
              : f,
          )
        : state.funders;
      return {
        ...state,
        transactions: [action.tx, ...state.transactions],
        proposals: updatedProposals,
        funders: updatedFunders,
      };
    }

    case "tx/setStatus": {
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id
            ? {
                ...t,
                status: action.status,
                verifiedBy: action.status === "disalurkan" ? action.actorId : t.verifiedBy,
                verifiedAt: action.status === "disalurkan" ? nowIso() : t.verifiedAt,
                note: action.note ?? t.note,
              }
            : t,
        ),
      };
    }

    case "pengajuan/upsert": {
      const exists = state.pengajuan.some((p) => p.id === action.pengajuan.id);
      const next = exists
        ? state.pengajuan.map((p) => (p.id === action.pengajuan.id ? action.pengajuan : p))
        : [action.pengajuan, ...state.pengajuan];
      return { ...state, pengajuan: next };
    }

    case "pengajuan/approve": {
      const target = state.pengajuan.find((p) => p.id === action.id);
      if (!target) return state;
      // In-cash: kurangi sisa anggaran pendana (persetujuan = final).
      const updatedFunders =
        target.type === "in_cash" && target.requestedAmount
          ? state.funders.map((f) =>
              f.id === target.funderId
                ? {
                    ...f,
                    budgetRemaining: Math.max(
                      0,
                      f.budgetRemaining - (target.requestedAmount ?? 0),
                    ),
                  }
                : f,
            )
          : state.funders;
      return { ...state, funders: updatedFunders };
    }

    case "org/addBalance":
      return {
        ...state,
        organizations: state.organizations.map((o) =>
          o.id === action.orgId
            ? { ...o, balance: Math.max(0, o.balance + action.delta) }
            : o,
        ),
      };

    case "org/update":
      return {
        ...state,
        organizations: state.organizations.map((o) =>
          o.id === action.orgId ? { ...o, ...action.patch } : o,
        ),
      };

    case "funder/update":
      return {
        ...state,
        funders: state.funders.map((f) =>
          f.id === action.funderId ? { ...f, ...action.patch } : f,
        ),
      };

    case "notification/add":
      return { ...state, notifications: [action.notification, ...state.notifications] };

    case "notification/markRead":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };

    case "audit/add":
      return { ...state, auditLogs: [action.log, ...state.auditLogs] };

    default:
      return state;
  }
}

/* -------- Context -------- */
type StoreContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentUser: User | null;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    persist(state);
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.session.userId) || null,
    [state.users, state.session.userId],
  );

  const value = useMemo(() => ({ state, dispatch, currentUser }), [state, currentUser]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

/* -------- Action creators (untuk dipakai dari komponen) -------- */
export function useActions() {
  const { dispatch, currentUser, state } = useStore();

  return useMemo(
    () => ({
      login(username: string, password: string): { ok: boolean; error?: string } {
        const user = state.users.find(
          (u) =>
            (u.username === username || u.email === username) &&
            u.password === password,
        );
        if (!user) return { ok: false, error: "Username atau kata sandi tidak sesuai." };
        dispatch({ type: "auth/login", userId: user.id });
        return { ok: true };
      },

      logout() {
        dispatch({ type: "auth/logout" });
      },

      resetDemo() {
        dispatch({ type: "state/reset" });
      },

      saveProposal(proposal: Proposal) {
        dispatch({ type: "proposal/upsert", proposal });
        if (currentUser) {
          dispatch({
            type: "audit/add",
            log: {
              id: `log-${Date.now()}`,
              actorId: currentUser.id,
              action: "proposal.diedit",
              entity: "proposal",
              entityId: proposal.id,
              createdAt: nowIso(),
            },
          });
        }
      },

      deleteProposal(id: string) {
        dispatch({ type: "proposal/delete", id });
      },

      createTransaction(input: {
        proposalId: string;
        orgId: string;
        funderId: string;
        amount: number;
      }) {
        const tx: Transaction = {
          id: makeTransactionId(state.transactions.length + 1),
          proposalId: input.proposalId,
          orgId: input.orgId,
          funderId: input.funderId,
          amount: input.amount,
          status: "menunggu",
          createdAt: nowIso(),
        };
        dispatch({ type: "tx/create", tx });
        if (currentUser) {
          dispatch({
            type: "audit/add",
            log: {
              id: `log-${Date.now()}`,
              actorId: currentUser.id,
              action: "transaksi.dibuat",
              entity: "transaksi",
              entityId: tx.id,
              meta: { amount: tx.amount },
              createdAt: nowIso(),
            },
          });
        }
        return tx;
      },

      verifyTransaction(txId: string, note?: string) {
        if (!currentUser) return;
        dispatch({
          type: "tx/setStatus",
          id: txId,
          status: "disalurkan",
          actorId: currentUser.id,
          note,
        });
        dispatch({
          type: "audit/add",
          log: {
            id: `log-${Date.now()}`,
            actorId: currentUser.id,
            action: "transaksi.disalurkan",
            entity: "transaksi",
            entityId: txId,
            createdAt: nowIso(),
          },
        });
        const tx = state.transactions.find((t) => t.id === txId);
        if (tx) {
          const orgUser = state.users.find((u) => u.orgId === tx.orgId);
          const funderUser = state.users.find((u) => u.funderId === tx.funderId);
          [orgUser, funderUser].forEach((u) => {
            if (!u) return;
            dispatch({
              type: "notification/add",
              notification: {
                id: `notif-${Date.now()}-${u.id}`,
                userId: u.id,
                type: "transaksi.disalurkan",
                message: `Transaksi ${tx.id} telah disalurkan ke organisasi.`,
                read: false,
                createdAt: nowIso(),
              },
            });
          });
        }
      },

      rejectTransaction(txId: string, note?: string) {
        if (!currentUser) return;
        dispatch({
          type: "tx/setStatus",
          id: txId,
          status: "ditolak",
          actorId: currentUser.id,
          note,
        });
        dispatch({
          type: "audit/add",
          log: {
            id: `log-${Date.now()}`,
            actorId: currentUser.id,
            action: "transaksi.ditolak",
            entity: "transaksi",
            entityId: txId,
            createdAt: nowIso(),
          },
        });
      },

      processTransaction(txId: string) {
        if (!currentUser) return;
        dispatch({
          type: "tx/setStatus",
          id: txId,
          status: "diproses",
          actorId: currentUser.id,
        });
        dispatch({
          type: "audit/add",
          log: {
            id: `log-${Date.now()}`,
            actorId: currentUser.id,
            action: "transaksi.diproses",
            entity: "transaksi",
            entityId: txId,
            createdAt: nowIso(),
          },
        });
      },

      /* ---------- Pengajuan terarah (Org → Pendana) ---------- */

      savePengajuan(pengajuan: Pengajuan) {
        dispatch({ type: "pengajuan/upsert", pengajuan });
        if (currentUser) {
          dispatch({
            type: "audit/add",
            log: {
              id: `log-${Date.now()}`,
              actorId: currentUser.id,
              action: "pengajuan.dibuat",
              entity: "pengajuan",
              entityId: pengajuan.id,
              createdAt: nowIso(),
            },
          });
        }
      },

      topUpOrg(amount: number) {
        if (!currentUser?.orgId || amount <= 0) return;
        dispatch({ type: "org/addBalance", orgId: currentUser.orgId, delta: amount });
      },

      updateOrgProfile(patch: Partial<Organization>) {
        if (!currentUser?.orgId) return;
        dispatch({ type: "org/update", orgId: currentUser.orgId, patch });
        dispatch({
          type: "audit/add",
          log: {
            id: `log-${Date.now()}`,
            actorId: currentUser.id,
            action: "akun.diverifikasi",
            entity: "organisasi",
            entityId: currentUser.orgId,
            createdAt: nowIso(),
          },
        });
      },

      updateFunderProfile(patch: Partial<Funder>) {
        if (!currentUser?.funderId) return;
        dispatch({ type: "funder/update", funderId: currentUser.funderId, patch });
        dispatch({
          type: "audit/add",
          log: {
            id: `log-${Date.now()}`,
            actorId: currentUser.id,
            action: "akun.diverifikasi",
            entity: "pendana",
            entityId: currentUser.funderId,
            createdAt: nowIso(),
          },
        });
      },

      submitPengajuan(p: Pengajuan) {
        if (!currentUser) return;
        // Biaya pengajuan hanya ditarik saat pertama kali dikirim (dari draf).
        const isFirstSubmit = p.status === "draf";
        const updated: Pengajuan = {
          ...p,
          status: "diajukan",
          revisionNote: undefined,
          updatedAt: nowIso(),
          history: [
            ...p.history,
            {
              action: p.status === "perlu_revisi" ? "Diajukan ulang" : "Diajukan ke pendana",
              actor: "Organisasi",
              note: isFirstSubmit
                ? `Pengajuan dikirim ke pendana. Biaya pengajuan ${SUBMISSION_FEE.toLocaleString("id-ID")} dipotong dari saldo.`
                : "Pengajuan dikirim ke pendana untuk ditinjau.",
              at: nowIso(),
            },
          ],
        };
        dispatch({ type: "pengajuan/upsert", pengajuan: updated });
        if (isFirstSubmit) {
          dispatch({ type: "org/addBalance", orgId: p.orgId, delta: -SUBMISSION_FEE });
        }
        dispatch({
          type: "audit/add",
          log: {
            id: `log-${Date.now()}`,
            actorId: currentUser.id,
            action: "pengajuan.diajukan",
            entity: "pengajuan",
            entityId: p.id,
            createdAt: nowIso(),
          },
        });
        const funderUser = state.users.find((u) => u.funderId === p.funderId);
        if (funderUser) {
          dispatch({
            type: "notification/add",
            notification: {
              id: `notif-${Date.now()}`,
              userId: funderUser.id,
              type: "pengajuan.diajukan",
              message: `Pengajuan baru "${p.eventName}" menunggu tinjauan Anda.`,
              read: false,
              createdAt: nowIso(),
            },
          });
        }
      },

      approvePengajuan(id: string) {
        if (!currentUser) return;
        const p = state.pengajuan.find((x) => x.id === id);
        if (!p) return;
        const updated: Pengajuan = {
          ...p,
          status: "disetujui",
          updatedAt: nowIso(),
          history: [
            ...p.history,
            {
              action: "Disetujui pendana",
              actor: "Pendana",
              note: "Pendana menyetujui pengajuan. Kesepakatan final.",
              at: nowIso(),
            },
          ],
        };
        dispatch({ type: "pengajuan/upsert", pengajuan: updated });
        dispatch({ type: "pengajuan/approve", id });
        dispatch({
          type: "audit/add",
          log: {
            id: `log-${Date.now()}`,
            actorId: currentUser.id,
            action: "pengajuan.disetujui",
            entity: "pengajuan",
            entityId: id,
            meta: { amount: p.requestedAmount ?? 0, type: p.type },
            createdAt: nowIso(),
          },
        });
        const orgUser = state.users.find((u) => u.orgId === p.orgId);
        if (orgUser) {
          dispatch({
            type: "notification/add",
            notification: {
              id: `notif-${Date.now()}`,
              userId: orgUser.id,
              type: "pengajuan.disetujui",
              message: `Pengajuan "${p.eventName}" disetujui pendana.`,
              read: false,
              createdAt: nowIso(),
            },
          });
        }
      },

      rejectPengajuan(id: string, note: string) {
        if (!currentUser) return;
        const p = state.pengajuan.find((x) => x.id === id);
        if (!p) return;
        const updated: Pengajuan = {
          ...p,
          status: "ditolak",
          updatedAt: nowIso(),
          history: [
            ...p.history,
            {
              action: "Ditolak pendana",
              actor: "Pendana",
              note: note || "Pendana menolak pengajuan.",
              at: nowIso(),
            },
          ],
        };
        dispatch({ type: "pengajuan/upsert", pengajuan: updated });
        dispatch({
          type: "audit/add",
          log: {
            id: `log-${Date.now()}`,
            actorId: currentUser.id,
            action: "pengajuan.ditolak",
            entity: "pengajuan",
            entityId: id,
            createdAt: nowIso(),
          },
        });
        const orgUser = state.users.find((u) => u.orgId === p.orgId);
        if (orgUser) {
          dispatch({
            type: "notification/add",
            notification: {
              id: `notif-${Date.now()}`,
              userId: orgUser.id,
              type: "pengajuan.ditolak",
              message: `Pengajuan "${p.eventName}" ditolak pendana.`,
              read: false,
              createdAt: nowIso(),
            },
          });
        }
      },

      requestRevisionPengajuan(id: string, note: string) {
        if (!currentUser) return;
        const p = state.pengajuan.find((x) => x.id === id);
        if (!p) return;
        const updated: Pengajuan = {
          ...p,
          status: "perlu_revisi",
          revisionNote: note,
          updatedAt: nowIso(),
          history: [
            ...p.history,
            {
              action: "Diminta revisi",
              actor: "Pendana",
              note: note || "Pendana meminta revisi.",
              at: nowIso(),
            },
          ],
        };
        dispatch({ type: "pengajuan/upsert", pengajuan: updated });
        dispatch({
          type: "audit/add",
          log: {
            id: `log-${Date.now()}`,
            actorId: currentUser.id,
            action: "pengajuan.revisi",
            entity: "pengajuan",
            entityId: id,
            createdAt: nowIso(),
          },
        });
        const orgUser = state.users.find((u) => u.orgId === p.orgId);
        if (orgUser) {
          dispatch({
            type: "notification/add",
            notification: {
              id: `notif-${Date.now()}`,
              userId: orgUser.id,
              type: "pengajuan.revisi",
              message: `Pengajuan "${p.eventName}" perlu direvisi.`,
              read: false,
              createdAt: nowIso(),
            },
          });
        }
      },

      addNotification(n: Notification) {
        dispatch({ type: "notification/add", notification: n });
      },

      markNotificationRead(id: string) {
        dispatch({ type: "notification/markRead", id });
      },
    }),
    [dispatch, currentUser, state],
  );
}

/* -------- Selectors -------- */
export const rolePath: Record<Role, string> = {
  admin: "/admin/dashboard",
  org: "/org/dashboard",
  funder: "/funder/pengajuan",
};
