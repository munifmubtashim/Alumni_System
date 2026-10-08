import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { login } from '@/services/authApi';
import { setToken } from '@/services/authToken';
import { sessionNoticeAtom } from '@/store/sessionNoticeAtom';
import { TokenNotSavedError } from './authErrors';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Log-in mutation. It only stores the token and clears the session notice: no
 * /me fetch and no navigation. GuestOnly sees the token appear and owns the
 * redirect (ADV-003/004). If the browser refuses to store the token, the
 * mutation fails with TokenNotSavedError.
 */
export function useLogin() {
  const setNotice = useSetAtom(sessionNoticeAtom);
  return useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      const response = await login(email, password);
      // A token that can't be stored is no session: fail the submit (CORR-001).
      if (!setToken(response.token)) throw new TokenNotSavedError();
      return response;
    },
    onSuccess: () => {
      setNotice(null);
    },
  });
}
