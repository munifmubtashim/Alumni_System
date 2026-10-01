import React from "react";
import { Alert, Button, Flex, Form, Input, theme } from "antd";
import { Link } from "react-router-dom";
import { LockOutlined, MailOutlined } from "@ant-design/icons";

export type LoginValues = {
  email: string;
  password: string;
};

type LoginFormProps = {
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: LoginValues) => void;
  // Called when the user edits a field, so a stale error can be cleared.
  onEdit?: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ submitting, error, onSubmit, onEdit }) => {
  const {
    token: { margin, marginSM },
  } = theme.useToken();

  return (
    <Form<LoginValues>
      name="login"
      layout="vertical"
      requiredMark={false}
      onFinish={onSubmit}
      onValuesChange={() => onEdit?.()}
    >
      {error && (
        <Alert type="error" showIcon title={error} role="alert" style={{ marginBottom: margin }} />
      )}

      <Form.Item<LoginValues>
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Please input your email!" },
          { type: "email", message: "Please enter a valid email!" },
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="user@example.com"
          autoComplete="email"
          autoFocus
          size="large"
        />
      </Form.Item>

      <Form.Item<LoginValues>
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
        style={{ marginBottom: marginSM }}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          autoComplete="current-password"
          size="large"
        />
      </Form.Item>

      <Flex justify="flex-end" style={{ marginBottom: margin }}>
        <Link to="/forgot-password">Forgot password?</Link>
      </Flex>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit" loading={submitting} block size="large">
          Sign in
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
