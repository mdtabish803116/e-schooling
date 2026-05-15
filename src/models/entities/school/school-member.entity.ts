import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { SchoolOwnerRoleEnum, InvitationStatusEnum } from '../../enums/enums';

@Entity({ name: 'school_members', schema: 'e_schooling' })
@Index(['schoolId', 'schoolOwnerId'], { unique: true })
export class SchoolMember {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'school_owner_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolOwner' })
  schoolOwnerId: string;

  @Column({ name: 'role', type: 'varchar', nullable: true, comment: 'owner | admin | teacher | accountant | staff' })
  role: SchoolOwnerRoleEnum;

  @Column({ name: 'is_primary_owner', type: 'boolean', nullable: true, comment: 'Whether the user is the primary owner' })
  isPrimaryOwner: boolean;

  @Column({ name: 'invitation_state', type: 'varchar', nullable: true, comment: 'pending | accepted | rejected' })
  invitationState: InvitationStatusEnum;

  @Column({ name: 'joined_at', type: 'timestamp', nullable: true, comment: 'Timestamp of joining' })
  joinedAt: Date;

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
