import React from "react";
import { Input } from "antd";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const DEBOUNCE_MS = 300;

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => {
  const [text, setText] = React.useState(value);

  // Follow outside changes (e.g. "Clear all") without clobbering trailing spaces while typing.
  React.useEffect(() => {
    if (value !== text.trim()) setText(value);
  }, [value]);

  React.useEffect(() => {
    if (text.trim() === value) return;
    const timer = setTimeout(() => onChange(text), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <Input.Search
      allowClear
      size="large"
      value={text}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(e) => setText(e.target.value)}
      onSearch={(next) => onChange(next)}
    />
  );
};

export default SearchBar;
