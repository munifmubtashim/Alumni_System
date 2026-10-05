import { expect } from 'vitest';
import { AppError } from '@alumni/businesslogic';

/**
 * Asserts that `action` fails with an AppError of the given status. Takes a promise
 * (async manager call) or a function (sync validator, or one returning a promise).
 * Always await it.
 */
export async function expectAppError(
  action: Promise<unknown> | (() => unknown),
  status: number,
): Promise<AppError> {
  let error: unknown;
  let threw = false;
  try {
    await (typeof action === 'function' ? action() : action);
  } catch (e) {
    threw = true;
    error = e;
  }
  expect(threw, 'expected an AppError, but nothing was thrown').toBe(true);
  expect(error).toBeInstanceOf(AppError);
  expect((error as AppError).status).toBe(status);
  return error as AppError;
}
