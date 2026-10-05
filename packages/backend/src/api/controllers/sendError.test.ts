import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@alumni/businesslogic';
import { sendError } from './sendError';

function fakeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe('sendError', () => {
  it('AppError → its status and { message }', () => {
    const res = fakeRes();
    sendError(res as unknown as Response, new AppError(404, 'User not found'));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('plain Error → 500 with a generic message, never the raw text', () => {
    const res = fakeRes();
    sendError(res as unknown as Response, new Error('invalid input syntax for type integer: "NaN"'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Something went wrong' });
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('invalid input syntax');
  });

  it('non-Error throwables → 500', () => {
    const res = fakeRes();
    sendError(res as unknown as Response, { status: 400, message: 'looks like AppError' });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Something went wrong' });
  });
});
