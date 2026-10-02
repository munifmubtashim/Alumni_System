import React from "react";
import { BankOutlined, LinkedinOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Flex, Tag, Typography, theme } from "antd";
import { Link, useNavigate } from "react-router-dom";
import type { Alumni } from "@alumni/shared";
import { layoutTokens } from "../theme/tokens";
import { initials, isWebUrl } from "../utils/alumni";

type AlumniCardProps = {
  alumni: Alumni;
  // Profile route; when set, the whole card is clickable.
  to?: string;
};

const AlumniCard: React.FC<AlumniCardProps> = ({ alumni, to }) => {
  const navigate = useNavigate();
  const {
    token: { colorPrimary, marginSM, marginXS },
  } = theme.useToken();

  const role = [alumni.job_title, alumni.current_company].filter(Boolean).join(" at ");

  return (
    <Card
      hoverable={!!to}
      style={{ height: "100%", cursor: to ? "pointer" : undefined }}
      onClick={(e) => {
        // Let the name link and LinkedIn button handle their own clicks.
        if (to && !(e.target as HTMLElement).closest("a, button")) navigate(to);
      }}
    >
      <Flex vertical align="center" gap={marginSM} style={{ textAlign: "center" }}>
        <Avatar size={layoutTokens.profileAvatarSize} src={alumni.photo_url} style={{ backgroundColor: colorPrimary }}>
          {initials(alumni.name)}
        </Avatar>
        <Flex vertical style={{ width: "100%", minWidth: 0 }}>
          <Typography.Title level={5} ellipsis={{ tooltip: alumni.name }} style={{ margin: 0 }}>
            {to ? (
              <Link to={to}>{alumni.name ?? `Alumnus #${alumni.user_id}`}</Link>
            ) : (
              alumni.name ?? `Alumnus #${alumni.user_id}`
            )}
          </Typography.Title>
          <Typography.Text type="secondary" ellipsis={{ tooltip: role }}>
            {role || "Alumni member"}
          </Typography.Text>
          {alumni.university && (
            <Typography.Text type="secondary" ellipsis={{ tooltip: alumni.university }}>
              <BankOutlined /> {alumni.university}
            </Typography.Text>
          )}
        </Flex>
        {(alumni.department || alumni.graduation_year) && (
          <Flex wrap justify="center" gap={marginXS}>
            {alumni.department && <Tag>{alumni.department}</Tag>}
            {alumni.graduation_year && <Tag color="processing">Class of {alumni.graduation_year}</Tag>}
          </Flex>
        )}
        {isWebUrl(alumni.linkedin_url) && (
          <Button
            type="link"
            icon={<LinkedinOutlined />}
            href={alumni.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </Button>
        )}
      </Flex>
    </Card>
  );
};

export default AlumniCard;
