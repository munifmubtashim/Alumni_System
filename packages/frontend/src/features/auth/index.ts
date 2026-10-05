export { GuestOnly, RequireAuth } from './guards';
export { resolveFrom } from './redirect';
export { SessionBridge } from './SessionBridge';
export { useCurrentUser, CURRENT_USER_QUERY_KEY } from './useCurrentUser';
export { useHasSession, useLiveToken } from './useHasSession';
export { useLogin } from './useLogin';
export type { LoginCredentials } from './useLogin';
export { useLogout } from './useLogout';
export { useRegister } from './useRegister';
export {
  EMAIL_TAKEN_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  UNEXPECTED_MESSAGE,
  UNREACHABLE_MESSAGE,
  mapLoginError,
  mapRegisterError,
} from './authErrors';
export type { AuthFormError } from './authErrors';
export { toRegisterInput, validateLogin, validateRegister } from './validation';
export type { LoginErrors, LoginValues, RegisterErrors, RegisterValues } from './validation';
