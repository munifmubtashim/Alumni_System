import { useEffect } from "react";
import { useAtom } from "jotai";
import { getMyProfile } from "../services/meApi";
import { accountAtom, toNavAccount } from "../store/accountAtom";

// The signed-in account for the nav bar. Fetched once; My Profile keeps it up to date.
// On failure it stays null and the nav shows a generic avatar (pages handle expired sessions).
export function useAccount() {
  const [account, setAccount] = useAtom(accountAtom);

  useEffect(() => {
    if (account) return;
    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (!cancelled) setAccount(toNavAccount(profile));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [account, setAccount]);

  return account;
}
