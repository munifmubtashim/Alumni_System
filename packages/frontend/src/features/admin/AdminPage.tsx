import type { AlumniListItem } from '@alumni/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { useCurrentUser } from '@/features/auth';
import { PlusIcon } from './AdminIcons';
import { AdminPagination } from './AdminPagination';
import { AdminSearch } from './AdminSearch';
import { AdminStats } from './AdminStats';
import { EmptyState, LoadError } from './AdminStates';
import { AlumniDrawer, type DrawerTarget } from './AlumniDrawer';
import { AlumniCardList } from './AlumniCardList';
import { AlumniTable } from './AlumniTable';
import { DeleteAlumniDialog, type DeleteTarget } from './DeleteAlumniDialog';
import { ADMIN_PAGE_SIZE, useAdminAlumni } from './queries';
import type { RowAction } from './RowActions';
import { useAdminParams } from './useAdminParams';
import { useAdminToast } from './useAdminToast';
import styles from './AdminPage.module.css';

/**
 * The admin page at /admin (REQ-015, S6), lazy-loaded by the router (ADR-08)
 * and shown only to admins by RequireAdmin: the header row with Add alumni,
 * the four stat cards and the alumni table (cards on phones). The table's
 * search, sort and page live in the URL; the stats and the table load and
 * fail independently. Add alumni and each row's Edit open AlumniDrawer, each
 * row's Delete opens DeleteAlumniDialog (hidden on the admin's own row); their
 * success toasts live here, so they outlive the drawer and the dialog.
 */
export function AdminPage() {
  const titleId = useId();
  const listTitleId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { showToast, toastElement } = useAdminToast(headingRef);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Kept after close, so the title and fields don't change while it slides out.
  const [drawerTarget, setDrawerTarget] = useState<DrawerTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Kept after close, so the title doesn't change while it fades out.
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const myUserId = useCurrentUser().data?.user_id;
  const { params, setQuery, sortBy, setPage, clampPage, clearSearch } = useAdminParams();
  const { data, isError, isFetching, isPlaceholderData, refetch } = useAdminAlumni(params);

  const totalPages = data === undefined ? 1 : Math.max(1, Math.ceil(data.total / ADMIN_PAGE_SIZE));
  // An empty page with matches elsewhere: a stale link or a list that shrank.
  // Step back to the last page in place; skeletons show meanwhile.
  const pastEnd = data?.items.length === 0 && data.total > 0;
  useEffect(() => {
    if (pastEnd && !isPlaceholderData && params.page > 1) clampPage(totalPages);
  }, [pastEnd, isPlaceholderData, params.page, totalPages, clampPage]);

  const openDrawer = (target: DrawerTarget) => {
    setDrawerTarget(target);
    setDrawerOpen(true);
  };
  const openEditDrawer: RowAction = (row, trigger) => {
    openDrawer({ mode: 'edit', row, trigger });
  };

  const openDeleteDialog: RowAction = (row, trigger) => {
    setDeleteTarget({ row, trigger });
    setDeleteOpen(true);
  };
  // The server refuses a self-delete (403); hiding the button saves the trip.
  const canDelete = (row: AlumniListItem) => row.user_id !== myUserId;

  const handleClearSearch = () => {
    clearSearch();
    searchRef.current?.focus();
  };

  // Loading and loaded share one tree, so the table (and its header buttons)
  // stays mounted when the first page arrives.
  const loading = data === undefined || pastEnd;
  const rows = loading ? undefined : data.items;

  // After the drawer or the delete dialog closes, the table's refetch can land a moment later and
  // remove the row whose button just got focus back (renamed onto another
  // page, or deleted meanwhile). Focus then falls to <body>: send it to the
  // list heading instead (ADV-004). Checked once, on the next new set of rows.
  const focusWatchRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const watched = focusWatchRef.current;
    if (watched === null || rows === undefined) return;
    focusWatchRef.current = null;
    const active = document.activeElement;
    const lost = active === null || active === document.body || !active.isConnected;
    if (!watched.isConnected && lost) document.getElementById(listTitleId)?.focus();
  }, [rows, listTitleId]);

  let list;
  if (isError) {
    list = (
      <LoadError
        retrying={isFetching}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  } else if (rows?.length === 0) {
    list =
      params.q === undefined ? (
        <EmptyState heading="No alumni yet" text="Alumni you add will show up here." />
      ) : (
        <EmptyState
          heading={`No alumni match “${params.q}”`}
          text="Check the spelling, or search by name, company or job title."
          action={{ label: 'Clear search', onClick: handleClearSearch }}
        />
      );
  } else {
    const stale = isPlaceholderData && !loading;
    list = (
      <>
        <div className={styles.desktopOnly}>
          <AlumniTable
            labelledBy={listTitleId}
            rows={rows}
            sort={params.sort}
            order={params.order}
            onSort={sortBy}
            onEdit={openEditDrawer}
            onDelete={openDeleteDialog}
            canDelete={canDelete}
            stale={stale}
          />
        </div>
        <div className={styles.phoneOnly}>
          <AlumniCardList
            labelledBy={listTitleId}
            rows={rows}
            onEdit={openEditDrawer}
            onDelete={openDeleteDialog}
            canDelete={canDelete}
            stale={stale}
          />
        </div>
        {data === undefined || loading ? (
          <VisuallyHidden role="status">Loading alumni…</VisuallyHidden>
        ) : (
          <div className={styles.footer}>
            <AdminPagination
              page={params.page}
              totalPages={totalPages}
              shown={data.items.length}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <section className={styles.page} aria-labelledby={titleId}>
      <div className={styles.headerRow}>
        {/* Focusable so focus has somewhere to go when a toast closes under it. */}
        <h1 ref={headingRef} id={titleId} className={styles.title} tabIndex={-1}>
          Admin
        </h1>
        <Button
          variant="primary"
          className={styles.addButton}
          onClick={(event) => {
            openDrawer({ mode: 'add', trigger: event.currentTarget });
          }}
        >
          <PlusIcon className={styles.addIcon} />
          <span className={styles.addLabel}>Add alumni</span>
        </Button>
      </div>
      <AdminStats />
      <section className={styles.panel} aria-labelledby={listTitleId}>
        {/* Names the table and the card list; focusable so a dialog can return focus here. */}
        <VisuallyHidden as="h2" id={listTitleId} tabIndex={-1}>
          Alumni
        </VisuallyHidden>
        <div className={styles.search}>
          <AdminSearch q={params.q} onQueryChange={setQuery} inputRef={searchRef} />
        </div>
        {list}
      </section>
      {drawerTarget !== null && (
        <AlumniDrawer
          open={drawerOpen}
          target={drawerTarget}
          onClose={(opener) => {
            focusWatchRef.current = opener;
            setDrawerOpen(false);
          }}
          onToast={showToast}
          listHeadingId={listTitleId}
        />
      )}
      {deleteTarget !== null && (
        <DeleteAlumniDialog
          open={deleteOpen}
          target={deleteTarget}
          onClose={(opener) => {
            focusWatchRef.current = opener;
            setDeleteOpen(false);
          }}
          onToast={showToast}
          listHeadingId={listTitleId}
        />
      )}
      {toastElement}
    </section>
  );
}
