import React from "react";
import { Card, Descriptions, Tag, Typography } from "antd";
import type { MyProfile } from "@alumni/shared";
import { ROLE_LABELS } from "../utils/alumni";
import { formatDateTime } from "../utils/time";

type AccountDetailsProps = {
  profile: MyProfile;
  // Rendered in the card header (e.g. "Change password").
  actions?: React.ReactNode;
};

// Every account-level field of the signed-in user (shown for all roles on My Profile).
const AccountDetails: React.FC<AccountDetailsProps> = ({ profile, actions }) => {
  const notSet = <Typography.Text type="secondary">Not set</Typography.Text>;
  const date = (value?: Date) => formatDateTime(value) ?? notSet;

  return (
    <Card title="Account" extra={actions}>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Full name">{profile.name}</Descriptions.Item>
        <Descriptions.Item label="Email">
          <Typography.Text copyable ellipsis>
            {profile.email}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Role">
          <Tag color="processing">{ROLE_LABELS[profile.role] ?? profile.role}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="University">{profile.university || notSet}</Descriptions.Item>
        <Descriptions.Item label="Photo URL">
          {profile.photo_url ? (
            <Typography.Text copyable ellipsis>
              {profile.photo_url}
            </Typography.Text>
          ) : (
            notSet
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Password">
          <Typography.Text type="secondary">••••••••</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Member since">{date(profile.created_at)}</Descriptions.Item>
        <Descriptions.Item label="Last sign-in">{date(profile.login_at)}</Descriptions.Item>
        <Descriptions.Item label="Last updated">{date(profile.updated_at)}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default AccountDetails;
