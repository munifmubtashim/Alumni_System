import { Card, Flex, Typography } from "antd";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const handleSuccess = (token: string) => {
    localStorage.setItem("token", token);

    window.location.href = "/dashboard";
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "100vh", background: "#f0f2f5" }}
    >
      <Card style={{ width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <Typography.Title
          level={3}
          style={{ textAlign: "center", marginBottom: 8 }}
        >
          Alumni Details System
        </Typography.Title>
        <Typography.Text
          type="secondary"
          style={{ display: "block", textAlign: "center", marginBottom: 24 }}
        ></Typography.Text>
        <LoginForm onSuccess={handleSuccess} />
      </Card>
    </Flex>
  );
}
