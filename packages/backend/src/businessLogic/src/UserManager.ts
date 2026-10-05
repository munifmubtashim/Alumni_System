import bcrypt from "bcrypt";
import { UserQuery } from "@alumni/dal";
import type { MyProfileRow, PublicUserRow } from "@alumni/dal";
import { AppError } from "./errors.js";
import {
  optionalText,
  optionalWebUrl,
  optionalYear,
  requiredEmail,
  requiredText,
  requireId,
  validateAlumniFields,
  validateNewPassword,
  requiredExpectedYear,
  validateStudentFields,
  validateUserBasics,
} from "./validation.js";

export const SIGNUP_ROLES = ["alumni", "student"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

// Roles an admin may give an account through POST /api/users.
export const ADMIN_CREATE_ROLES = ["admin", "alumni", "student"] as const;
export type AdminCreateRole = (typeof ADMIN_CREATE_ROLES)[number];

export interface NewUserInput {
  role: AdminCreateRole;
  name: string;
  email: string;
  password: string;
}

const isUniqueViolation = (error: unknown) => (error as { code?: string }).code === "23505";

export interface RegistrationInput {
  role: SignupRole;
  name: string;
  email: string;
  password: string;
  university: string;
  department?: string; // required for students
  expected_graduation_year?: string; // students only, required
  graduation_year?: string;
  current_company?: string;
  job_title?: string;
  linkedin_url?: string;
}

export class UserManager {
  userQuery: UserQuery;

  constructor() {
    this.userQuery = new UserQuery();
  }

  // Validates an admin's POST /api/users body with the same rules as sign-up, plus admin as a role.
  public validateNewUser(body: Record<string, unknown>): NewUserInput {
    const role = body.role;
    if (!ADMIN_CREATE_ROLES.includes(role as AdminCreateRole)) {
      throw new AppError(400, 'Role must be "admin", "alumni" or "student"');
    }
    return {
      role: role as AdminCreateRole,
      name: requiredText(body.name, "Name", 100),
      email: requiredEmail(body.email),
      password: validateNewPassword(body.password),
    };
  }

  // `passwordHash` must already be a bcrypt hash. Returns the public columns only.
  public async createUser(input: NewUserInput, passwordHash: string): Promise<PublicUserRow> {
    try {
      return await this.userQuery.createUser({ ...input, password: passwordHash });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, "An account with this email already exists");
      }
      throw error;
    }
  }

  public async findUserByEmail(email: string) {
    const user = await this.userQuery.findUserByEmail(email);
    return user;
  }

  public async findUserById(id: number): Promise<PublicUserRow | undefined> {
    const user = await this.userQuery.findUserById(id);
    return user;
  }

  public async getAllUsers(): Promise<PublicUserRow[]> {
    const allUsers = await this.userQuery.getAllUsers();
    return allUsers;
  }

  public async deleteUser(id: number) {
    const deletedUser = await this.userQuery.deleteUser(id);
    return deletedUser;
  }

  // Validates a public sign-up body. `role` must be "student" or "alumni" (never admin).
  public validateRegistration(body: Record<string, unknown>): RegistrationInput {
    const role = body.role;
    if (!SIGNUP_ROLES.includes(role as SignupRole)) {
      throw new AppError(400, 'Role must be "student" or "alumni"');
    }
    const name = requiredText(body.name, "Name", 100);
    const email = requiredEmail(body.email);
    const password = validateNewPassword(body.password);
    const university = requiredText(body.university, "University", 150);

    if (role === "student") {
      return {
        role,
        name,
        email,
        password,
        university,
        department: requiredText(body.department, "Department", 100),
        expected_graduation_year: requiredExpectedYear(body.expected_graduation_year),
      };
    }
    return {
      role: "alumni",
      name,
      email,
      password,
      university,
      department: optionalText(body.department, "Department", 100),
      graduation_year: optionalYear(body.graduation_year, "Graduation year"),
      current_company: optionalText(body.current_company, "Company", 100),
      job_title: optionalText(body.job_title, "Job title", 100),
      linkedin_url: optionalWebUrl(body.linkedin_url, "LinkedIn URL"),
    };
  }

  // Creates a student (user + students row) or alumni (user + alumni row) account in one transaction.
  public async register(input: RegistrationInput, passwordHash: string): Promise<PublicUserRow> {
    const user = { name: input.name, email: input.email, password: passwordHash, university: input.university };
    try {
      if (input.role === "student") {
        return await this.userQuery.createStudentUser(user, {
          department: input.department,
          expected_graduation_year: input.expected_graduation_year,
        });
      }
      return await this.userQuery.createAlumniUser(user, {
        department: input.department,
        graduation_year: input.graduation_year,
        current_company: input.current_company,
        job_title: input.job_title,
        linkedin_url: input.linkedin_url,
      });
    } catch (error) {
      // users_email_key unique violation
      if (isUniqueViolation(error)) {
        throw new AppError(409, "An account with this email already exists");
      }
      throw error;
    }
  }

  public async getMe(userId: number): Promise<MyProfileRow> {
    const profile = await this.userQuery.findMyProfile(userId);
    if (!profile) throw new AppError(404, "Account not found");
    return profile;
  }

  // Every role edits its own name/photo/university/email. Alumni fields only apply if the user has an
  // alumni row, student fields only if they have a students row (otherwise they are ignored and no row
  // is created). Changing the email requires `current_password`.
  // An omitted email keeps the current one. Password, role and ids are never read here.
  public async updateMe(userId: number, body: Record<string, unknown>): Promise<MyProfileRow> {
    const current = await this.userQuery.findMyProfile(userId);
    if (!current) throw new AppError(404, "Account not found");
    const basics = validateUserBasics(body);
    const alumni = current.has_alumni_profile ? validateAlumniFields(body) : undefined;
    const student = !alumni && current.has_student_profile ? validateStudentFields(body) : undefined;

    let email: string | undefined;
    if (body.email !== undefined && body.email !== null) {
      const requested = requiredEmail(body.email);
      if (requested !== current.email) {
        await this.checkCurrentPassword(userId, body.current_password);
        email = requested;
      }
    }

    try {
      const updated = await this.userQuery.updateMyProfile(userId, basics, alumni, email, student);
      if (!updated) throw new AppError(404, "Account not found");
      return updated;
    } catch (error) {
      if (isUniqueViolation(error)) throw new AppError(409, "Email already in use");
      throw error;
    }
  }

  // PUT /api/me/password: the caller changes their own password after confirming the current one.
  public async changeMyPassword(userId: number, body: Record<string, unknown>): Promise<void> {
    const newPassword = validateNewPassword(body.new_password, "New password");
    const currentPassword = await this.checkCurrentPassword(userId, body.current_password);
    if (newPassword === currentPassword) {
      throw new AppError(400, "New password must be different from the current one");
    }
    const changed = await this.userQuery.updatePassword(userId, await bcrypt.hash(newPassword, 10));
    if (!changed) throw new AppError(404, "Account not found");
  }

  // 400 (not 401) on a wrong password, so the client doesn't treat it as an expired session.
  private async checkCurrentPassword(userId: number, value: unknown): Promise<string> {
    if (typeof value !== "string" || !value) throw new AppError(400, "Current password is required");
    const hash = await this.userQuery.findPasswordHash(userId);
    if (!hash) throw new AppError(404, "Account not found");
    if (!(await bcrypt.compare(value, hash))) throw new AppError(400, "Current password is incorrect");
    return value;
  }

  // PUT /api/users/:id: owner-only (admins included), name/photo/university only.
  public async updateOwnUser(requesterId: number, targetId: unknown, body: Record<string, unknown>): Promise<MyProfileRow> {
    const id = requireId(targetId, "User");
    if (id !== requesterId) throw new AppError(403, "You can only edit your own profile");
    const updated = await this.userQuery.updateMyProfile(id, validateUserBasics(body));
    if (!updated) throw new AppError(404, "User not found");
    return updated;
  }
}
