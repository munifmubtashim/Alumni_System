import { describe, expect, it } from 'vitest';
import {
  toRegisterInput,
  validateLogin,
  validateRegister,
  type RegisterValues,
} from './validation';

const NOW = new Date(2026, 9, 5);

function student(overrides: Partial<RegisterValues> = {}): RegisterValues {
  return {
    role: 'student',
    name: 'Amina Rahman',
    email: 'amina@example.com',
    password: 'correct horse',
    university: 'Dhaka University',
    department: 'Physics',
    expected_graduation_year: '2028',
    ...overrides,
  };
}

function alumni(overrides: Partial<RegisterValues> = {}): RegisterValues {
  return student({ role: 'alumni', department: '', expected_graduation_year: '', ...overrides });
}

describe('validateLogin', () => {
  it('accepts a well-formed email and any non-empty password', () => {
    expect(validateLogin({ email: ' amina@example.com ', password: 'x' })).toEqual({});
  });

  it('requires both fields', () => {
    expect(validateLogin({ email: '  ', password: '' })).toEqual({
      email: 'Email is required',
      password: 'Password is required',
    });
  });

  it.each(['amina', 'amina@', 'amina@example', 'a b@example.com', '@example.com'])(
    'rejects the badly formed email %s',
    (email) => {
      expect(validateLogin({ email, password: 'x' })).toEqual({ email: 'Email is not valid' });
    },
  );

  it('lists errors in field order', () => {
    expect(Object.keys(validateLogin({ email: '', password: '' }))).toEqual(['email', 'password']);
  });
});

describe('validateRegister', () => {
  it('accepts valid student and alumni values', () => {
    expect(validateRegister(student(), NOW)).toEqual({});
    expect(validateRegister(alumni(), NOW)).toEqual({});
  });

  it('reports every required field for a student, in form order', () => {
    const errors = validateRegister(
      student({
        name: ' ',
        email: '',
        password: '',
        university: '',
        department: '',
        expected_graduation_year: '',
      }),
      NOW,
    );

    expect(errors).toEqual({
      name: 'Name is required',
      email: 'Email is required',
      password: 'Password must be at least 8 characters',
      university: 'University is required',
      department: 'Department is required',
      expected_graduation_year: 'Expected graduation year is required',
    });
    expect(Object.keys(errors)).toEqual([
      'name',
      'email',
      'password',
      'university',
      'department',
      'expected_graduation_year',
    ]);
  });

  it('does not check student-only fields for alumni', () => {
    const errors = validateRegister(
      alumni({ department: 'x'.repeat(500), expected_graduation_year: 'abc' }),
      NOW,
    );

    expect(errors).toEqual({});
  });

  it.each([
    ['name', 100, 'Name must be at most 100 characters'],
    ['university', 150, 'University must be at most 150 characters'],
    ['department', 100, 'Department must be at most 100 characters'],
  ] as const)('limits %s to %i characters after trimming', (field, max, message) => {
    expect(validateRegister(student({ [field]: ` ${'a'.repeat(max)} ` }), NOW)).toEqual({});
    expect(validateRegister(student({ [field]: 'a'.repeat(max + 1) }), NOW)).toEqual({
      [field]: message,
    });
  });

  it('limits email to 100 characters and checks its shape', () => {
    const long = `${'a'.repeat(90)}@example.com`;
    expect(validateRegister(student({ email: long }), NOW)).toEqual({
      email: 'Email must be at most 100 characters',
    });
    expect(validateRegister(student({ email: 'amina.example.com' }), NOW)).toEqual({
      email: 'Email is not valid',
    });
  });

  describe('password', () => {
    it('needs at least 8 characters, counted as characters (not bytes)', () => {
      expect(validateRegister(student({ password: '1234567' }), NOW)).toEqual({
        password: 'Password must be at least 8 characters',
      });
      expect(validateRegister(student({ password: '12345678' }), NOW)).toEqual({});
      // 3 CJK characters are 9 UTF-8 bytes but still too short (the backend uses .length).
      expect(validateRegister(student({ password: '密码字' }), NOW)).toEqual({
        password: 'Password must be at least 8 characters',
      });
    });

    it('allows at most 72 UTF-8 bytes', () => {
      expect(validateRegister(student({ password: 'a'.repeat(72) }), NOW)).toEqual({});
      expect(validateRegister(student({ password: 'a'.repeat(73) }), NOW)).toEqual({
        password: 'Password is too long',
      });
      // 24 three-byte characters = 72 bytes; 25 = 75 bytes.
      expect(validateRegister(student({ password: '密'.repeat(24) }), NOW)).toEqual({});
      expect(validateRegister(student({ password: '密'.repeat(25) }), NOW)).toEqual({
        password: 'Password is too long',
      });
    });

    it('is not trimmed', () => {
      expect(validateRegister(student({ password: '        ' }), NOW)).toEqual({});
    });
  });

  describe('expected graduation year', () => {
    const range = 'Expected graduation year must be between 2026 and 2034';

    it('accepts this year through this year + 8, from the injected date', () => {
      expect(validateRegister(student({ expected_graduation_year: '2026' }), NOW)).toEqual({});
      expect(validateRegister(student({ expected_graduation_year: ' 2034 ' }), NOW)).toEqual({});
    });

    it.each(['2025', '2035', '26', '20288', '2o28', '2028.0'])('rejects %s', (year) => {
      expect(validateRegister(student({ expected_graduation_year: year }), NOW)).toEqual({
        expected_graduation_year: range,
      });
    });

    it('moves with the date', () => {
      const later = new Date(2030, 0, 1);
      expect(validateRegister(student({ expected_graduation_year: '2028' }), later)).toEqual({
        expected_graduation_year: 'Expected graduation year must be between 2030 and 2038',
      });
    });
  });
});

describe('toRegisterInput', () => {
  it('trims text, keeps the password as typed and sends student fields for students', () => {
    expect(
      toRegisterInput(
        student({ name: ' Amina ', password: ' secret pw ', expected_graduation_year: ' 2028 ' }),
      ),
    ).toEqual({
      role: 'student',
      name: 'Amina',
      email: 'amina@example.com',
      password: ' secret pw ',
      university: 'Dhaka University',
      department: 'Physics',
      expected_graduation_year: '2028',
    });
  });

  it('leaves out student-only fields for alumni, even when they hold values', () => {
    expect(
      toRegisterInput(alumni({ department: 'Physics', expected_graduation_year: '2028' })),
    ).toEqual({
      role: 'alumni',
      name: 'Amina Rahman',
      email: 'amina@example.com',
      password: 'correct horse',
      university: 'Dhaka University',
    });
  });
});
