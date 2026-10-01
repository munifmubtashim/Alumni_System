import type React from "react";
import {
  EditOutlined,
  IdcardOutlined,
  MailOutlined,
  ReadOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Card, Col, Flex, Row, Typography, theme } from "antd";
import { aboutContent, type AboutFeature } from "../content/about";
import { isEmail } from "../utils/email";

const FEATURE_ICONS: Record<AboutFeature["key"], React.ReactNode> = {
  directory: <TeamOutlined />,
  search: <SearchOutlined />,
  profiles: <IdcardOutlined />,
  feed: <ReadOutlined />,
  myProfile: <EditOutlined />,
};

export default function AboutPage() {
  const {
    token: { margin, marginXS, colorPrimary, fontSizeHeading3 },
  } = theme.useToken();
  const { title, intro, whatItIs, purpose, features, whoCanJoin, contact } = aboutContent;

  return (
    <Row justify="center">
      <Col xs={24} xl={20}>
        <Flex vertical gap={margin}>
          <div>
            <Typography.Title level={2} style={{ marginBottom: marginXS }}>
              {title}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {intro}
            </Typography.Paragraph>
          </div>

          <Row gutter={[margin, margin]}>
            {[whatItIs, purpose].map((section) => (
              <Col key={section.title} xs={24} md={12}>
                <Card title={section.title} style={{ height: "100%" }}>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>{section.body}</Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>

          <Card title={features.title}>
            <Row gutter={[margin, margin]}>
              {features.items.map((feature) => (
                <Col key={feature.key} xs={24} sm={12} lg={8}>
                  <Flex gap={margin} align="flex-start">
                    <span aria-hidden style={{ color: colorPrimary, fontSize: fontSizeHeading3 }}>
                      {FEATURE_ICONS[feature.key]}
                    </span>
                    <div>
                      <Typography.Text strong>{feature.title}</Typography.Text>
                      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        {feature.description}
                      </Typography.Paragraph>
                    </div>
                  </Flex>
                </Col>
              ))}
            </Row>
          </Card>

          <Row gutter={[margin, margin]}>
            <Col xs={24} md={12}>
              <Card title={whoCanJoin.title} style={{ height: "100%" }}>
                <Typography.Paragraph style={{ marginBottom: 0 }}>{whoCanJoin.body}</Typography.Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={contact.title} style={{ height: "100%" }}>
                <Typography.Paragraph>{contact.body}</Typography.Paragraph>
                <Flex gap={marginXS} align="center">
                  <MailOutlined aria-hidden />
                  {isEmail(contact.email) ? (
                    <Typography.Link href={`mailto:${contact.email}`}>{contact.email}</Typography.Link>
                  ) : (
                    <Typography.Text type="secondary">{contact.email}</Typography.Text>
                  )}
                </Flex>
              </Card>
            </Col>
          </Row>
        </Flex>
      </Col>
    </Row>
  );
}
