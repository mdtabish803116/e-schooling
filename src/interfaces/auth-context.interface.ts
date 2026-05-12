/**
 * AuthContext represents the decoded JWT user attached to every request.
 *
 * actorType distinguishes WHO is making the request:
 *   - 'school_owner' → from the school_owners table, has access to all
 *     schools they registered under their email.
 *   - 'school_user'  → from the school_users table, scoped to one school
 *     and one role (teacher, accountant, staff, etc.).
 *
 * Services must check actorType before resolving permissions.
 */
export interface AuthContext {
  /** Primary key (string because postgres bigserial → string in TypeORM) */
  id: string;

  email: string;

  /** 'school_owner' | 'school_user' */
  actorType: 'school_owner' | 'school_user';

  /**
   * For school_owner: undefined (owner can have multiple schools via school_members).
   * For school_user: the specific school they belong to.
   */
  schoolId?: string;

  /**
   * Role for school_user (teacher | accountant | staff | admin).
   * For school_owner: always 'owner'.
   */
  role: string;
}
