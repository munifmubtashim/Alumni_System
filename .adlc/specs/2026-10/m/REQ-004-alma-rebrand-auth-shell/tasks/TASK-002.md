# TASK-002 — Input endAdornment and PasswordInput primitive

| Field | Value |
|---|---|
| REQ | REQ-004 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-003 |

## Goal

A drop-in `PasswordInput` with an accessible show/hide button exists (spec AC6), built on an `Input` that can hold a trailing control.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/components/ui/Input/Input.tsx`, `Input.module.css` | edit — optional `endAdornment?: ReactNode` and `labelAction?: ReactNode` |
| `packages/frontend/src/components/ui/Input/Input.test.tsx` | edit — add `endAdornment` and `labelAction` cases; existing cases unchanged |
| `packages/frontend/src/components/ui/PasswordInput/{PasswordInput.tsx,PasswordInput.module.css,PasswordInput.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/README.md` | edit — list PasswordInput (and Logo, from TASK-001) |

## Approach

- **Input:** wrap `<input>` in `<div className={styles.control}>` (`position: relative; width: 100%; min-width: 0`; the input keeps `width: 100%; box-sizing: border-box`) and render `endAdornment` after it. Add `labelAction`: when set, the `<label>` and the action sit in a `.labelRow` (flex, `justify-content: space-between`, `align-items: baseline`); without it the markup is as today. Add right padding to the input only when an adornment exists (a modifier class). Label, error, helper and `aria-describedby` behaviour is byte-for-byte the same.
- **PasswordInput:** `(props: Omit<InputProps,'type'|'endAdornment'>)` with local `const [visible, setVisible] = useState(false)`. It renders `<Input {...props} type={visible ? 'text' : 'password'} endAdornment={<button type="button" className={styles.toggle} aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(v => !v)}>{icon}</button>} />`.
  - The icon is an inline eye or eye-off SVG, `aria-hidden`, `stroke: currentColor`.
  - The toggle colour is `var(--ink-muted)`, and `var(--ink-secondary)` on hover via `:where()` per G04.
  - Forward `ref` (React 19 ref-as-prop works through `ComponentPropsWithRef`).
  - Keep focus in the input after a click: `onMouseDown={e => e.preventDefault()}` on the button, so the input doesn't blur.

## Acceptance

- [x] Tests:
  - `type` toggles; the name flips "Show password"/"Hide password"
  - Tab reaches the button and Enter/Space toggle it
  - the input keeps focus after a mouse click on the toggle (focus the input first, then click)
  - no `aria-pressed` (the flipping name carries the state)
  - password and email inputs render the same width class (no narrower field)
  - `error` and `label` pass through (`getByLabelText` works, `aria-invalid` set)
- [x] All existing Input tests pass unchanged
- [x] `npm run lint`, `npm run typecheck`, `npm test` pass

## Notes

- components/ui may not import services, store, features, app or config (TASK-001 adds the config ban to *config*, not to ui; still, keep ui prop-driven).
- Implemented 2026-10-06. Input always wraps the `<input>` in `.control` (relative, width 100%, min-width 0); the input itself gained `width: 100%` + `box-sizing: border-box`. `.withAdornment` sets `padding-inline-end: var(--space-7)` (3rem) to clear the 2.5rem toggle plus its `--space-1` inset; it follows `.input` in the file so it wins at equal specificity. The adornment is absolutely positioned (`inset-block: 0`, flex-centred).
- `labelAction` renders a `.labelRow` div holding `<label>` + action; the action is outside the `<label>`, so the accessible name stays the label text only. Without `labelAction` the label is a direct child of `.field`, as before.
- PasswordInput icons are inline SVGs (Feather-style eye / eye-off), `aria-hidden`, `focusable="false"`, `stroke: currentcolor`; the toggle is 2.5rem square, `--ink-muted`, `--ink-secondary` on `:where(:hover)`. Ref passes through via the props spread (React 19 ref-as-prop); a test asserts it.
- README: added PasswordInput and Logo rows (Logo text as given by the orchestrator) and noted Input's new props.
- One transient `format:check` failure on the first run came from TASK-001 files mid-edit; a rerun passed clean.

## Related

- Architecture: [[specs/2026-10/m/REQ-004-alma-rebrand-auth-shell/architecture]]
- Gotchas: [[knowledge/gotchas#^g04|G04]], [[knowledge/gotchas#^g10|G10]]
