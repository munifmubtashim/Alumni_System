import type { RegisterInput } from '@alumni/shared';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { register } from '@/services/authApi';
import { setToken } from '@/services/authToken';
import { sessionNoticeAtom } from '@/store/sessionNoticeAtom';

/**
 * Sign-up mutation. Same rule as useLogin: on success only store the token and
 * clear the notice. The returned `user` is not used as the profile; RequireAuth
 * loads ['me'], so a /me failure never shows up as a sign-up error (ADV-004).
 */
export function useRegister() {
  const setNotice = useSetAtom(sessionNoticeAtom);
  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: ({ token }) => {
      setToken(token);
      setNotice(null);
    },
  });
}
