import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Link } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import { clearToken, setToken } from '@/services/authToken';
import { useLeaveGuard } from './useLeaveGuard';

// A JWT-shaped token that expires in an hour (the guard reads the live token).
function signIn(): void {
  const encode = (value: object) => window.btoa(JSON.stringify(value)).replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  setToken(`${encode({ alg: 'HS256' })}.${encode({ sub: 1, exp })}.sig`);
}

function Guarded({ active }: { active: boolean }) {
  const blocker = useLeaveGuard(active);
  return (
    <div>
      <p>Form page</p>
      <p>Blocker: {blocker.state}</p>
      <Link to="/elsewhere">Elsewhere</Link>
      <Link to="/login">Log in</Link>
      <Link to="/me?tab=1">Same page</Link>
      {blocker.state === 'blocked' && (
        <>
          <button
            type="button"
            onClick={() => {
              blocker.reset();
            }}
          >
            Stay
          </button>
          <button
            type="button"
            onClick={() => {
              blocker.proceed();
            }}
          >
            Leave
          </button>
        </>
      )}
    </div>
  );
}

function renderGuard(active: boolean) {
  const router = createMemoryRouter(
    [
      { path: '/me', element: <Guarded active={active} /> },
      { path: '/elsewhere', element: <p>Elsewhere page</p> },
      { path: '/login', element: <p>Login page</p> },
    ],
    { initialEntries: ['/start', '/me'], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
  return router;
}

function fireBeforeUnload(): Event {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe('useLeaveGuard', () => {
  it('blocks an in-app link while active, and Stay keeps the page', async () => {
    signIn();
    const user = userEvent.setup();
    renderGuard(true);
    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));
    expect(screen.getByText('Blocker: blocked')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stay' }));
    expect(screen.getByText('Blocker: unblocked')).toBeInTheDocument();
    expect(screen.getByText('Form page')).toBeInTheDocument();
  });

  it('lets the navigation go on when the user chooses Leave', async () => {
    signIn();
    const user = userEvent.setup();
    renderGuard(true);
    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));
    await user.click(screen.getByRole('button', { name: 'Leave' }));
    expect(await screen.findByText('Elsewhere page')).toBeInTheDocument();
  });

  it('blocks Back while active', async () => {
    signIn();
    const router = renderGuard(true);
    await act(async () => {
      await router.navigate(-1);
    });
    expect(screen.getByText('Blocker: blocked')).toBeInTheDocument();
  });

  it('never blocks while inactive', async () => {
    signIn();
    const user = userEvent.setup();
    renderGuard(false);
    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));
    expect(await screen.findByText('Elsewhere page')).toBeInTheDocument();
  });

  it('does not block once the session is gone (a 401 logout while dirty, ADV-002)', async () => {
    signIn();
    const router = renderGuard(true);
    clearToken();
    await act(async () => {
      await router.navigate('/elsewhere');
    });
    expect(screen.getByText('Elsewhere page')).toBeInTheDocument();
  });

  it('does not block a navigation to /login', async () => {
    signIn();
    const user = userEvent.setup();
    renderGuard(true);
    await user.click(screen.getByRole('link', { name: 'Log in' }));
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('does not block a navigation that stays on the same path', async () => {
    signIn();
    const user = userEvent.setup();
    const router = renderGuard(true);
    await user.click(screen.getByRole('link', { name: 'Same page' }));
    expect(screen.getByText('Blocker: unblocked')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?tab=1');
  });

  it('asks before unload only while active', () => {
    signIn();
    const { unmount } = render(<GuardHost active />);
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
    unmount();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
    render(<GuardHost active={false} />);
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});

// useBlocker needs a data router; this host mounts the hook in one.
function GuardHost({ active }: { active: boolean }) {
  const router = createMemoryRouter([{ path: '/', element: <Guarded active={active} /> }]);
  return <RouterProvider router={router} />;
}
