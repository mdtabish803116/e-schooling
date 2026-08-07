import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'transport_vehicles', schema: 'e_schooling' })
export class Vehicle {
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

  @Column({
    name: 'vehicle_number',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Vehicle number or bus identifier',
  })
  vehicleNumber: string;

  @Column({
    name: 'registration_number',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Official vehicle registration plate number',
  })
  registrationNumber: string;

  @Column({
    name: 'model',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Vehicle make and model',
  })
  model: string;

  @Column({
    name: 'capacity',
    type: 'integer',
    nullable: false,
    default: 32,
    comment: 'Seating capacity',
  })
  capacity: number;

  @Column({
    name: 'occupied_seats',
    type: 'integer',
    nullable: false,
    default: 0,
    comment: 'Occupied seats count',
  })
  occupiedSeats: number;

  @Index()
  @Column({
    name: 'driver_id',
    type: 'bigint',
    nullable: true,
    comment: 'Assigned Driver ID',
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
    name: 'helper_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  helperName: string;

  @Column({
    name: 'helper_phone',
    type: 'varchar',
    length: 25,
    nullable: true,
  })
  helperPhone: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    nullable: false,
    default: 'ACTIVE',
  })
  status: string;

  @Column({
    name: 'insurance_expiry',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  insuranceExpiry: string;

  @Column({
    name: 'fitness_expiry',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  fitnessExpiry: string;

  @Column({
    name: 'gps_enabled',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  gpsEnabled: boolean;

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
