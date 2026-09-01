import React, { useState } from "react";
import { Button, Checkbox, Form, Input, message } from "antd";
import { login } from "../services/authApi";

type FieldType = {
  email: string;
  password: string;
  remember?: boolean;
};

type LoginFormProps = {
  onSuccess: (token: string) => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: FieldType) => {
    setLoading(true);
    try {
      const data = await login(values.email, values.password);

      message.success("Login successful!");
      
      // Ensure data.token exists (e.g., if authApi returns { token: "..." })
      if (data?.token) {
        onSuccess(data.token);
      } else {
        message.error("No token received from server.");
      }
    } catch (error: any) {
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);

      const errorMessage =
        error.response?.data?.message || "Invalid email or password.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Validation failed:", errorInfo);
  };

  return (
    <Form<FieldType>
      name="login"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item<FieldType>
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Please input your email!" },
          { type: "email", message: "Please enter a valid email!" },
        ]}
      >
        <Input placeholder="user@example.com" />
      </Form.Item>

      <Form.Item<FieldType>
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password placeholder="Password" />
      </Form.Item>

      <Form.Item<FieldType>
        name="remember"
        valuePropName="checked"
        wrapperCol={{ offset: 8, span: 16 }}
      >
        <Checkbox>Remember me</Checkbox>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit" loading={loading}>
          Login
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;