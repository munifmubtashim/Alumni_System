import React from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, App, Button, Col, Flex, Form, Input, Row, Select, theme } from "antd";
import type { UpdateMyProfileInput } from "@alumni/shared";
import { graduationYearRule, webUrlRules } from "../utils/formRules";
import { expectedYearOptions } from "../utils/years";
import UniversityInput from "./UniversityInput";

// Which extra profile the account has: alumni fields, student fields, or none (account fields only).
export type ProfileKind = "alumni" | "student" | "none";

type ProfileEditFormProps = {
  initialValues: UpdateMyProfileInput;
  saving: boolean;
  onSubmit: (values: UpdateMyProfileInput) => Promise<void>;
  onCancel: () => void;
  profileKind: ProfileKind;
};

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  initialValues,
  saving,
  onSubmit,
  onCancel,
  profileKind,
}) => {
  // Alumni and students both have the profile details (company, job title, LinkedIn, bio, experience).
  const hasDetails = profileKind !== "none";
  const [form] = Form.useForm<UpdateMyProfileInput>();
  const { message } = App.useApp();
  // Changing the email needs the current password (checked by the server).
  const email = Form.useWatch("email", form);
  const emailChanged = email !== undefined && email.trim() !== initialValues.email;
  const {
    token: { margin, marginSM },
  } = theme.useToken();

  const onFinish = async (values: UpdateMyProfileInput) => {
    try {
      await onSubmit(values);
    } catch (error) {
      message.error((error as { message?: string }).message ?? "Couldn't save your profile.");
    }
  };

  return (
    <Form<UpdateMyProfileInput>
      form={form}
      layout="vertical"
      requiredMark="optional"
      initialValues={initialValues}
      onFinish={(values) => onFinish({ ...values, email: values.email?.trim() })}
    >
      <Row gutter={margin}>
        <Col xs={24} sm={12}>
          <Form.Item<UpdateMyProfileInput>
            label="Full name"
            name="name"
            rules={[
              { required: true, whitespace: true, message: "Please enter your name" },
              { max: 100 },
            ]}
          >
            <Input autoComplete="name" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item<UpdateMyProfileInput>
            label="Email"
            name="email"
            rules={[
              { required: true, whitespace: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
              { max: 100 },
            ]}
          >
            <Input prefix={<MailOutlined />} autoComplete="email" />
          </Form.Item>
        </Col>
        {emailChanged && (
          <Col xs={24} sm={12}>
            <Form.Item<UpdateMyProfileInput>
              label="Current password"
              name="current_password"
              extra="Required to change your email."
              rules={[{ required: true, message: "Enter your current password to change your email" }]}
            >
              <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} sm={12}>
          <Form.Item<UpdateMyProfileInput> label="Photo URL" name="photo_url" rules={webUrlRules}>
            <Input placeholder="https://…" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item<UpdateMyProfileInput> label="University" name="university" rules={[{ max: 150 }]}>
            <UniversityInput />
          </Form.Item>
        </Col>
        {profileKind === "student" && (
          <>
            <Col xs={24} sm={12}>
              <Form.Item<UpdateMyProfileInput>
                label="Department"
                name="department"
                rules={[{ required: true, whitespace: true, message: "Please enter your department" }, { max: 100 }]}
              >
                <Input placeholder="e.g. CSE" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item<UpdateMyProfileInput>
                label="Expected graduation year"
                name="expected_graduation_year"
                rules={[{ required: true, message: "Please select your expected graduation year" }]}
              >
                <Select showSearch placeholder="Select year" options={expectedYearOptions} />
              </Form.Item>
            </Col>
          </>
        )}
        {profileKind === "alumni" && (
          <>
            <Col xs={24} sm={12}>
              <Form.Item<UpdateMyProfileInput> label="Department" name="department" rules={[{ max: 100 }]}>
                <Input placeholder="e.g. CSE" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item<UpdateMyProfileInput> label="Graduation year" name="graduation_year" rules={[graduationYearRule]}>
                <Input inputMode="numeric" maxLength={4} placeholder="e.g. 2020" />
              </Form.Item>
            </Col>
          </>
        )}
        {hasDetails && (
          <>
            <Col xs={24} sm={12}>
              <Form.Item<UpdateMyProfileInput> label="Company" name="current_company" rules={[{ max: 100 }]}>
                <Input autoComplete="organization" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item<UpdateMyProfileInput> label="Job title" name="job_title" rules={[{ max: 100 }]}>
                <Input autoComplete="organization-title" />
              </Form.Item>
            </Col>
          </>
        )}
      </Row>

      {hasDetails ? (
        <>
          <Form.Item<UpdateMyProfileInput> label="LinkedIn URL" name="linkedin_url" rules={webUrlRules}>
            <Input placeholder="https://www.linkedin.com/in/…" />
          </Form.Item>

          <Form.Item<UpdateMyProfileInput> label="Bio" name="bio" rules={[{ max: 2000 }]}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} showCount maxLength={2000} />
          </Form.Item>

          <Form.Item<UpdateMyProfileInput> label="Experience" name="experience" rules={[{ max: 5000 }]}>
            <Input.TextArea autoSize={{ minRows: 4, maxRows: 12 }} showCount maxLength={5000} />
          </Form.Item>
        </>
      ) : (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: margin }}
          title="Your account doesn't have an alumni or student profile, so only your name, email, photo and university can be edited."
        />
      )}

      <Flex justify="flex-end" gap={marginSM}>
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save changes
        </Button>
      </Flex>
    </Form>
  );
};

export default ProfileEditForm;
