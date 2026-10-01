import React from "react";
import { Flex, Progress, Typography, theme } from "antd";
import { passwordStrength } from "../utils/passwordStrength";

type PasswordStrengthProps = {
  password?: string;
};

const PasswordStrengthMeter: React.FC<PasswordStrengthProps> = ({ password }) => {
  const {
    token: { colorError, colorWarning, colorInfo, colorSuccess, marginXS, fontSizeSM },
  } = theme.useToken();

  if (!password) return null;
  const { score, label } = passwordStrength(password);
  const color = [colorError, colorError, colorWarning, colorInfo, colorSuccess][score];

  return (
    <Flex align="center" gap={marginXS} aria-live="polite">
      <Progress
        steps={4}
        percent={score * 25}
        showInfo={false}
        size="small"
        strokeColor={color}
        aria-label="Password strength"
      />
      <Typography.Text style={{ color, fontSize: fontSizeSM }}>{label}</Typography.Text>
    </Flex>
  );
};

export default PasswordStrengthMeter;
