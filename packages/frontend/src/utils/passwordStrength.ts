export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
};

const LABELS: PasswordStrength["label"][] = ["Too short", "Weak", "Fair", "Good", "Strong"];

// Guidance only (the hard rule is 8–72 characters, enforced by the form and the API).
// 8+ chars scores 1; each of: 12+ chars, mixed case, a digit, a symbol adds 1 (max 4).
export function passwordStrength(password: string): PasswordStrength {
  if (password.length < 8) return { score: 0, label: LABELS[0] };
  const extras = [
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const score = Math.min(4, 1 + extras) as PasswordStrength["score"];
  return { score, label: LABELS[score] };
}
