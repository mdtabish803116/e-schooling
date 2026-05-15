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

  /** 'school_owner' | 'school_user' | 'student' */
  actorType: 'school_owner' | 'school_user' | 'student';

  /**
   * For school_owner: undefined (owner can have multiple schools via school_members).
   * For school_user: the specific school they belong to.
   */
  schoolId?: string;

  /**
   * For school_user: the list of roles assigned (teacher | accountant | staff | admin).
   * For school_owner: will contain ['owner'].
   */
  roles: string[];
}
