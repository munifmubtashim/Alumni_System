import type { ReactNode } from "react";
import { App as AntApp, ConfigProvider } from "antd";
import { themeConfig } from "./tokens";

type AppThemeProviderProps = {
  children: ReactNode;
};

export default function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
