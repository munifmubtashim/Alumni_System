import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY } from '@/store/themeAtom';
import { setPrefersDark } from '@/test/setup';

function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}</p>;
}

describe('test harness', () => {
  it('renders a component and applies jest-dom matchers', () => {
    render(<Greeting name="alumni" />);
    expect(screen.getByText('Hello, alumni')).toBeInTheDocument();
  });

  it('resolves the @/ alias', () => {
    expect(THEME_STORAGE_KEY).toBe('alumni.theme');
  });

  it('stubs matchMedia and fires change listeners from setPrefersDark', () => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = vi.fn();
    mql.addEventListener('change', onChange);
    expect(mql.matches).toBe(false);

    setPrefersDark(true);
    expect(mql.matches).toBe(true);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ matches: true }));

    mql.removeEventListener('change', onChange);
    setPrefersDark(false);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('starts each test with clean storage and no data-theme', () => {
    expect(window.localStorage.length).toBe(0);
    expect(document.documentElement).not.toHaveAttribute('data-theme');
    window.localStorage.setItem('leak', '1');
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  it('reset the state the previous test left behind', () => {
    expect(window.localStorage.getItem('leak')).toBeNull();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });
});
