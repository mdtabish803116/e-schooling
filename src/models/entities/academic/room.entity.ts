import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'rooms', schema: 'e_schooling' })
export class Room {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: false, comment: 'Reference to School' })
  schoolId: string;

  @Column({ name: 'name', type: 'varchar', nullable: false, comment: 'Room name or number (e.g. Room 101, Science Lab A)' })
  name: string;

  @Column({ name: 'block', type: 'varchar', nullable: true, comment: 'Building block (e.g. Main Block, Science Wing)' })
  block: string;

  @Column({ name: 'floor', type: 'integer', nullable: true, default: 1, comment: 'Floor number' })
  floor: number;

  @Column({ name: 'capacity', type: 'integer', nullable: true, default: 40, comment: 'Maximum seating/student capacity' })
  capacity: number;

  @Column({ name: 'equipment', type: 'jsonb', nullable: true, default: '[]', comment: 'List of equipment/amenities (JSON array of strings)' })
  equipment: string[];

  @Index()
  @Column({ name: 'assigned_section_id', type: 'bigint', nullable: true, comment: 'Currently assigned section ID (null = vacant)' })
  assignedSectionId: string | null;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser who created this record' })
  createdById: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser who last updated this record' })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
