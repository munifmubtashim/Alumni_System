import type { ThemeConfig } from "antd";

// Single source of truth for colors, radii and typography.
// Components read these via theme.useToken() — never hardcode values.
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#1d4ed8",
    colorInfo: "#1d4ed8",
    colorSuccess: "#16a34a",
    colorWarning: "#d97706",
    colorError: "#dc2626",
    colorBgLayout: "#f5f7fa",
    borderRadius: 8,
    borderRadiusLG: 12,
    fontSize: 14,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerBg: "#0f172a",
      headerPadding: "0 24px",
    },
    Menu: {
      darkItemBg: "#0f172a",
    },
  },
};

// Layout sizes that have no antd token equivalent.
export const layoutTokens = {
  contentMaxWidth: 1200,
  mobileDrawerSize: "80vw",
};
