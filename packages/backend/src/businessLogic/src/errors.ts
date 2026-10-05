// Expected failures that controllers translate into HTTP responses.
export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

// Postgres unique_violation (e.g. a duplicate email or a second alumni row for one user).
export const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === "23505";

// Postgres foreign_key_violation (e.g. deleting a user that posts or comments still reference).
export const isForeignKeyViolation = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === "23503";
