import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'transport_allocations', schema: 'e_schooling' })
export class StudentTransportAllocation {
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
  })
  schoolId: string;

  @Index()
  @Column({
    name: 'student_id',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  studentId: string;

  @Column({
    name: 'student_name',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  studentName: string;

  @Column({
    name: 'roll_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  rollNumber: string;

  @Column({
    name: 'class_name',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  className: string;

  @Column({
    name: 'section_name',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  sectionName: string;

  @Index()
  @Column({
    name: 'route_id',
    type: 'bigint',
    nullable: false,
  })
  routeId: string;

  @Column({
    name: 'route_name',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  routeName: string;

  @Index()
  @Column({
    name: 'pickup_point_id',
    type: 'bigint',
    nullable: false,
  })
  pickupPointId: string;

  @Column({
    name: 'pickup_point_name',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  pickupPointName: string;

  @Column({
    name: 'pickup_time',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  pickupTime: string;

  @Index()
  @Column({
    name: 'vehicle_id',
    type: 'bigint',
    nullable: true,
  })
  vehicleId: string;

  @Column({
    name: 'vehicle_number',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  vehicleNumber: string;

  @Index()
  @Column({
    name: 'driver_id',
    type: 'bigint',
    nullable: true,
  })
  driverId: string;

  @Column({
    name: 'driver_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  driverName: string;

  @Column({
    name: 'driver_phone',
    type: 'varchar',
    length: 25,
    nullable: true,
  })
  driverPhone: string;

  @Column({
    name: 'monthly_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  monthlyFee: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    nullable: false,
    default: 'ACTIVE',
  })
  status: string;

  @Column({
    name: 'start_date',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  startDate: string;

  @Column({
    name: 'end_date',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  endDate: string;

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
