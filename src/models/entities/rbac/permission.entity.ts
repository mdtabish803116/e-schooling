import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'permissions', schema: 'e_schooling' })
export class Permission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'name', type: 'varchar', nullable: true, comment: 'Permission name' })
  name: string;

  @Column({ name: 'description', type: 'varchar', nullable: true, comment: 'Permission description' })
  description: string;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to PlatformUser' })
  createdById: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to PlatformUser' })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
