import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { StatusEnum } from '../../enums/enums';

@Entity({ name: 'schools', schema: 'e_schooling' })
export class School {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'school_name', type: 'varchar', nullable: true, comment: 'School name' })
  schoolName: string;

  @Index({ unique: true })
  @Column({ name: 'school_code', type: 'varchar', nullable: true, comment: 'Unique school code' })
  schoolCode: string;

  @Column({ name: 'email', type: 'varchar', nullable: true, comment: 'School email' })
  email: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true, comment: 'School phone' })
  phone: string;

  @Column({ name: 'address', type: 'text', nullable: true, comment: 'School physical address' })
  address: string;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'active | inactive' })
  status: StatusEnum;

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
