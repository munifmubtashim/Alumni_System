/** Product name shown in the header, the auth panel and the tab title. */
export const BRAND_NAME = 'Alma';

/** Where members write for help, e.g. a password reset. */
export const SUPPORT_EMAIL = 'support@alma.app';

/** Subject line prefilled in the "Forgot password?" support email. */
export const PASSWORD_RESET_SUBJECT = 'Password reset request';

/** A `mailto:` link to support with `subject` URL-encoded. */
export function supportMailto(subject: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
