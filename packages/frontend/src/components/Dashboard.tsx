import React from "react";
import {
  AppstoreOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Layout, Menu, theme } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { logout, getCurrentUser } from "../services/authApi";
import { useSetAtom } from "jotai";
import { currentUserAtom } from "../store/userAtom";

const { Header, Content, Sider } = Layout;

const topItems: MenuProps["items"] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "posts", label: "Feed" },
];

const sideItems: MenuProps["items"] = [
  { key: "profile", icon: <UserOutlined />, label: "Profile" },
  { key: "my-posts", icon: <AppstoreOutlined />, label: "My Posts" },
  { key: "settings", icon: <SettingOutlined />, label: "Settings" },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = location.pathname.replace("/", "") || "dashboard";
  const setCurrentUser = useSetAtom(currentUserAtom);

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const onClick = (e: { key: string }) => navigate(`/${e.key}`);

  return (
    <Layout>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <div style={{ color: "white", marginRight: 24, fontWeight: "bold" }}>
          Alumni Details System
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[activeKey]}
          items={topItems}
          onClick={onClick}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Button
          icon={<LogoutOutlined />}
          onClick={logout}
          style={{ background: "#897d7d", color: "white", border: "none" }}
        >
          Logout
        </Button>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            style={{ height: "100%", borderInlineEnd: 0 }}
            items={sideItems}
            onClick={onClick}
          />
        </Sider>
        <Layout style={{ padding: "0 24px 24px", minHeight: "100vh" }}>
          <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
            <div
              style={{
                padding: 24,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
                minHeight: 1000,
              }}
            >
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Dashboard;