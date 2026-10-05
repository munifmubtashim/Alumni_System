import type { RegisterInput } from '@alumni/shared';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { register } from '@/services/authApi';
import { setToken } from '@/services/authToken';
import { sessionNoticeAtom } from '@/store/sessionNoticeAtom';
import { TokenNotSavedError } from './authErrors';

/**
 * Sign-up mutation. Same rule as useLogin: only store the token and clear the
 * notice, failing with TokenNotSavedError if the token can't be stored. The returned `user` is not used as the profile; RequireAuth
 * loads ['me'], so a /me failure never shows up as a sign-up error (ADV-004).
 */
export function useRegister() {
  const setNotice = useSetAtom(sessionNoticeAtom);
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const response = await register(input);
      // A token that can't be stored is no session: fail the submit (CORR-001).
      if (!setToken(response.token)) throw new TokenNotSavedError();
      return response;
    },
    onSuccess: () => {
      setNotice(null);
    },
  });
}
