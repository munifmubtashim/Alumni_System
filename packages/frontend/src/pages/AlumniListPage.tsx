import React from "react";
import { FilterOutlined } from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Flex,
  Grid,
  Row,
  Skeleton,
  Typography,
  theme,
} from "antd";
import AlumniCard from "../components/AlumniCard";
import FilterPanel from "../components/FilterPanel";
import SearchBar from "../components/SearchBar";
import { useAlumni } from "../hooks/useAlumni";
import { filterAlumni, getFilterOptions, useFilters } from "../hooks/useFilters";
import { layoutTokens } from "../theme/tokens";

// Card columns inside the results area (narrower than full width on lg+ because of the sidebar).
const GRID = { xs: 24, sm: 12, lg: 12, xl: 8, xxl: 6 };

export default function AlumniListPage() {
  const { alumni, loading, error, reload } = useAlumni();
  const { filters, setFilters, clearFilters, activeCount } = useFilters();
  const screens = Grid.useBreakpoint();
  const isDesktop = !!screens.lg;
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const {
    token: { margin },
  } = theme.useToken();

  const options = React.useMemo(() => getFilterOptions(alumni), [alumni]);
  const results = React.useMemo(() => filterAlumni(alumni, filters), [alumni, filters]);
  const isFiltered = activeCount > 0 || !!filters.q;

  const filterPanel = (
    <FilterPanel
      options={options}
      value={filters}
      onChange={setFilters}
      onClear={clearFilters}
      canClear={isFiltered}
    />
  );

  const renderResults = () => {
    if (loading) {
      return (
        <Row gutter={[margin, margin]}>
          {Array.from({ length: 6 }, (_, i) => (
            <Col key={i} {...GRID}>
              <Card>
                <Skeleton avatar active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      );
    }
    if (error) {
      return (
        <Alert
          type="error"
          showIcon
          title="Couldn't load alumni."
          action={<Button onClick={reload}>Retry</Button>}
        />
      );
    }
    if (alumni.length === 0) {
      return <Empty description="No alumni yet" />;
    }
    if (results.length === 0) {
      return (
        <Empty description="No alumni match your search">
          <Button onClick={clearFilters}>Clear all</Button>
        </Empty>
      );
    }
    return (
      <Row gutter={[margin, margin]}>
        {results.map((a) => (
          <Col key={a.id} {...GRID}>
            <AlumniCard alumni={a} to={`/alumni/${a.id}`} />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <Flex vertical gap={margin}>
      <Flex justify="space-between" align="baseline" wrap gap={margin}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Alumni
        </Typography.Title>
        {!loading && !error && (
          <Typography.Text type="secondary" aria-live="polite">
            {isFiltered
              ? `Showing ${results.length} of ${alumni.length}`
              : `${alumni.length} ${alumni.length === 1 ? "member" : "members"}`}
          </Typography.Text>
        )}
      </Flex>

      <Flex gap={margin}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SearchBar
            value={filters.q}
            onChange={(q) => setFilters({ q })}
            placeholder="Search by name, university, job title, company or department"
          />
        </div>
        {!isDesktop && (
          <Badge count={activeCount}>
            <Button size="large" icon={<FilterOutlined />} onClick={() => setDrawerOpen(true)}>
              Filters
            </Button>
          </Badge>
        )}
      </Flex>

      <Row gutter={[margin, margin]}>
        {isDesktop && (
          <Col lg={6}>
            <Card title="Filters" size="small">
              {filterPanel}
            </Card>
          </Col>
        )}
        <Col xs={24} lg={18}>
          {renderResults()}
        </Col>
      </Row>

      <Drawer
        title="Filters"
        placement="right"
        size={layoutTokens.mobileDrawerSize}
        open={!isDesktop && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <Button type="primary" block onClick={() => setDrawerOpen(false)}>
            Show {results.length} {results.length === 1 ? "result" : "results"}
          </Button>
        }
      >
        {filterPanel}
      </Drawer>
    </Flex>
  );
}
