import { createContext, useContext } from "react";

/** State drawer navigasi mobile — dibagi antara Shell (pemilik state),
 *  Sidebar (drawer) dan Topbar (tombol hamburger). Di desktop tak dipakai. */
export type MobileNavValue = { open: boolean; setOpen: (v: boolean) => void };

export const MobileNavContext = createContext<MobileNavValue>({
  open: false,
  setOpen: () => {},
});

export const useMobileNav = () => useContext(MobileNavContext);
