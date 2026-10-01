import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Result, Row, Skeleton, Typography, theme } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AlumniProfileView from "../components/AlumniProfileView";
import UserPostList from "../components/UserPostList";
import { useAlumniProfile } from "../hooks/useAlumniProfile";
import { logout } from "../services/authApi";

export default function AlumniProfilePage() {
  const { id } = useParams();
  const numericId = id && /^\d+$/.test(id) ? Number(id) : null;
  const { alumni, loading, error, reload, posts, postsLoading, postsError, reloadPosts } =
    useAlumniProfile(numericId);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { margin },
  } = theme.useToken();

  // Go back to the (possibly filtered) list if we came from inside the app.
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/alumni"));

  const backButton = (
    <Button type="link" icon={<ArrowLeftOutlined />} onClick={goBack} style={{ paddingInline: 0 }}>
      All alumni
    </Button>
  );

  if (loading) {
    return (
      <Flex vertical gap={margin}>
        {backButton}
        <Row gutter={[margin, margin]}>
          <Col xs={24} lg={9}>
            <Card>
              <Skeleton avatar active paragraph={{ rows: 6 }} />
            </Card>
          </Col>
          <Col xs={24} lg={15}>
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
        </Row>
      </Flex>
    );
  }

  if (error === "not-found" || (!error && !alumni)) {
    return (
      <Result
        status="404"
        title="Profile not found"
        subTitle="This alumni profile doesn't exist or was removed."
        extra={<Button type="primary" onClick={() => navigate("/alumni")}>Browse alumni</Button>}
      />
    );
  }

  if (error === "unauthorized") {
    return (
      <Result
        status="403"
        title="Your session has expired"
        subTitle="Please log in again to view this profile."
        extra={<Button type="primary" onClick={() => logout("expired")}>Log in again</Button>}
      />
    );
  }

  if (error || !alumni) {
    return (
      <Result
        status="error"
        title="Couldn't load this profile"
        extra={<Button onClick={reload}>Retry</Button>}
      />
    );
  }

  const firstName = alumni.name?.split(/\s+/)[0] ?? "this alumnus";

  return (
    <Flex vertical gap={margin}>
      {backButton}
      <Row gutter={[margin, margin]}>
        <Col xs={24} lg={9}>
          <AlumniProfileView alumni={alumni} />
        </Col>
        <Col xs={24} lg={15}>
          <Flex vertical gap={margin}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Posts by {firstName}
            </Typography.Title>
            <UserPostList posts={posts} loading={postsLoading} error={postsError} onRetry={reloadPosts} />
          </Flex>
        </Col>
      </Row>
    </Flex>
  );
}
