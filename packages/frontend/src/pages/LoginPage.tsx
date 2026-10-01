import { Card, Col, Row, Typography, theme } from "antd";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    token: { colorBgLayout, boxShadowTertiary, padding, marginXS, marginLG },
  } = theme.useToken();

  const handleSuccess = (token: string) => {
    localStorage.setItem("token", token);
    navigate("/posts", { replace: true });
  };

  return (
    <Row
      justify="center"
      align="middle"
      style={{ minHeight: "100vh", padding, background: colorBgLayout }}
    >
      <Col xs={24} sm={16} md={12} lg={8} xxl={6}>
        <Card style={{ boxShadow: boxShadowTertiary }}>
          <Typography.Title level={3} style={{ textAlign: "center", marginBottom: marginXS }}>
            Alumni Details System
          </Typography.Title>
          <Typography.Paragraph
            type="secondary"
            style={{ textAlign: "center", marginBottom: marginLG }}
          >
            Sign in to continue
          </Typography.Paragraph>
          <LoginForm onSuccess={handleSuccess} />
        </Card>
      </Col>
    </Row>
  );
}
