import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'transport_routes', schema: 'e_schooling' })
export class TransportRoute {
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

  @Column({
    name: 'route_code',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  routeCode: string;

  @Column({
    name: 'route_name',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  routeName: string;

  @Column({
    name: 'start_location',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  startLocation: string;

  @Column({
    name: 'end_location',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  endLocation: string;

  @Column({
    name: 'distance_km',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: false,
    default: 0,
  })
  distanceKm: number;

  @Index()
  @Column({
    name: 'assigned_vehicle_id',
    type: 'bigint',
    nullable: true,
  })
  assignedVehicleId: string;

  @Column({
    name: 'assigned_vehicle_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  assignedVehicleNumber: string;

  @Column({
    name: 'base_monthly_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  baseMonthlyFee: number;

  @Column({
    name: 'total_allocated_students',
    type: 'integer',
    nullable: false,
    default: 0,
  })
  totalAllocatedStudents: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    nullable: false,
    default: 'ACTIVE',
  })
  status: string;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isDeleted: boolean;

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
