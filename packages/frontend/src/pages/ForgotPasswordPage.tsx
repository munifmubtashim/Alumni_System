import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, Button, Flex, Typography, theme } from "antd";
import { useNavigate } from "react-router-dom";
import { aboutContent } from "../content/about";
import AuthLayout from "../layouts/AuthLayout";
import { isEmail } from "../utils/email";

// No self-service reset yet: point users to the alumni office (same contact as the About page).
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const {
    token: { margin, marginXS },
  } = theme.useToken();
  const email = aboutContent.contact.email;

  return (
    <AuthLayout title="Forgot your password?" subtitle="We'll help you get back into your account.">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: margin }}
        title="Password resets are handled by the alumni office."
        description="Send them a message from the email address you signed up with, and they'll reset your password for you."
      />

      <Flex gap={marginXS} align="center" style={{ marginBottom: margin }}>
        <MailOutlined aria-hidden />
        {isEmail(email) ? (
          <Typography.Link href={`mailto:${email}?subject=${encodeURIComponent("Password reset request")}`}>
            {email}
          </Typography.Link>
        ) : (
          <Typography.Text type="secondary">{email}</Typography.Text>
        )}
      </Flex>

      <Button block size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
        Back to sign in
      </Button>
    </AuthLayout>
  );
}
