import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { StatusEnum } from '../../enums/enums';

@Entity({ name: 'features', schema: 'e_schooling' })
export class Feature {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'name', type: 'varchar', nullable: true, comment: 'Feature name' })
  name: string;

  @Index({ unique: true })
  @Column({ name: 'code', type: 'varchar', nullable: true, comment: 'Unique feature code' })
  code: string;

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Feature description' })
  description: string;

  @Column({ name: 'category', type: 'varchar', nullable: true, comment: 'Feature category' })
  category: string;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'active | inactive' })
  status: StatusEnum;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
