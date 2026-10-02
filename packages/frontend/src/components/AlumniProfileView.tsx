import React from "react";
import { BankOutlined, LinkedinOutlined, MailOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Descriptions, Flex, Tag, Typography, theme } from "antd";
import type { Alumni } from "@alumni/shared";
import { layoutTokens } from "../theme/tokens";
import { initials, isWebUrl } from "../utils/alumni";

type AlumniProfileViewProps = {
  alumni: Alumni;
  // Optional actions rendered in the header card (e.g. "Edit profile" on My Profile).
  actions?: React.ReactNode;
  // Extra tags next to department/class (e.g. the account role on My Profile).
  extraTags?: React.ReactNode;
  // False for accounts without an alumni or student profile: hides the About card.
  showAlumniDetails?: boolean;
  // Students show their expected graduation year instead of a graduation year.
  yearLabel?: string;
};

const AlumniProfileView: React.FC<AlumniProfileViewProps> = ({
  alumni,
  actions,
  extraTags,
  showAlumniDetails = true,
  yearLabel = "Graduation year",
}) => {
  const {
    token: { colorPrimary, margin, marginSM, marginXS },
  } = theme.useToken();

  const name = alumni.name ?? `Alumnus #${alumni.user_id}`;
  const role = [alumni.job_title, alumni.current_company].filter(Boolean).join(" at ");
  const notSet = <Typography.Text type="secondary">Not set</Typography.Text>;

  return (
    <Flex vertical gap={margin}>
      <Card>
        <Flex vertical align="center" gap={marginSM} style={{ textAlign: "center" }}>
          <Avatar size={layoutTokens.profileAvatarSize} src={alumni.photo_url} style={{ backgroundColor: colorPrimary }}>
            {initials(alumni.name)}
          </Avatar>
          <div style={{ width: "100%", minWidth: 0 }}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {name}
            </Typography.Title>
            {role && <Typography.Text type="secondary">{role}</Typography.Text>}
            {alumni.university && (
              <div>
                <Typography.Text type="secondary">
                  <BankOutlined /> {alumni.university}
                </Typography.Text>
              </div>
            )}
          </div>
          {(alumni.department || alumni.graduation_year || extraTags) && (
            <Flex wrap justify="center" gap={marginXS}>
              {extraTags}
              {alumni.department && <Tag>{alumni.department}</Tag>}
              {alumni.graduation_year && <Tag color="processing">Class of {alumni.graduation_year}</Tag>}
            </Flex>
          )}
          <Flex wrap justify="center" gap={marginXS}>
            {isWebUrl(alumni.linkedin_url) && (
              <Button icon={<LinkedinOutlined />} href={alumni.linkedin_url} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </Button>
            )}
            {alumni.email && (
              <Button icon={<MailOutlined />} href={`mailto:${alumni.email}`}>
                Email
              </Button>
            )}
            {actions}
          </Flex>
        </Flex>
      </Card>

      {showAlumniDetails && (
        <Card title="About">
          <Descriptions column={1} size="small" style={{ marginBottom: margin }}>
            <Descriptions.Item label="University">{alumni.university || notSet}</Descriptions.Item>
            <Descriptions.Item label="Department">{alumni.department || notSet}</Descriptions.Item>
            <Descriptions.Item label={yearLabel}>{alumni.graduation_year || notSet}</Descriptions.Item>
            <Descriptions.Item label="Company">{alumni.current_company || notSet}</Descriptions.Item>
            <Descriptions.Item label="Job title">{alumni.job_title || notSet}</Descriptions.Item>
            <Descriptions.Item label="LinkedIn">
              {isWebUrl(alumni.linkedin_url) ? (
                <Typography.Link href={alumni.linkedin_url} target="_blank" rel="noopener noreferrer" ellipsis>
                  {alumni.linkedin_url}
                </Typography.Link>
              ) : (
                alumni.linkedin_url || notSet
              )}
            </Descriptions.Item>
            {alumni.email && (
              <Descriptions.Item label="Email">
                <Typography.Text copyable ellipsis>
                  {alumni.email}
                </Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Typography.Title level={5}>Bio</Typography.Title>
          <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }} type={alumni.bio ? undefined : "secondary"}>
            {alumni.bio || "No bio yet."}
          </Typography.Paragraph>

          <Typography.Title level={5}>Experience</Typography.Title>
          <Typography.Paragraph
            style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}
            type={alumni.experience ? undefined : "secondary"}
          >
            {alumni.experience || "No experience added yet."}
          </Typography.Paragraph>
        </Card>
      )}
    </Flex>
  );
};

export default AlumniProfileView;
