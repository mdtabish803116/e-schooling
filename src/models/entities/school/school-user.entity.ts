import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UserTypeEnum } from '../../enums/enums';

@Entity({ name: 'school_users', schema: 'e_schooling' })
export class SchoolUser {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'school_owner_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolOwner' })
  schoolOwnerId: string;

  @Column({ name: 'name', type: 'varchar', nullable: true, comment: 'User name' })
  name: string;

  @Column({ name: 'username', type: 'varchar', nullable: true, comment: 'Unique username' })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true, comment: 'Hashed password' })
  passwordHash: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true, comment: 'User phone number' })
  phone: string;

  @Column({ name: 'user_type', type: 'varchar', nullable: true, comment: 'admin | teacher | accountant | staff' })
  userType: UserTypeEnum;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolOwner' })
  createdById: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolOwner' })
  updatedById: string;

  @Column({ name: 'state_id', type: 'bigint', nullable: true, comment: 'Reference to parent State' })
  stateId: string;

  @Column({ name: 'district_id', type: 'bigint', nullable: true, comment: 'Reference to parent District' })
  districtId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
