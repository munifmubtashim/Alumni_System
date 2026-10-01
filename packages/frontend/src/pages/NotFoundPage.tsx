import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="Page not found"
      subTitle="The page you're looking for doesn't exist yet."
      extra={
        <Button type="primary" onClick={() => navigate("/posts")}>
          Back to feed
        </Button>
      }
    />
  );
}
