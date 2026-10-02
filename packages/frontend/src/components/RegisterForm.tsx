import React from "react";
import {
  ApartmentOutlined,
  BankOutlined,
  CalendarOutlined,
  IdcardOutlined,
  LinkedinOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Button, Collapse, Form, Input, Segmented, Select, Typography, theme } from "antd";
import type { RegisterInput, SignupRole } from "@alumni/shared";
import type { RegisterError } from "../hooks/useRegister";
import { webUrlRules } from "../utils/formRules";
import { expectedYearOptions, graduationYearOptions } from "../utils/years";
import PasswordStrengthMeter from "./PasswordStrength";
import UniversityInput from "./UniversityInput";

type FormValues = RegisterInput & { confirm: string };

type RegisterFormProps = {
  submitting: boolean;
  onSubmit: (input: RegisterInput) => Promise<void>;
};

const ROLE_OPTIONS: { label: string; value: SignupRole }[] = [
  { label: "Alumni", value: "alumni" },
  { label: "Student", value: "student" },
];

const RegisterForm: React.FC<RegisterFormProps> = ({ submitting, onSubmit }) => {
  const [form] = Form.useForm<FormValues>();
  const password = Form.useWatch("password", form);
  const role = Form.useWatch("role", form) ?? "alumni";
  const [formError, setFormError] = React.useState<string | null>(null);
  const {
    token: { margin, marginSM },
  } = theme.useToken();

  const onFinish = async ({ confirm: _confirm, ...input }: FormValues) => {
    setFormError(null);
    try {
      await onSubmit(input);
    } catch (error) {
      const { field, message: text } = error as RegisterError;
      if (field) form.setFields([{ name: field, errors: [text] }]);
      else setFormError(text);
    }
  };

  const alumniFields = (
    <>
      <Typography.Paragraph type="secondary" style={{ marginBottom: marginSM }}>
        You can also add or change these later in My Profile.
      </Typography.Paragraph>
      <Form.Item<FormValues> label="Department" name="department" rules={[{ max: 100 }]}>
        <Input prefix={<ApartmentOutlined />} placeholder="e.g. CSE" size="large" />
      </Form.Item>
      <Form.Item<FormValues> label="Graduation year" name="graduation_year">
        <Select
          showSearch
          allowClear
          size="large"
          placeholder="Select year"
          prefix={<CalendarOutlined />}
          options={graduationYearOptions}
        />
      </Form.Item>
      <Form.Item<FormValues> label="Company" name="current_company" rules={[{ max: 100 }]}>
        <Input prefix={<BankOutlined />} autoComplete="organization" size="large" />
      </Form.Item>
      <Form.Item<FormValues> label="Job title" name="job_title" rules={[{ max: 100 }]}>
        <Input prefix={<IdcardOutlined />} autoComplete="organization-title" size="large" />
      </Form.Item>
      <Form.Item<FormValues> label="LinkedIn URL" name="linkedin_url" rules={webUrlRules} style={{ marginBottom: 0 }}>
        <Input prefix={<LinkedinOutlined />} placeholder="https://www.linkedin.com/in/…" size="large" />
      </Form.Item>
    </>
  );

  // Required for students; shown outside the optional section.
  const studentFields = (
    <>
      <Form.Item<FormValues>
        label="Department"
        name="department"
        rules={[
          { required: true, whitespace: true, message: "Please enter your department" },
          { max: 100, message: "Department must be at most 100 characters" },
        ]}
      >
        <Input prefix={<ApartmentOutlined />} placeholder="e.g. CSE" size="large" />
      </Form.Item>
      <Form.Item<FormValues>
        label="Expected graduation year"
        name="expected_graduation_year"
        rules={[{ required: true, message: "Please select your expected graduation year" }]}
      >
        <Select
          showSearch
          size="large"
          placeholder="Select year"
          prefix={<CalendarOutlined />}
          options={expectedYearOptions}
        />
      </Form.Item>
    </>
  );

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      requiredMark="optional"
      initialValues={{ role: "alumni" }}
      onFinish={onFinish}
    >
      {formError && (
        <Alert type="error" showIcon title={formError} role="alert" style={{ marginBottom: margin }} />
      )}

      <Form.Item<FormValues> label="I am a" name="role">
        <Segmented<SignupRole> block size="large" options={ROLE_OPTIONS} />
      </Form.Item>

      <Form.Item<FormValues>
        label="Full name"
        name="name"
        rules={[
          { required: true, whitespace: true, message: "Please enter your name" },
          { max: 100, message: "Name must be at most 100 characters" },
        ]}
      >
        <Input prefix={<UserOutlined />} autoComplete="name" autoFocus size="large" />
      </Form.Item>

      <Form.Item<FormValues>
        label="Email"
        name="email"
        extra="You'll use this to sign in."
        rules={[
          { required: true, message: "Please enter your email" },
          { type: "email", message: "Please enter a valid email" },
          { max: 100, message: "Email must be at most 100 characters" },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="user@example.com" autoComplete="email" size="large" />
      </Form.Item>

      <Form.Item<FormValues>
        label="Password"
        name="password"
        extra={password ? <PasswordStrengthMeter password={password} /> : "At least 8 characters."}
        rules={[
          { required: true, message: "Please choose a password" },
          { min: 8, message: "At least 8 characters" },
          { max: 72, message: "At most 72 characters" },
        ]}
      >
        <Input.Password prefix={<LockOutlined />} autoComplete="new-password" size="large" />
      </Form.Item>

      <Form.Item<FormValues>
        label="Confirm password"
        name="confirm"
        dependencies={["password"]}
        rules={[
          { required: true, message: "Please confirm your password" },
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              !value || getFieldValue("password") === value
                ? Promise.resolve()
                : Promise.reject(new Error("Passwords don't match")),
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} autoComplete="new-password" size="large" />
      </Form.Item>

      <Form.Item<FormValues>
        label="University"
        name="university"
        rules={[
          { required: true, whitespace: true, message: "Please enter your university" },
          { max: 150, message: "University must be at most 150 characters" },
        ]}
      >
        <UniversityInput size="large" />
      </Form.Item>

      {role === "student" ? (
        studentFields
      ) : (
        <Collapse
          ghost
          style={{ marginBottom: margin }}
          items={[
            {
              key: "alumni",
              label: "Add alumni details (optional)",
              forceRender: true,
              children: alumniFields,
            },
          ]}
        />
      )}

      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit" loading={submitting} block size="large">
          Create account
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RegisterForm;
