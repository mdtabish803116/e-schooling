import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'transport_pickup_points', schema: 'e_schooling' })
export class PickupPoint {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'route_id',
    type: 'bigint',
    nullable: false,
  })
  routeId: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  name: string;

  @Column({
    name: 'pickup_time',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  pickupTime: string;

  @Column({
    name: 'drop_time',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  dropTime: string;

  @Column({
    name: 'sequence_order',
    type: 'integer',
    nullable: false,
    default: 1,
  })
  sequenceOrder: number;

  @Column({
    name: 'landmark',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  landmark: string;

  @Column({
    name: 'monthly_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  monthlyFee: number;

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
