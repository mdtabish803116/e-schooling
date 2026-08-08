import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AuthActionEnum {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  LOGOUT = 'LOGOUT',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  FORCE_LOGOUT = 'FORCE_LOGOUT',
  REVOKED = 'REVOKED',
}

export enum LoginMethodEnum {
  PASSWORD = 'PASSWORD',
  OTP = 'OTP',
  SSO_GOOGLE = 'SSO_GOOGLE',
  SSO_MICROSOFT = 'SSO_MICROSOFT',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
}

export enum SessionStatusEnum {
  ACTIVE = 'ACTIVE',
  LOGGED_OUT = 'LOGGED_OUT',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

@Entity({ name: 'user_login_history', schema: 'e_schooling' })
@Index(['schoolId', 'loginAt'])
@Index(['userId', 'loginAt'])
@Index(['sessionId'])
@Index(['sessionStatus'])
export class UserLoginHistory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'school_id', type: 'varchar', nullable: true })
  schoolId: string | null;

  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 50, default: 'STAFF' })
  role: string;

  @Column({ name: 'entity_id', type: 'varchar', nullable: true })
  entityId: string | null;

  @Column({ name: 'identifier_used', type: 'varchar', length: 150 })
  identifierUsed: string;

  @Column({
    name: 'auth_action',
    type: 'varchar',
    length: 50,
    default: AuthActionEnum.LOGIN_SUCCESS,
  })
  authAction: string;

  @Column({
    name: 'login_method',
    type: 'varchar',
    length: 50,
    default: LoginMethodEnum.PASSWORD,
  })
  loginMethod: string;

  @Column({
    name: 'login_status',
    type: 'varchar',
    length: 20,
    default: 'SUCCESS',
  })
  loginStatus: string;

  @Column({
    name: 'failure_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  failureReason: string | null;

  @Column({
    name: 'login_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  loginAt: Date;

  @Column({ name: 'logout_at', type: 'timestamp', nullable: true })
  logoutAt: Date | null;

  @Column({ name: 'session_duration_seconds', type: 'integer', nullable: true })
  sessionDurationSeconds: number | null;

  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
  sessionId: string | null;

  @Column({
    name: 'refresh_token_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  refreshTokenId: string | null;

  @Column({
    name: 'session_status',
    type: 'varchar',
    length: 30,
    default: SessionStatusEnum.ACTIVE,
  })
  sessionStatus: string;

  @Column({
    name: 'device_type',
    type: 'varchar',
    length: 50,
    default: 'Desktop',
  })
  deviceType: string;

  @Column({
    name: 'device_name',
    type: 'varchar',
    length: 100,
    default: 'Unknown Device',
  })
  deviceName: string;

  @Column({ type: 'varchar', length: 100, default: 'Unknown Browser' })
  browser: string;

  @Column({
    name: 'browser_version',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  browserVersion: string | null;

  @Column({
    name: 'operating_system',
    type: 'varchar',
    length: 100,
    default: 'Unknown OS',
  })
  operatingSystem: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({
    name: 'ip_address',
    type: 'varchar',
    length: 100,
    default: '127.0.0.1',
  })
  ipAddress: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ name: 'mfa_used', type: 'boolean', default: false })
  mfaUsed: boolean;

  @Column({ name: 'risk_score', type: 'float', default: 0 })
  riskScore: number;

  @Column({ name: 'is_suspicious', type: 'boolean', default: false })
  isSuspicious: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;
}
