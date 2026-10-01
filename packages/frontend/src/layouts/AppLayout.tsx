import React from "react";
import {
  LogoutOutlined,
  MenuOutlined,
  ReadOutlined,
  TeamOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Drawer, Flex, Grid, Layout, Menu, Typography, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { getCurrentUser, logout } from "../services/authApi";
import { currentUserAtom } from "../store/userAtom";
import { layoutTokens } from "../theme/tokens";

const { Header, Content, Footer } = Layout;

const navItems: MenuProps["items"] = [
  { key: "posts", icon: <ReadOutlined />, label: "Feed" },
  { key: "alumni", icon: <TeamOutlined />, label: "Alumni" },
  { key: "about", icon: <InfoCircleOutlined />, label: "About" },
];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isDesktop = !!screens.md;
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const setCurrentUser = useSetAtom(currentUserAtom);

  const {
    token: { colorTextLightSolid, colorTextSecondary, padding, paddingLG, marginLG, fontSizeLG },
  } = theme.useToken();

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // "/alumni/12" -> "alumni"
  const activeKey = location.pathname.split("/")[1] || "posts";

  const onNavigate = ({ key }: { key: string }) => {
    setDrawerOpen(false);
    navigate(`/${key}`);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        {!isDesktop && (
          <Button
            type="text"
            icon={<MenuOutlined style={{ color: colorTextLightSolid }} />}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          />
        )}
        <Typography.Text
          strong
          ellipsis
          style={{
            color: colorTextLightSolid,
            fontSize: fontSizeLG,
            marginInline: isDesktop ? `0 ${marginLG}px` : "auto",
            cursor: "pointer",
          }}
          onClick={() => navigate("/posts")}
        >
          Alumni Details System
        </Typography.Text>
        {isDesktop && (
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[activeKey]}
            items={navItems}
            onClick={onNavigate}
            style={{ flex: 1, minWidth: 0 }}
          />
        )}
        <Button
          ghost
          icon={<LogoutOutlined />}
          onClick={logout}
          aria-label="Logout"
        >
          {isDesktop && "Logout"}
        </Button>
      </Header>

      <Drawer
        title="Menu"
        placement="left"
        size={layoutTokens.mobileDrawerSize}
        open={!isDesktop && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={navItems}
          onClick={onNavigate}
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
            © {new Date().getFullYear()} Alumni Details System
          </Typography.Text>
        </Flex>
      </Footer>
    </Layout>
  );
};

export default AppLayout;
