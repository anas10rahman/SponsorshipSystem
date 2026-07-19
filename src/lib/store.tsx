/* Global store — server-backed (Neon Postgres via /api).
   Server = sumber kebenaran. Store ini cache yang dihidrasi dari /api/state.
   Setiap mutasi memanggil API yang mengembalikan full AppState → state/replace.
   Hanya session.userId yang disimpan di localStorage (agar tetap login saat refresh). */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { AppState, Funder, Organization, Pengajuan, Role, User } from "./types";
import { api } from "./api";

const SESSION_KEY = "sponsorhub-session";

function loadSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
function saveSessionUserId(id: string | null) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function blankState(): AppState {
  return {
    users: [],
    organizations: [],
    funders: [],
    proposals: [],
    transactions: [],
    pengajuan: [],
    auditLogs: [],
    notifications: [],
    session: { userId: loadSessionUserId() },
  };
}

/* -------- Reducer -------- */
type Action =
  | { type: "hydrate"; data: AppState } // ganti DATA, pertahankan session
  | { type: "auth/login"; userId: string }
  | { type: "auth/logout" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return { ...action.data, session: state.session };
    case "auth/login":
      saveSessionUserId(action.userId);
      return { ...state, session: { userId: action.userId } };
    case "auth/logout":
      saveSessionUserId(null);
      return { ...state, session: { userId: null } };
    default:
      return state;
  }
}

type Status = "loading" | "ready" | "error";

type StoreContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentUser: User | null;
  status: Status;
  errorMsg: string;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, blankState);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .getState()
      .then((data) => {
        if (!alive) return;
        dispatch({ type: "hydrate", data });
        setStatus("ready");
      })
      .catch((e) => {
        if (!alive) return;
        setErrorMsg(String(e?.message || e));
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.session.userId) || null,
    [state.users, state.session.userId],
  );

  const value = useMemo(
    () => ({ state, dispatch, currentUser, status, errorMsg }),
    [state, currentUser, status, errorMsg],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

/* -------- Action creators (async, server-backed) -------- */
export function useActions() {
  const { dispatch, currentUser } = useStore();

  return useMemo(() => {
    const apply = (data: AppState) => dispatch({ type: "hydrate", data });
    const actorId = () => currentUser?.id;

    return {
      async login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
        try {
          const { user } = await api.login(username.trim(), password);
          dispatch({ type: "auth/login", userId: user.id });
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: String(e?.message || "Login gagal.") };
        }
      },

      async register(
        payload: Record<string, unknown>,
      ): Promise<{ ok: boolean; error?: string }> {
        try {
          const { userId, state } = await api.register(payload);
          dispatch({ type: "hydrate", data: state }); // masukkan entitas+user baru
          dispatch({ type: "auth/login", userId }); // langsung login
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: String(e?.message || "Registrasi gagal.") };
        }
      },

      logout() {
        dispatch({ type: "auth/logout" });
      },

      // ---- Pengajuan terarah ----
      async savePengajuan(pengajuan: Pengajuan) {
        apply(await api.pengajuan({ op: "save", pengajuan }));
      },
      async submitPengajuan(pengajuan: Pengajuan) {
        apply(await api.pengajuan({ op: "submit", pengajuan, actorId: actorId() }));
      },
      async approvePengajuan(id: string, selectedPackage: number) {
        apply(await api.pengajuan({ op: "approve", id, selectedPackage, actorId: actorId() }));
      },
      async rejectPengajuan(id: string, note: string) {
        apply(await api.pengajuan({ op: "reject", id, note, actorId: actorId() }));
      },
      async requestRevisionPengajuan(id: string, note: string) {
        apply(await api.pengajuan({ op: "feedback", id, note, actorId: actorId() }));
      },

      // ---- Organisasi ----
      async updateOrgProfile(org: Organization) {
        apply(await api.org({ op: "update", org }));
      },
      async topUpOrg(amount: number) {
        if (!currentUser?.orgId || amount <= 0) return;
        apply(await api.org({ op: "topup", orgId: currentUser.orgId, amount }));
      },

      // ---- Pendana ----
      async updateFunderProfile(funder: Funder) {
        apply(await api.funder({ op: "update", funder }));
      },

      // ---- Notifikasi ----
      async markNotificationRead(id: string) {
        apply(await api.notifications({ op: "read", id }));
      },
    };
  }, [dispatch, currentUser]);
}

/* -------- Selectors -------- */
export const rolePath: Record<Role, string> = {
  admin: "/admin/dashboard",
  org: "/org/dashboard",
  funder: "/funder/pengajuan",
};
