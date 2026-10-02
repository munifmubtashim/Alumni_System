import React from "react";
import { EditOutlined, LockOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Flex, Result, Row, Skeleton, Tag, Typography, theme } from "antd";
import { useSearchParams } from "react-router-dom";
import type { Alumni, ChangePasswordInput, MyProfile, UpdateMyProfileInput } from "@alumni/shared";
import AccountDetails from "../components/AccountDetails";
import AlumniProfileView from "../components/AlumniProfileView";
import ChangePasswordModal from "../components/ChangePasswordModal";
import ProfileEditForm, { type ProfileKind } from "../components/ProfileEditForm";
import UserPostList from "../components/UserPostList";
import { useMyProfile } from "../hooks/useMyProfile";
import { useUserPosts } from "../hooks/useUserPosts";
import { logout } from "../services/authApi";
import { ROLE_LABELS } from "../utils/alumni";

const toFormValues = (p: MyProfile): UpdateMyProfileInput => ({
  name: p.name,
  email: p.email,
  photo_url: p.photo_url ?? undefined,
  university: p.university ?? undefined,
  department: p.department ?? undefined,
  expected_graduation_year: p.expected_graduation_year ?? undefined,
  graduation_year: p.graduation_year ?? undefined,
  current_company: p.current_company ?? undefined,
  job_title: p.job_title ?? undefined,
  experience: p.experience ?? undefined,
  bio: p.bio ?? undefined,
  linkedin_url: p.linkedin_url ?? undefined,
});

// Shape the account for AlumniProfileView (shared with the public profile page).
const toViewModel = (p: MyProfile): Alumni => ({
  id: p.alumni_id ?? 0,
  user_id: p.user_id,
  name: p.name,
  email: p.email,
  photo_url: p.photo_url ?? undefined,
  university: p.university ?? undefined,
  department: p.department ?? undefined,
  // Students: their expected year, labelled "Expected graduation" in the view.
  graduation_year: p.graduation_year ?? p.expected_graduation_year ?? undefined,
  current_company: p.current_company ?? undefined,
  job_title: p.job_title ?? undefined,
  experience: p.experience ?? undefined,
  bio: p.bio ?? undefined,
  linkedin_url: p.linkedin_url ?? undefined,
});

const profileKind = (p: MyProfile): ProfileKind =>
  p.has_alumni_profile ? "alumni" : p.has_student_profile ? "student" : "none";

export default function MyProfilePage() {
  const { profile, loading, error, reload, save, saving, changePassword, changingPassword } = useMyProfile();
  const userPosts = useUserPosts(profile?.user_id ?? null);
  const [editing, setEditing] = React.useState(false);
  // "Change password" in the header's account menu links to /me?changePassword=1.
  const [searchParams, setSearchParams] = useSearchParams();
  const passwordOpen = searchParams.get("changePassword") === "1";
  const setPasswordOpen = (open: boolean) =>
    setSearchParams(open ? { changePassword: "1" } : {}, { replace: true });
  const { message } = App.useApp();
  const {
    token: { margin },
  } = theme.useToken();

  const handleSave = async (values: UpdateMyProfileInput) => {
    await save(values);
    message.success("Profile updated");
    setEditing(false);
    userPosts.reload();
  };

  const handleChangePassword = async (values: ChangePasswordInput) => {
    await changePassword(values);
    message.success("Password changed");
    setPasswordOpen(false);
  };

  if (loading) {
    return (
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
    );
  }

  if (error === "unauthorized" || error === "not-found") {
    return (
      <Result
        status="403"
        title="Your session has expired"
        subTitle="Please log in again to view your profile."
        extra={<Button type="primary" onClick={() => logout("expired")}>Log in again</Button>}
      />
    );
  }

  if (error || !profile) {
    return (
      <Result status="error" title="Couldn't load your profile" extra={<Button onClick={reload}>Retry</Button>} />
    );
  }

  if (editing) {
    return (
      <Row justify="center">
        <Col xs={24} lg={16} xl={12}>
          <Card title="Edit profile">
            <ProfileEditForm
              profileKind={profileKind(profile)}
              initialValues={toFormValues(profile)}
              saving={saving}
              onSubmit={handleSave}
              onCancel={() => setEditing(false)}
            />
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={[margin, margin]}>
      <Col xs={24} lg={9}>
        <Flex vertical gap={margin}>
          <AlumniProfileView
            alumni={toViewModel(profile)}
            showAlumniDetails={profileKind(profile) !== "none"}
            yearLabel={profileKind(profile) === "student" ? "Expected graduation" : undefined}
            extraTags={<Tag color="processing">{ROLE_LABELS[profile.role] ?? profile.role}</Tag>}
            actions={
              <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            }
          />
          <AccountDetails
            profile={profile}
            actions={
              <Button size="small" icon={<LockOutlined />} onClick={() => setPasswordOpen(true)}>
                Change password
              </Button>
            }
          />
          {profileKind(profile) === "none" && (
            <Typography.Text type="secondary">
              Your account has no alumni or student profile, so there are no extra details to show.
            </Typography.Text>
          )}
        </Flex>
        <ChangePasswordModal
          open={passwordOpen}
          saving={changingPassword}
          onSubmit={handleChangePassword}
          onClose={() => setPasswordOpen(false)}
        />
      </Col>
      <Col xs={24} lg={15}>
        <Flex vertical gap={margin}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            My posts
          </Typography.Title>
          <UserPostList
            posts={userPosts.posts}
            loading={userPosts.loading}
            error={userPosts.error}
            onRetry={userPosts.reload}
            emptyText="You haven't posted yet"
          />
        </Flex>
      </Col>
    </Row>
  );
}
