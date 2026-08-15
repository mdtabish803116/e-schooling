import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'auth_otps', schema: 'e_schooling' })
@Index(['recipient'])
@Index(['expiresAt'])
@Index(['createdAt'])
export class AuthOtp {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  recipient: string;

  @Column({ name: 'otp_code', type: 'varchar', length: 20 })
  otpCode: string;

  @Column({ type: 'varchar', length: 20, default: 'email' })
  channel: string;

  @Column({ type: 'varchar', length: 50, default: 'REGISTER' })
  purpose: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
