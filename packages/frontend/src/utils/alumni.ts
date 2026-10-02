// Display helpers shared by alumni components.

export function initials(name?: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// Only render links we know are web URLs (older rows were never validated).
export const isWebUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

export const ROLE_LABELS: Record<string, string> = { admin: "Admin", alumni: "Alumni", student: "Student" };
