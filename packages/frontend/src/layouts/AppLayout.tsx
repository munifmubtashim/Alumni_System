import React from "react";
import {
  InfoCircleOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Divider, Drawer, Flex, Grid, Layout, Menu, Typography, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import BrandMark from "../components/BrandMark";
import UserMenu, { type UserMenuAction } from "../components/UserMenu";
import { brandContent } from "../content/brand";
import { useAccount } from "../hooks/useAccount";
import { getCurrentUser, logout } from "../services/authApi";
import { currentUserAtom } from "../store/userAtom";
import { layoutTokens } from "../theme/tokens";
import { initials, ROLE_LABELS } from "../utils/alumni";

const { Header, Content, Footer } = Layout;

// Main sections. My Profile, Change password and Log out live in the account menu.
const navItems: MenuProps["items"] = [
  { key: "posts", icon: <ReadOutlined />, label: "Feed" },
  { key: "alumni", icon: <TeamOutlined />, label: "Alumni" },
  { key: "about", icon: <InfoCircleOutlined />, label: "About" },
];

// Phone drawer: the sections plus the account actions.
const drawerItems: MenuProps["items"] = [
  ...navItems,
  { type: "divider" },
  { key: "me", icon: <UserOutlined />, label: "My Profile" },
  { key: "password", icon: <LockOutlined />, label: "Change password" },
  { key: "logout", icon: <LogoutOutlined />, label: "Log out", danger: true },
];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isDesktop = !!screens.md;
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const setCurrentUser = useSetAtom(currentUserAtom);
  const account = useAccount();

  const {
    token: { colorBorderSecondary, lineWidth, lineType, colorPrimary, colorTextSecondary, padding, paddingLG, marginSM, marginLG, fontSizeSM },
  } = theme.useToken();

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // "/alumni/12" -> "alumni"
  const activeKey = location.pathname.split("/")[1] || "posts";

  const onAction = (action: UserMenuAction | string) => {
    setDrawerOpen(false);
    if (action === "logout") logout();
    else if (action === "profile" || action === "me") navigate("/me");
    else if (action === "password") navigate("/me?changePassword=1");
    else navigate(`/${action}`);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: isDesktop ? marginLG : marginSM,
          borderBottom: `${lineWidth}px ${lineType} ${colorBorderSecondary}`,
        }}
      >
        {!isDesktop && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          />
        )}
        <BrandMark compact={!screens.lg && isDesktop} onClick={() => navigate("/posts")} />
        {isDesktop ? (
          <Menu
            mode="horizontal"
            selectedKeys={[activeKey]}
            items={navItems}
            onClick={({ key }) => onAction(key)}
            style={{ flex: 1, minWidth: 0, borderBottom: "none", background: "transparent" }}
          />
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <UserMenu account={account} showName={isDesktop} onAction={onAction} />
      </Header>

      <Drawer
        title={<BrandMark />}
        placement="left"
        size={layoutTokens.mobileDrawerSize}
        open={!isDesktop && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {account && (
          <Flex align="center" gap={marginSM} style={{ padding }}>
            <Avatar size="large" src={account.photo_url} style={{ backgroundColor: colorPrimary, flexShrink: 0 }}>
              {initials(account.name)}
            </Avatar>
            <Flex vertical style={{ minWidth: 0 }}>
              <Typography.Text strong ellipsis>
                {account.name}
              </Typography.Text>
              <Typography.Text type="secondary" ellipsis style={{ fontSize: fontSizeSM }}>
                {ROLE_LABELS[account.role] ?? account.role}
              </Typography.Text>
            </Flex>
          </Flex>
        )}
        {account && <Divider style={{ margin: 0 }} />}
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={drawerItems}
          onClick={({ key }) => onAction(key)}
          style={{ borderInlineEnd: 0 }}
        />
      </Drawer>

      <Content style={{ padding: isDesktop ? paddingLG : padding }}>
        <div style={{ maxWidth: layoutTokens.contentMaxWidth, margin: "0 auto" }}>
          <Outlet />
        </div>
      </Content>

      <Footer>
        <Flex justify="center">
          <Typography.Text style={{ color: colorTextSecondary }}>
            © {new Date().getFullYear()} {brandContent.appName}
          </Typography.Text>
        </Flex>
      </Footer>
    </Layout>
  );
};

export default AppLayout;
