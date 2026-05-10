import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { StatusEnum } from '../../enums/enums';

@Entity({ name: 'addon_modules', schema: 'e_schooling' })
export class AddonModule {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'name', type: 'varchar', nullable: true, comment: 'Addon module name' })
  name: string;

  @Index({ unique: true })
  @Column({ name: 'code', type: 'varchar', nullable: true, comment: 'Unique module code' })
  code: string;

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Addon description' })
  description: string;

  @Column({ name: 'monthly_price', type: 'decimal', nullable: true, comment: 'Monthly price for the addon' })
  monthlyPrice: number;

  @Column({ name: 'yearly_price', type: 'decimal', nullable: true, comment: 'Yearly price for the addon' })
  yearlyPrice: number;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'active | inactive' })
  status: StatusEnum;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;
}
