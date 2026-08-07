import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentGatewayEnum, PaymentStatusEnum } from '../../enums/enums';
import { Order } from './order.entity';

@Entity({ name: 'payments', schema: 'e_schooling' })
export class Payment {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'order_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Order',
  })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.payments)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Index()
  @Column({
    name: 'school_subscription_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolSubscription',
  })
  schoolSubscriptionId: string;

  @Index()
  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to School',
  })
  schoolId: string;

  @Column({
    name: 'transaction_id',
    type: 'varchar',
    nullable: true,
    comment: 'Transaction ID',
  })
  transactionId: string;

  @Column({
    name: 'payment_gateway',
    type: 'varchar',
    nullable: true,
    comment: 'razorpay | stripe | cashfree',
  })
  paymentGateway: PaymentGatewayEnum;

  @Column({
    name: 'gateway_payment_id',
    type: 'varchar',
    nullable: true,
    comment: 'Gateway Payment ID',
  })
  gatewayPaymentId: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    nullable: true,
    comment: 'Payment amount',
  })
  amount: number;

  @Column({
    name: 'currency',
    type: 'varchar',
    nullable: true,
    comment: 'Payment currency',
  })
  currency: string;

  @Column({
    name: 'payment_state',
    type: 'varchar',
    nullable: true,
    comment: 'pending | success | failed | refunded',
  })
  paymentState: PaymentStatusEnum;

  @Column({
    name: 'paid_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Payment timestamp',
  })
  paidAt: Date;

  @Column({
    name: 'invoice_url',
    type: 'varchar',
    nullable: true,
    comment: 'Invoice PDF URL',
  })
  invoiceUrl: string;

  @Column({
    name: 'metadata',
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata',
  })
  metadata: unknown;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Creation timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: 'Last update timestamp',
  })
  updatedAt: Date;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'Active status toggle',
  })
  isActive: boolean;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Soft delete marker',
  })
  isDeleted: boolean;
}
