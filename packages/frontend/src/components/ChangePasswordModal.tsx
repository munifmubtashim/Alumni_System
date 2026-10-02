import React from "react";
import { LockOutlined } from "@ant-design/icons";
import { Alert, Form, Input, Modal, theme } from "antd";
import type { ChangePasswordInput } from "@alumni/shared";
import PasswordStrengthMeter from "./PasswordStrength";

type ChangePasswordValues = ChangePasswordInput & { confirm_password: string };

type ChangePasswordModalProps = {
  open: boolean;
  saving: boolean;
  // Rejects with { message } to show the server's error inside the modal.
  onSubmit: (values: ChangePasswordInput) => Promise<void>;
  onClose: () => void;
};

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, saving, onSubmit, onClose }) => {
  const [form] = Form.useForm<ChangePasswordValues>();
  const [error, setError] = React.useState<string | null>(null);
  const newPassword = Form.useWatch("new_password", form);
  const {
    token: { margin },
  } = theme.useToken();

  const onFinish = async ({ current_password, new_password }: ChangePasswordValues) => {
    setError(null);
    try {
      await onSubmit({ current_password, new_password });
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't change your password.");
    }
  };

  return (
    <Modal
      title="Change password"
      open={open}
      okText="Change password"
      onOk={form.submit}
      onCancel={onClose}
      confirmLoading={saving}
      destroyOnHidden
      afterClose={() => setError(null)}
    >
      <Form<ChangePasswordValues> form={form} layout="vertical" onFinish={onFinish} preserve={false}>
        {error && <Alert type="error" showIcon title={error} role="alert" style={{ marginBottom: margin }} />}
        <Form.Item<ChangePasswordValues>
          label="Current password"
          name="current_password"
          rules={[{ required: true, message: "Please enter your current password" }]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete="current-password" autoFocus />
        </Form.Item>
        <Form.Item<ChangePasswordValues>
          label="New password"
          name="new_password"
          dependencies={["current_password"]}
          extra={newPassword ? <PasswordStrengthMeter password={newPassword} /> : "At least 8 characters."}
          rules={[
            { required: true, message: "Please enter a new password" },
            { min: 8, message: "At least 8 characters" },
            { max: 72, message: "At most 72 characters" },
            ({ getFieldValue }) => ({
              validator: (_, value?: string) =>
                value && value === getFieldValue("current_password")
                  ? Promise.reject(new Error("Must be different from your current password"))
                  : Promise.resolve(),
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
        </Form.Item>
        <Form.Item<ChangePasswordValues>
          label="Confirm new password"
          name="confirm_password"
          dependencies={["new_password"]}
          rules={[
            { required: true, message: "Please confirm your new password" },
            ({ getFieldValue }) => ({
              validator: (_, value?: string) =>
                !value || value === getFieldValue("new_password")
                  ? Promise.resolve()
                  : Promise.reject(new Error("Passwords don't match")),
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
