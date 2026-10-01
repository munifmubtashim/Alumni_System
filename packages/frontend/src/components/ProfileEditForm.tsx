import React from "react";
import { Alert, App, Button, Col, Flex, Form, Input, Row, theme } from "antd";
import type { UpdateMyProfileInput } from "@alumni/shared";
import { graduationYearRule, webUrlRules } from "../utils/formRules";

type ProfileEditFormProps = {
  initialValues: UpdateMyProfileInput;
  saving: boolean;
  onSubmit: (values: UpdateMyProfileInput) => Promise<void>;
  onCancel: () => void;
  // False for accounts without an alumni profile: only name and photo can be edited.
  alumniFields?: boolean;
};

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  initialValues,
  saving,
  onSubmit,
  onCancel,
  alumniFields = true,
}) => {
  const [form] = Form.useForm<UpdateMyProfileInput>();
  const { message } = App.useApp();
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
      onFinish={onFinish}
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
          <Form.Item<UpdateMyProfileInput> label="Photo URL" name="photo_url" rules={webUrlRules}>
            <Input placeholder="https://…" />
          </Form.Item>
        </Col>
        {alumniFields && (
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

      {alumniFields ? (
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
          title="Your account doesn't have an alumni profile, so only your name and photo can be edited."
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
