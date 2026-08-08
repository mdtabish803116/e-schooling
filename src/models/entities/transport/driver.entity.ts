import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'transport_drivers', schema: 'e_schooling' })
export class Driver {
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
    name: 'user_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  userId: string;

  @Index()
  @Column({
    name: 'role_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  roleId: string;

  @Column({
    name: 'role_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  roleName: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name: string;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 25,
    nullable: false,
  })
  phone: string;

  @Column({
    name: 'license_number',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  licenseNumber: string;

  @Column({
    name: 'license_expiry',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  licenseExpiry: string;

  @Column({
    name: 'address',
    type: 'text',
    nullable: true,
  })
  address: string;

  @Column({
    name: 'emergency_contact',
    type: 'varchar',
    length: 25,
    nullable: true,
  })
  emergencyContact: string;

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
