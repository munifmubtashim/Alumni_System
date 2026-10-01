import React from "react";
import { Form, Input, Modal } from "antd";
import type { PostInput } from "../hooks/usePosts";

type PostFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: PostInput;
  saving: boolean;
  onSubmit: (values: PostInput) => void;
  onCancel: () => void;
};

const PostFormModal: React.FC<PostFormModalProps> = ({
  open,
  mode,
  initialValues,
  saving,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm<PostInput>();

  return (
    <Modal
      title={mode === "create" ? "New Post" : "Edit Post"}
      open={open}
      okText={mode === "create" ? "Post" : "Save"}
      onOk={() => form.submit()}
      onCancel={onCancel}
      confirmLoading={saving}
      destroyOnHidden
    >
      <Form<PostInput>
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={initialValues}
        onFinish={onSubmit}
      >
        <Form.Item<PostInput>
          name="caption"
          label="Caption"
          rules={[{ required: true, whitespace: true, message: "Please write something" }]}
        >
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 10 }} placeholder="What's on your mind?" />
        </Form.Item>
        <Form.Item<PostInput>
          name="media_url"
          label="Image URL"
          rules={[{ type: "url", message: "Please enter a valid URL" }]}
        >
          <Input placeholder="https://… (optional)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PostFormModal;
