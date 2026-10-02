import React from "react";
import { TeamOutlined } from "@ant-design/icons";
import { Avatar, Flex, Typography, theme } from "antd";
import { brandContent } from "../content/brand";

type BrandMarkProps = {
  // Hide the app name (logo only), e.g. on narrow screens.
  compact?: boolean;
  onClick?: () => void;
};

// Logo mark + app name, shared by the sign-in pages and the app header.
const BrandMark: React.FC<BrandMarkProps> = ({ compact = false, onClick }) => {
  const {
    token: { colorPrimary, colorTextLightSolid, marginSM, fontSizeLG },
  } = theme.useToken();

  return (
    <Flex
      align="center"
      gap={marginSM}
      onClick={onClick}
      role={onClick ? "link" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick();
      }}
      aria-label={onClick ? `${brandContent.appName} home` : undefined}
      style={{ cursor: onClick ? "pointer" : undefined, minWidth: 0, flexShrink: 0 }}
    >
      <Avatar
        size="large"
        icon={<TeamOutlined />}
        style={{ backgroundColor: colorPrimary, color: colorTextLightSolid, flexShrink: 0 }}
      />
      {!compact && (
        <Typography.Text strong ellipsis style={{ fontSize: fontSizeLG }}>
          {brandContent.appName}
        </Typography.Text>
      )}
    </Flex>
  );
};

export default BrandMark;
