import React from "react";
import { BankOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import { universities } from "../content/universities";

type UniversityInputProps = {
  // Injected by Form.Item.
  value?: string;
  onChange?: (value: string) => void;
  size?: "large" | "middle";
};

// Free-text university with suggestions from content/universities.ts.
const UniversityInput: React.FC<UniversityInputProps> = ({ value, onChange, size }) => {
  const query = (value ?? "").trim().toLowerCase();
  const options = universities
    .filter((name) => !query || name.toLowerCase().includes(query))
    .map((name) => ({ value: name }));

  return (
    <AutoComplete value={value} onChange={onChange} options={options}>
      <Input prefix={<BankOutlined />} placeholder="Your university" autoComplete="organization" size={size} />
    </AutoComplete>
  );
};

export default UniversityInput;
