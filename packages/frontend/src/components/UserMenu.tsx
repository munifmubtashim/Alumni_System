import React from "react";
import { DownOutlined, LockOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Flex, Typography, theme } from "antd";
import type { NavAccount } from "../store/accountAtom";
import { layoutTokens } from "../theme/tokens";
import { initials, ROLE_LABELS } from "../utils/alumni";

export type UserMenuAction = "profile" | "password" | "logout";

type UserMenuProps = {
  account: NavAccount | null;
  // Show the name next to the avatar (desktop).
  showName?: boolean;
  onAction: (action: UserMenuAction) => void;
};

// Avatar button in the header that opens the account menu.
const UserMenu: React.FC<UserMenuProps> = ({ account, showName = false, onAction }) => {
  const {
    token: { colorPrimary, marginXS, fontSizeSM },
  } = theme.useToken();

  const items: MenuProps["items"] = [
    {
      key: "header",
      disabled: true,
      label: (
        <Flex vertical style={{ minWidth: 0, maxWidth: layoutTokens.userMenuMaxWidth }}>
          <Typography.Text strong ellipsis>
            {account?.name ?? "My account"}
          </Typography.Text>
          {account && (
            <Typography.Text type="secondary" ellipsis style={{ fontSize: fontSizeSM }}>
              {account.email} · {ROLE_LABELS[account.role] ?? account.role}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    { type: "divider" },
    { key: "profile", icon: <UserOutlined />, label: "My Profile" },
    { key: "password", icon: <LockOutlined />, label: "Change password" },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Log out", danger: true },
  ];

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      menu={{ items, onClick: ({ key }) => onAction(key as UserMenuAction) }}
    >
      <Button type="text" aria-label="Account menu" style={{ height: "auto", paddingInline: marginXS }}>
        <Flex align="center" gap={marginXS}>
          <Avatar src={account?.photo_url} icon={!account ? <UserOutlined /> : undefined} style={{ backgroundColor: colorPrimary }}>
            {account ? initials(account.name) : null}
          </Avatar>
          {showName && account && (
            <Typography.Text ellipsis style={{ maxWidth: layoutTokens.navNameMaxWidth }}>
              {account.name}
            </Typography.Text>
          )}
          {showName && <DownOutlined style={{ fontSize: fontSizeSM }} />}
        </Flex>
      </Button>
    </Dropdown>
  );
};

export default UserMenu;
