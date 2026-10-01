import React from "react";
import { Button, Flex, Form, Select } from "antd";
import type { AlumniFilters, FilterOptions } from "../hooks/useFilters";

type FilterPanelProps = {
  options: FilterOptions;
  value: AlumniFilters;
  onChange: (patch: Partial<AlumniFilters>) => void;
  onClear: () => void;
  canClear: boolean;
};

const toOptions = (values: string[]) => values.map((v) => ({ label: v, value: v }));

const FilterPanel: React.FC<FilterPanelProps> = ({ options, value, onChange, onClear, canClear }) => {
  const years = options.years;

  return (
    <Form layout="vertical">
      <Form.Item label="Department">
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Any department"
          options={toOptions(options.departments)}
          value={value.departments}
          onChange={(departments) => onChange({ departments })}
        />
      </Form.Item>

      <Form.Item label="Graduation year">
        <Flex gap="small">
          <Select
            allowClear
            placeholder="From"
            aria-label="Graduation year from"
            style={{ flex: 1 }}
            options={years.map((y) => ({
              label: y,
              value: y,
              disabled: !!value.yearTo && Number(y) > Number(value.yearTo),
            }))}
            value={value.yearFrom}
            onChange={(yearFrom) => onChange({ yearFrom })}
          />
          <Select
            allowClear
            placeholder="To"
            aria-label="Graduation year to"
            style={{ flex: 1 }}
            options={years.map((y) => ({
              label: y,
              value: y,
              disabled: !!value.yearFrom && Number(y) < Number(value.yearFrom),
            }))}
            value={value.yearTo}
            onChange={(yearTo) => onChange({ yearTo })}
          />
        </Flex>
      </Form.Item>

      <Form.Item label="Company">
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Any company"
          options={toOptions(options.companies)}
          value={value.companies}
          onChange={(companies) => onChange({ companies })}
        />
      </Form.Item>

      <Button block onClick={onClear} disabled={!canClear}>
        Clear all
      </Button>
    </Form>
  );
};

export default FilterPanel;
