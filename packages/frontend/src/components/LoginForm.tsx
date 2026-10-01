import React, { useState } from "react";
import { App, Button, Form, Input } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { login } from "../services/authApi";

type FieldType = {
  email: string;
  password: string;
};

type LoginFormProps = {
  onSuccess: (token: string) => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: FieldType) => {
    setLoading(true);
    try {
      const data = await login(values.email, values.password);

      // Ensure data.token exists (e.g., if authApi returns { token: "..." })
      if (data?.token) {
        message.success("Login successful!");
        onSuccess(data.token);
      } else {
        message.error("No token received from server.");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Invalid email or password.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<FieldType>
      name="login"
      layout="vertical"
      requiredMark={false}
      onFinish={onFinish}
    >
      <Form.Item<FieldType>
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
          size="large"
        />
      </Form.Item>

      <Form.Item<FieldType>
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          autoComplete="current-password"
          size="large"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Login
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
