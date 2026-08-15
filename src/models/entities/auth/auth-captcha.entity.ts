import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'auth_captchas', schema: 'e_schooling' })
@Index(['captchaId'])
@Index(['expiresAt'])
@Index(['createdAt'])
export class AuthCaptcha {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'captcha_id', type: 'varchar', length: 100, unique: true })
  captchaId: string;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
