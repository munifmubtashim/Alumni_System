import { UserDTO, UserQuery } from "@alumni/dal";
import type { MyProfileRow, PublicUserRow } from "@alumni/dal";
import { AppError } from "./errors.js";
import {
  EMAIL_PATTERN,
  optionalText,
  optionalWebUrl,
  optionalYear,
  requiredText,
  requireId,
  validateAlumniFields,
  validateUserBasics,
} from "./validation.js";

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  department?: string;
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

  public async createUser(user: UserDTO) {
    const newUser = await this.userQuery.createUser(user);
    return newUser;
  }

  public async findUserByEmail(email: string) {
    const user = await this.userQuery.findUserByEmail(email);
    return user;
  }

  public async findUserById(id: number) {
    const user = await this.userQuery.findUserById(id);
    return user;
  }


  public async getAllUsers() {
    const allUsers = await this.userQuery.getAllUsers();
    return allUsers;
  }

  public async deleteUser(id: number) {
    const deletedUser = await this.userQuery.deleteUser(id);
    return deletedUser;
  }

  public async updateLoginTime(id: number) {
    await this.userQuery.updateLoginTime(id);
  }

  public async updateLogoutTime(id: number) {
    await this.userQuery.updateLogoutTime(id);
  }

  // Validates a public sign-up body. Any `role` in the body is ignored.
  public validateRegistration(body: Record<string, unknown>): RegistrationInput {
    const name = requiredText(body.name, "Name", 100);
    const email = requiredText(body.email, "Email", 100);
    if (!EMAIL_PATTERN.test(email)) throw new AppError(400, "Email is not valid");

    const password = body.password;
    if (typeof password !== "string" || password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters");
    }
    // bcrypt only uses the first 72 bytes.
    if (Buffer.byteLength(password, "utf8") > 72) {
      throw new AppError(400, "Password is too long");
    }

    return {
      name,
      email,
      password,
      department: optionalText(body.department, "Department", 100),
      graduation_year: optionalYear(body.graduation_year, "Graduation year"),
      current_company: optionalText(body.current_company, "Company", 100),
      job_title: optionalText(body.job_title, "Job title", 100),
      linkedin_url: optionalWebUrl(body.linkedin_url, "LinkedIn URL"),
    };
  }

  // Creates an alumni account (user + alumni row) in one transaction.
  public async registerAlumni(input: RegistrationInput, passwordHash: string): Promise<PublicUserRow> {
    try {
      return await this.userQuery.createAlumniUser(
        { name: input.name, email: input.email, password: passwordHash },
        {
          department: input.department,
          graduation_year: input.graduation_year,
          current_company: input.current_company,
          job_title: input.job_title,
          linkedin_url: input.linkedin_url,
        },
      );
    } catch (error) {
      // users_email_key unique violation
      if ((error as { code?: string }).code === "23505") {
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

  // Every role edits its own name/photo; alumni fields only apply if the user has an alumni row
  // (otherwise they are ignored and no row is created). Email, password, role and ids are never read.
  public async updateMe(userId: number, body: Record<string, unknown>): Promise<MyProfileRow> {
    const current = await this.userQuery.findMyProfile(userId);
    if (!current) throw new AppError(404, "Account not found");
    const basics = validateUserBasics(body);
    const alumni = current.has_alumni_profile ? validateAlumniFields(body) : undefined;
    const updated = await this.userQuery.updateMyProfile(userId, basics, alumni);
    if (!updated) throw new AppError(404, "Account not found");
    return updated;
  }

  // PUT /api/users/:id: owner-only (admins included), name/photo only.
  public async updateOwnUser(requesterId: number, targetId: unknown, body: Record<string, unknown>): Promise<MyProfileRow> {
    const id = requireId(targetId, "User");
    if (id !== requesterId) throw new AppError(403, "You can only edit your own profile");
    const updated = await this.userQuery.updateMyProfile(id, validateUserBasics(body));
    if (!updated) throw new AppError(404, "User not found");
    return updated;
  }
}
