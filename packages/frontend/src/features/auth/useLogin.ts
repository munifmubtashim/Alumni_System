import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { login } from '@/services/authApi';
import { setToken } from '@/services/authToken';
import { sessionNoticeAtom } from '@/store/sessionNoticeAtom';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Log-in mutation. On success it only stores the token and clears the session
 * notice: no /me fetch and no navigation. GuestOnly sees the token appear and
 * owns the redirect (ADV-003/004).
 */
export function useLogin() {
  const setNotice = useSetAtom(sessionNoticeAtom);
  return useMutation({
    mutationFn: ({ email, password }: LoginCredentials) => login(email, password),
    onSuccess: ({ token }) => {
      setToken(token);
      setNotice(null);
    },
  });
}
