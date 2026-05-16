import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'schools', schema: 'e_schooling' })
export class School {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'school_name', type: 'varchar', nullable: true, comment: 'School name' })
  schoolName: string;

  @Index({ unique: true })
  @Column({ name: 'internal_school_code', type: 'varchar', nullable: false, comment: 'System generated unique school code' })
  internalSchoolCode: string;

  @Index()
  @Column({ name: 'external_school_code', type: 'varchar', nullable: true, comment: 'External/Board provided school code' })
  externalSchoolCode: string | null;

  @Column({ name: 'logo_url', type: 'varchar', nullable: true, comment: 'URL of the school logo' })
  logoUrl: string;

  @Column({ name: 'email', type: 'varchar', nullable: true, comment: 'School email' })
  email: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true, comment: 'School phone' })
  phone: string;

  @Column({ name: 'total_classes', type: 'int', default: 0, comment: 'Total classes available' })
  totalClasses: number;

  @Column({ name: 'total_sections', type: 'int', default: 0, comment: 'Total sections across all classes' })
  totalSections: number;

  @Column({ name: 'total_students', type: 'int', default: 0, comment: 'Total active students' })
  totalStudents: number;

  @Column({ name: 'total_teachers', type: 'int', default: 0, comment: 'Total employed teachers' })
  totalTeachers: number;

  @Column({ name: 'address_area', type: 'varchar', nullable: true, comment: 'Locality/Area' })
  addressArea: string;

  @Column({ name: 'address_landmark', type: 'varchar', nullable: true, comment: 'Nearby landmark' })
  addressLandmark: string;

  @Column({ name: 'address_city', type: 'varchar', nullable: true, comment: 'City' })
  addressCity: string;

  @Column({ name: 'address_district', type: 'varchar', nullable: true, comment: 'District' })
  addressDistrict: string;

  @Column({ name: 'address_state', type: 'varchar', nullable: true, comment: 'State' })
  addressState: string;

  @Column({ name: 'address_pincode', type: 'varchar', nullable: true, comment: 'Postal Pincode' })
  addressPincode: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to Creator' })
  createdById: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to Updater' })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}

