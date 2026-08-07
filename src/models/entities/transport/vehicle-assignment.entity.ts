import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'transport_vehicle_assignments', schema: 'e_schooling' })
export class VehicleAssignment {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to School',
  })
  schoolId: string;

  @Index()
  @Column({
    name: 'vehicle_id',
    type: 'bigint',
    nullable: false,
  })
  vehicleId: string;

  @Column({
    name: 'vehicle_number',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  vehicleNumber: string;

  @Column({
    name: 'registration_number',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  registrationNumber: string;

  @Index()
  @Column({
    name: 'driver_id',
    type: 'bigint',
    nullable: false,
  })
  driverId: string;

  @Column({
    name: 'driver_name',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  driverName: string;

  @Column({
    name: 'driver_phone',
    type: 'varchar',
    length: 25,
    nullable: false,
  })
  driverPhone: string;

  @Column({
    name: 'assigned_date',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  assignedDate: string;

  @Column({
    name: 'released_date',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  releasedDate: string;

  @Column({
    name: 'assigned_by',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  assignedBy: string;

  @Column({
    name: 'notes',
    type: 'text',
    nullable: true,
  })
  notes: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    nullable: false,
    default: 'ACTIVE',
  })
  status: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;
}
