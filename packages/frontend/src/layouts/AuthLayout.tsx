import type { ReactNode } from "react";
import { Col, Flex, Grid, Row, Typography, theme } from "antd";
import BrandMark from "../components/BrandMark";
import { brandContent } from "../content/brand";
import { layoutTokens } from "../theme/tokens";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

// Minimal split-screen shell for the sign-in pages: a quiet neutral brand panel on md+,
// and just the logo + name above the form on phones.
export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const screens = Grid.useBreakpoint();
  const isWide = !!screens.md;
  const {
    token: {
      colorBgContainer,
      colorBorderSecondary,
      lineWidth,
      padding,
      paddingLG,
      paddingXL,
      margin,
      marginXS,
      marginLG,
    },
  } = theme.useToken();

  const brand = <BrandMark />;

  return (
    <Row style={{ minHeight: "100vh", background: colorBgContainer }}>
      {/* md+: neutral brand panel */}
      <Col
        xs={0}
        md={10}
        lg={12}
        style={{
          background: layoutTokens.authPanelBg,
          borderInlineEnd: `${lineWidth}px solid ${colorBorderSecondary}`,
        }}
      >
        <Flex vertical style={{ position: "sticky", top: 0, minHeight: "100vh", padding: paddingXL }}>
          {brand}
          <Flex vertical justify="center" style={{ flex: 1, maxWidth: layoutTokens.authFormMaxWidth }}>
            <Typography.Title level={3} style={{ marginBottom: marginXS }}>
              {brandContent.headline}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {brandContent.intro}
            </Typography.Paragraph>
          </Flex>
        </Flex>
      </Col>

      {/* Form side */}
      <Col xs={24} md={14} lg={12}>
        <Flex
          vertical
          justify="center"
          style={{
            minHeight: "100vh",
            padding: isWide ? paddingXL : `${paddingLG}px ${padding}px`,
          }}
        >
          <div style={{ width: "100%", maxWidth: layoutTokens.authFormMaxWidth, margin: "0 auto" }}>
            {!isWide && <div style={{ marginBottom: marginLG }}>{brand}</div>}
            <Typography.Title level={2} style={{ marginBottom: marginXS }}>
              {title}
            </Typography.Title>
            {subtitle && (
              <Typography.Paragraph type="secondary" style={{ marginBottom: marginLG }}>
                {subtitle}
              </Typography.Paragraph>
            )}
            {children}
            {footer && (
              <Typography.Paragraph type="secondary" style={{ marginTop: margin, marginBottom: 0, textAlign: "center" }}>
                {footer}
              </Typography.Paragraph>
            )}
          </div>
        </Flex>
      </Col>
    </Row>
  );
}
