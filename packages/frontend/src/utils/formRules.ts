import type { FormRule } from "antd";

const MAX_YEAR = new Date().getFullYear() + 10;

// Mirrors the server: optional 4-digit year between 1900 and ten years from now.
export const graduationYearRule: FormRule = {
  validator: (_, value?: string) => {
    if (!value) return Promise.resolve();
    const year = Number(value);
    return /^\d{4}$/.test(value) && year >= 1900 && year <= MAX_YEAR
      ? Promise.resolve()
      : Promise.reject(new Error(`Enter a year between 1900 and ${MAX_YEAR}`));
  },
};

// Mirrors the server: optional http(s) URL, max 255 characters.
export const webUrlRules: FormRule[] = [
  { type: "url", message: "Please enter a valid URL" },
  { pattern: /^https?:\/\//i, message: "Must start with http:// or https://" },
  { max: 255 },
];
