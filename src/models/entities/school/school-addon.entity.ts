import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { StatusEnum } from '../../enums/enums';

@Entity({ name: 'school_addons', schema: 'e_schooling' })
export class SchoolAddon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'addon_module_id', type: 'bigint', nullable: true, comment: 'Reference to AddonModule' })
  addonModuleId: string;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true, comment: 'Addon start date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true, comment: 'Addon end date' })
  endDate: Date;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'active | inactive' })
  status: StatusEnum;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;
}
